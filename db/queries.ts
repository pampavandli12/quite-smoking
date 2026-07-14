import { eq } from 'drizzle-orm';
import { db, expoDb } from './client';
import { smokingLog, smokingLogTriggers, userSmokingSettings } from './schema';

const MIN_VALID_TIMESTAMP_MS = new Date('2000-01-01T00:00:00.000Z').getTime();

const TIMESTAMP_MS_SQL = `
  CASE
    WHEN typeof(timestamp) IN ('integer', 'real') THEN CAST(timestamp AS INTEGER)
    WHEN CAST(timestamp AS INTEGER) >= ${MIN_VALID_TIMESTAMP_MS} THEN CAST(timestamp AS INTEGER)
    ELSE CAST(strftime('%s', timestamp, 'utc') AS INTEGER) * 1000
  END
`;

const VALID_TIMESTAMP_SQL = `
  ${TIMESTAMP_MS_SQL} IS NOT NULL
  AND ${TIMESTAMP_MS_SQL} >= ${MIN_VALID_TIMESTAMP_MS}
`;

const TIMESTAMP_SECONDS_SQL = `(${TIMESTAMP_MS_SQL}) / 1000`;
const LOG_TIMESTAMP_MS_SQL = TIMESTAMP_MS_SQL.replace(/timestamp/g, 'l.timestamp');
const VALID_LOG_TIMESTAMP_SQL = VALID_TIMESTAMP_SQL.replace(
  /timestamp/g,
  'l.timestamp',
);

type CountRow = { count: number };
type BucketCountRow = { bucket: number; count: number };
type TriggerCountRow = { trigger: string; count: number };
type SmokingLogTimestampRow = { id: number; timestamp: number | string };
type SmokedDayRow = { day: string };

function toTimestampMs(date: string | Date) {
  const timestamp =
    date instanceof Date ? date.getTime() : new Date(date).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

async function countSmokingLogsBetween(
  startDate: string | Date,
  endDate: string | Date,
) {
  const startMs = toTimestampMs(startDate);
  const endMs = toTimestampMs(endDate);

  if (startMs === null || endMs === null) {
    return 0;
  }

  const row = await expoDb.getFirstAsync<CountRow>(
    `
      SELECT COUNT(*) as count
      FROM smoking_log
      WHERE ${VALID_TIMESTAMP_SQL}
        AND ${TIMESTAMP_MS_SQL} BETWEEN ? AND ?
    `,
    [startMs, endMs],
  );

  return row?.count ?? 0;
}

async function getBucketCounts(
  bucketSql: string,
  startDate: Date,
  endDate: Date,
) {
  const rows = await expoDb.getAllAsync<BucketCountRow>(
    `
      SELECT ${bucketSql} as bucket, COUNT(*) as count
      FROM smoking_log
      WHERE ${VALID_TIMESTAMP_SQL}
        AND ${TIMESTAMP_MS_SQL} BETWEEN ? AND ?
      GROUP BY bucket
    `,
    [startDate.getTime(), endDate.getTime()],
  );

  return rows;
}

function fillCounts(size: number, rows: BucketCountRow[]) {
  const counts = new Array(size).fill(0);

  rows.forEach((row) => {
    if (row.bucket >= 0 && row.bucket < size) {
      counts[row.bucket] = row.count;
    }
  });

  return counts;
}

// Insert a smoking log entry
export async function logSmokingEvent(triggers: string[] = []) {
  try {
    // Insert into smoking_log
    const result = await db.insert(smokingLog).values({}).returning();
    const logId = result[0].id;

    // Insert triggers if provided
    if (triggers.length > 0) {
      await db.insert(smokingLogTriggers).values(
        triggers.map((trigger) => ({
          logId,
          trigger,
        })),
      );
    }

    return { success: true, logId };
  } catch (error) {
    console.error('Error logging smoking event:', error);
    return { success: false, error };
  }
}

// Get all smoking logs
export async function getAllSmokingLogs() {
  try {
    const logs = db.select().from(smokingLog).all();

    // Filter out logs with invalid or ancient timestamps (bad data)
    const validLogs = (logs || []).filter((log) => {
      const d = new Date(log.timestamp);
      if (isNaN(d.getTime())) return false;
      // ignore anything before year 2000 as invalid/ancient
      return d.getFullYear() >= 2000;
    });

    // If there are no valid logs yet, user hasn't started tracking
    if (!validLogs || validLogs.length === 0) {
      return 0;
    }
    return logs;
  } catch (error) {
    console.error('Error fetching smoking logs:', error);
    return [];
  }
}

// Get smoking logs with triggers
export async function getSmokingLogsWithTriggers() {
  try {
    const logs = db
      .select({
        id: smokingLog.id,
        timestamp: smokingLog.timestamp,
        triggerId: smokingLogTriggers.id,
        trigger: smokingLogTriggers.trigger,
      })
      .from(smokingLog)
      .leftJoin(smokingLogTriggers, eq(smokingLog.id, smokingLogTriggers.logId))
      .all();

    // Group by log id
    const groupedLogs = logs.reduce((acc: any[], log: any) => {
      const existingLog = acc.find((l) => l.id === log.id);
      if (existingLog) {
        if (log.trigger) {
          existingLog.triggers.push(log.trigger);
        }
      } else {
        acc.push({
          id: log.id,
          timestamp: log.timestamp,
          triggers: log.trigger ? [log.trigger] : [],
        });
      }
      return acc;
    }, []);

    return groupedLogs;
  } catch (error) {
    console.error('Error fetching smoking logs with triggers:', error);
    return [];
  }
}

// Get smoking count for a specific date range
export async function getSmokingCountByDateRange(
  startDate: string,
  endDate: string,
) {
  try {
    return await countSmokingLogsBetween(startDate, endDate);
  } catch (error) {
    console.error('Error fetching smoking count:', error);
    return 0;
  }
}

// Delete a smoking log entry
export async function deleteSmokingLog(logId: number) {
  try {
    // Delete triggers first (foreign key constraint)
    await db
      .delete(smokingLogTriggers)
      .where(eq(smokingLogTriggers.logId, logId));

    // Delete the log
    await db.delete(smokingLog).where(eq(smokingLog.id, logId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting smoking log:', error);
    return { success: false, error };
  }
}

// Get smoking statistics for today
export async function getTodayStats() {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const count = await getSmokingCountByDateRange(startOfDay, endOfDay);
    return count;
  } catch (error) {
    console.error("Error fetching today's stats:", error);
    return 0;
  }
}

// Get smoking statistics for this week
export async function getWeekStats() {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const count = await getSmokingCountByDateRange(
      startOfWeek.toISOString(),
      endOfWeek.toISOString(),
    );
    return count;
  } catch (error) {
    console.error('Error fetching week stats:', error);
    return 0;
  }
}

// Get daily breakdown for the week
export async function getWeeklyBreakdown() {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const rows = await getBucketCounts(
      `CAST(strftime('%w', ${TIMESTAMP_SECONDS_SQL}, 'unixepoch', 'localtime') AS INTEGER)`,
      startOfWeek,
      endOfWeek,
    );

    return fillCounts(7, rows);
  } catch (error) {
    console.error('Error fetching weekly breakdown:', error);
    return [0, 0, 0, 0, 0, 0, 0];
  }
}

