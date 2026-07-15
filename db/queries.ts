import {
  and,
  asc,
  between,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  sql,
} from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { db, ensureDatabaseReady } from './client';
import {
  smokingLog,
  smokingLogTriggers,
  userSmokingSettings,
} from './schema';

const MIN_VALID_TIMESTAMP_MS = new Date('2000-01-01T00:00:00.000Z').getTime();

type BucketCountRow = { bucket: number; count: number };
type TriggerCountRow = { trigger: string; count: number };
type SmokingLogTimestampRow = { id: number; timestamp: number | string };
type SmokingLogRow = { id: number; timestamp: number | string };
type SmokingLogWithTriggerRow = {
  id: number;
  timestamp: number | string;
  triggerId: number | null;
  trigger: string | null;
};
type SmokingLogWithTriggers = {
  id: number;
  timestamp: number | string;
  triggers: string[];
};
type SmokedDayRow = { day: string };
type SmokingSettingsRow = {
  id: number;
  cigarettesPerDay: number;
  costPerCigaretteCents: number;
  createdAt: number | string;
};

async function readDatabase<T>(operation: () => T | Promise<T>) {
  await ensureDatabaseReady();
  return await operation();
}

function timestampMs(column: AnySQLiteColumn) {
  return sql<number>`
    CASE
      WHEN typeof(${column}) IN ('integer', 'real') THEN CAST(${column} AS INTEGER)
      WHEN CAST(${column} AS INTEGER) >= ${MIN_VALID_TIMESTAMP_MS} THEN CAST(${column} AS INTEGER)
      ELSE CAST(strftime('%s', ${column}, 'utc') AS INTEGER) * 1000
    END
  `;
}

function validTimestamp(column: AnySQLiteColumn) {
  const value = timestampMs(column);

  return and(isNotNull(value), gte(value, MIN_VALID_TIMESTAMP_MS));
}

function timestampSeconds(column: AnySQLiteColumn) {
  return sql<number>`(${timestampMs(column)}) / 1000`;
}

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

  const timestamp = timestampMs(smokingLog.timestamp);
  const [row] = await readDatabase(() =>
    db
      .select({ count: count() })
      .from(smokingLog)
      .where(
        and(
          validTimestamp(smokingLog.timestamp),
          between(timestamp, startMs, endMs),
        ),
      ),
  );

  return row?.count ?? 0;
}

async function getBucketCounts(
  bucketExpression: SQL<number>,
  startDate: Date,
  endDate: Date,
) {
  const timestamp = timestampMs(smokingLog.timestamp);

  return await readDatabase(() =>
    db
      .select({
        bucket: bucketExpression,
        count: count(),
      })
      .from(smokingLog)
      .where(
        and(
          validTimestamp(smokingLog.timestamp),
          between(timestamp, startDate.getTime(), endDate.getTime()),
        ),
      )
      .groupBy(bucketExpression),
  );
}

function fillCounts(size: number, rows: BucketCountRow[]) {
  const counts = new Array(size).fill(0);

  rows.forEach((row) => {
    const bucket = Number(row.bucket);

    if (bucket >= 0 && bucket < size) {
      counts[bucket] = row.count;
    }
  });

  return counts;
}

// Insert a smoking log entry
export async function logSmokingEvent(triggers: string[] = []) {
  try {
    const timestamp = Date.now();
    const logId = await readDatabase(() =>
      db.transaction((tx) => {
        const insertedLog = tx
          .insert(smokingLog)
          .values({ timestamp })
          .returning({ id: smokingLog.id })
          .get();

        if (!insertedLog?.id) {
          throw new Error('Smoking log insert did not return an id.');
        }

        if (triggers.length > 0) {
          tx.insert(smokingLogTriggers)
            .values(
              triggers.map((trigger) => ({
                logId: insertedLog.id,
                trigger,
              })),
            )
            .run();
        }

        return insertedLog.id;
      }),
    );

    return { success: true, logId };
  } catch (error) {
    console.error('Error logging smoking event:', error);
    return { success: false, error };
  }
}