// Get today's logs with timestamps
export async function getTodayLogs() {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return await expoDb.getAllAsync<SmokingLogTimestampRow>(
      `
        SELECT id, timestamp
        FROM smoking_log
        WHERE ${VALID_TIMESTAMP_SQL}
          AND ${TIMESTAMP_MS_SQL} BETWEEN ? AND ?
        ORDER BY ${TIMESTAMP_MS_SQL} ASC, id ASC
      `,
      [startOfDay.getTime(), endOfDay.getTime()],
    );
  } catch (error) {
    console.error("Error fetching today's logs:", error);
    return [];
  }
}

// Get yesterday's count
export async function getYesterdayStats() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(
      yesterday.setHours(23, 59, 59, 999),
    ).toISOString();

    const count = await getSmokingCountByDateRange(startOfDay, endOfDay);
    return count;
  } catch (error) {
    console.error("Error fetching yesterday's stats:", error);
    return 0;
  }
}

// Get previous week's count for comparison
export async function getPreviousWeekStats() {
  try {
    const today = new Date();
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);

    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);

    const count = await getSmokingCountByDateRange(
      startOfLastWeek.toISOString(),
      endOfLastWeek.toISOString(),
    );
    return count;
  } catch (error) {
    console.error('Error fetching previous week stats:', error);
    return 0;
  }
}

// Get detailed daily breakdown with dates
export async function getDetailedWeeklyBreakdown() {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const dayCounts = await getWeeklyBreakdown();
    const breakdown = [];
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);

      const count = dayCounts[currentDay.getDay()] ?? 0;

      breakdown.push({
        day: dayNames[currentDay.getDay()],
        date: currentDay.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        count,
        progress: count / 20, // Assume max 20 per day
      });
    }

    return breakdown;
  } catch (error) {
    console.error('Error fetching detailed weekly breakdown:', error);
    return [];
  }
}

// Get monthly breakdown for the current calendar month, grouped into 4 weeks.
export async function getMonthlyBreakdown() {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const dayOfMonthSql = `CAST(strftime('%d', ${TIMESTAMP_SECONDS_SQL}, 'unixepoch', 'localtime') AS INTEGER)`;
    const rows = await getBucketCounts(
      `MIN(CAST((${dayOfMonthSql} - 1) / 7 AS INTEGER), 3)`,
      startOfMonth,
      endOfMonth,
    );

    return fillCounts(4, rows);
  } catch (error) {
    console.error('Error fetching monthly breakdown:', error);
    return new Array(4).fill(0);
  }
}