// Get all smoking logs
export async function getAllSmokingLogs() {
  try {
    const logs = await readDatabase<SmokingLogRow[]>(() =>
      db
        .select({
          id: smokingLog.id,
          timestamp: smokingLog.timestamp,
        })
        .from(smokingLog)
        .orderBy(desc(smokingLog.timestamp), desc(smokingLog.id)),
    );

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
    const logs = await readDatabase<SmokingLogWithTriggerRow[]>(() =>
      db
        .select({
          id: smokingLog.id,
          timestamp: smokingLog.timestamp,
          triggerId: smokingLogTriggers.id,
          trigger: smokingLogTriggers.trigger,
        })
        .from(smokingLog)
        .leftJoin(
          smokingLogTriggers,
          eq(smokingLog.id, smokingLogTriggers.logId),
        )
        .orderBy(
          desc(smokingLog.timestamp),
          desc(smokingLog.id),
          asc(smokingLogTriggers.id),
        ),
    );

    return logs.reduce<SmokingLogWithTriggers[]>((acc, log) => {
      const existingLog = acc.find((item) => item.id === log.id);
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
    await readDatabase(() =>
      db.transaction((tx) => {
        tx.delete(smokingLogTriggers)
          .where(eq(smokingLogTriggers.logId, logId))
          .run();

        tx.delete(smokingLog).where(eq(smokingLog.id, logId)).run();
      }),
    );

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

    const currentCount = await getSmokingCountByDateRange(
      startOfDay,
      endOfDay,
    );
    return currentCount;
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

    const currentCount = await getSmokingCountByDateRange(
      startOfWeek.toISOString(),
      endOfWeek.toISOString(),
    );
    return currentCount;
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
      sql<number>`CAST(strftime('%w', ${timestampSeconds(smokingLog.timestamp)}, 'unixepoch', 'localtime') AS INTEGER)`,
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
    const timestamp = timestampMs(smokingLog.timestamp);

    return await readDatabase<SmokingLogTimestampRow[]>(() =>
      db
        .select({
          id: smokingLog.id,
          timestamp: smokingLog.timestamp,
        })
        .from(smokingLog)
        .where(
          and(
            validTimestamp(smokingLog.timestamp),
            between(timestamp, startOfDay.getTime(), endOfDay.getTime()),
          ),
        )
        .orderBy(asc(timestamp), asc(smokingLog.id)),
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

    const currentCount = await getSmokingCountByDateRange(
      startOfDay,
      endOfDay,
    );
    return currentCount;
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

    const currentCount = await getSmokingCountByDateRange(
      startOfLastWeek.toISOString(),
      endOfLastWeek.toISOString(),
    );
    return currentCount;
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

      const currentCount = dayCounts[currentDay.getDay()] ?? 0;

      breakdown.push({
        day: dayNames[currentDay.getDay()],
        date: currentDay.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        count: currentCount,
        progress: currentCount / 20, // Assume max 20 per day
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
    const dayOfMonth = sql<number>`CAST(strftime('%d', ${timestampSeconds(
      smokingLog.timestamp,
    )}, 'unixepoch', 'localtime') AS INTEGER)`;

    const rows = await getBucketCounts(
      sql<number>`MIN(CAST((${dayOfMonth} - 1) / 7 AS INTEGER), 3)`,
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
      sql<number>`CAST(strftime('%m', ${timestampSeconds(smokingLog.timestamp)}, 'unixepoch', 'localtime') AS INTEGER) - 1`,
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
    const [settings] = await readDatabase<SmokingSettingsRow[]>(() =>
      db
        .select({
          id: userSmokingSettings.id,
          cigarettesPerDay: userSmokingSettings.cigarettesPerDay,
          costPerCigaretteCents:
            userSmokingSettings.costPerCigaretteCents,
          createdAt: userSmokingSettings.createdAt,
        })
        .from(userSmokingSettings)
        .orderBy(
          desc(userSmokingSettings.createdAt),
          desc(userSmokingSettings.id),
        )
        .limit(1),
    );

    return settings ?? null;
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
    const createdAt = Date.now();
    const row = await readDatabase(() =>
      db
        .insert(userSmokingSettings)
        .values({
          cigarettesPerDay,
          costPerCigaretteCents: cents,
          createdAt,
        })
        .returning({
          id: userSmokingSettings.id,
          cigarettesPerDay: userSmokingSettings.cigarettesPerDay,
          costPerCigaretteCents:
            userSmokingSettings.costPerCigaretteCents,
          createdAt: userSmokingSettings.createdAt,
        })
        .get(),
    );
    const result = row ? [row] : [];

    return { success: true, result };
  } catch (error) {
    console.error('Error saving smoking settings:', error);
    return { success: false, error };
  }
}

async function getTriggerCounts(limit: number) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const triggerCount = count();

  return await readDatabase<TriggerCountRow[]>(() =>
    db
      .select({
        trigger: smokingLogTriggers.trigger,
        count: triggerCount,
      })
      .from(smokingLogTriggers)
      .innerJoin(smokingLog, eq(smokingLog.id, smokingLogTriggers.logId))
      .where(
        and(
          validTimestamp(smokingLog.timestamp),
          gte(timestampMs(smokingLog.timestamp), sevenDaysAgo.getTime()),
        ),
      )
      .groupBy(smokingLogTriggers.trigger)
      .orderBy(desc(triggerCount), asc(smokingLogTriggers.trigger))
      .limit(limit),
  );
}

// Get top trigger from the last 7 days
export async function getTopTrigger() {
  try {
    const [topTrigger] = await getTriggerCounts(1);

    return topTrigger?.trigger ?? null;
  } catch (error) {
    console.error('Error fetching top trigger:', error);
    return null;
  }
}

// Get top 5 triggers from the last 7 days
export async function getTop5Triggers() {
  try {
    return await getTriggerCounts(5);
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

    const day = sql<string>`strftime(
      '%Y-%m-%d',
      ${timestampSeconds(smokingLog.timestamp)},
      'unixepoch',
      'localtime'
    )`;

    const rows = await readDatabase<SmokedDayRow[]>(() =>
      db
        .selectDistinct({ day })
        .from(smokingLog)
        .where(validTimestamp(smokingLog.timestamp))
        .orderBy(asc(day)),
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

      // If we've gone before the earliest log, stop counting.
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