// Get yearly breakdown for the current calendar year.
export async function getYearlyBreakdown() {
  try {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

    const rows = await getBucketCounts(
      `CAST(strftime('%m', ${TIMESTAMP_SECONDS_SQL}, 'unixepoch', 'localtime') AS INTEGER) - 1`,
      startOfYear,
      endOfYear,
    );

    return fillCounts(12, rows);
  } catch (error) {
    console.error('Error fetching yearly breakdown:', error);
    return new Array(12).fill(0);
  }
}

// --- User smoking settings (cigarettes per day & cost) ---
export async function getSmokingSettings() {
  try {
    const rows = db.select().from(userSmokingSettings).all();
    if (!rows || rows.length === 0) return null;

    // Return the most recent settings (by createdAt)
    const sorted = rows.sort((a: any, b: any) => b.createdAt - a.createdAt);
    const s = sorted[0];
    return {
      id: s.id,
      cigarettesPerDay: s.cigarettesPerDay,
      costPerCigaretteCents: s.costPerCigaretteCents,
      createdAt: s.createdAt,
    };
  } catch (error) {
    console.error('Error fetching smoking settings:', error);
    return null;
  }
}

export async function setSmokingSettings(
  cigarettesPerDay: number,
  costPerCigarette: number,
) {
  try {
    const cents = Math.round(costPerCigarette * 100);
    const result = await db
      .insert(userSmokingSettings)
      .values({ cigarettesPerDay, costPerCigaretteCents: cents })
      .returning();

    return { success: true, result };
  } catch (error) {
    console.error('Error saving smoking settings:', error);
    return { success: false, error };
  }
}

// Get top trigger from the last 7 days
export async function getTopTrigger() {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const topTrigger = await expoDb.getFirstAsync<TriggerCountRow>(
      `
        SELECT t.trigger, COUNT(*) as count
        FROM smoking_log_triggers t
        INNER JOIN smoking_log l ON l.id = t.log_id
        WHERE ${VALID_LOG_TIMESTAMP_SQL}
          AND ${LOG_TIMESTAMP_MS_SQL} >= ?
        GROUP BY t.trigger
        ORDER BY count DESC, t.trigger ASC
        LIMIT 1
      `,
      [sevenDaysAgo.getTime()],
    );

    return topTrigger?.trigger ?? null;
  } catch (error) {
    console.error('Error fetching top trigger:', error);
    return null;
  }
}

// Get top 5 triggers from the last 7 days
export async function getTop5Triggers() {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    return await expoDb.getAllAsync<TriggerCountRow>(
      `
        SELECT t.trigger, COUNT(*) as count
        FROM smoking_log_triggers t
        INNER JOIN smoking_log l ON l.id = t.log_id
        WHERE ${VALID_LOG_TIMESTAMP_SQL}
          AND ${LOG_TIMESTAMP_MS_SQL} >= ?
        GROUP BY t.trigger
        ORDER BY count DESC, t.trigger ASC
        LIMIT 5
      `,
      [sevenDaysAgo.getTime()],
    );
  } catch (error) {
    console.error('Error fetching top 5 triggers:', error);
    return [];
  }
}

// Calculate consecutive non-smoking days streak
export async function getNonSmokingStreak() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = await expoDb.getAllAsync<SmokedDayRow>(
      `
        SELECT DISTINCT strftime(
          '%Y-%m-%d',
          ${TIMESTAMP_SECONDS_SQL},
          'unixepoch',
          'localtime'
        ) as day
        FROM smoking_log
        WHERE ${VALID_TIMESTAMP_SQL}
        ORDER BY day ASC
      `,
    );

    // If there are no valid logs yet, user hasn't started tracking
    if (!rows || rows.length === 0) {
      return 0;
    }

    const smokedDays = new Set(rows.map((row) => row.day));
    const todayKey = formatLocalDateKey(today);

    // If smoked today, streak is 0
    if (smokedDays.has(todayKey)) {
      return 0;
    }

    // Count consecutive non-smoking days going backwards from yesterday
    let streak = 0;
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday

    // Determine earliest valid log date so we don't count before tracking began
    const earliestLogDay = rows[0].day;

    while (true) {
      const checkDay = formatLocalDateKey(checkDate);

      // If we've gone before the earliest log, stop counting — user hadn't started
      if (checkDay < earliestLogDay) break;

      if (smokedDays.has(checkDay)) {
        break; // Found a day with smoking, stop counting
      }

      streak++;
      checkDate.setDate(checkDate.getDate() - 1);

      // Safety cap
      if (streak > 10000) break;
    }

    return streak;
  } catch (error) {
    console.error('Error calculating non-smoking streak:', error);
    return 0;
  }
}
