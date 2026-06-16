import { eq } from 'drizzle-orm';
import { db } from './client';
import { smokingLog, smokingLogTriggers, userSmokingSettings } from './schema';

// Insert a smoking log entry
export async function logSmokingEvent(triggers: string[] = []) {
  try {
    const db = await getDbAsync();

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
    const db = await getDbAsync();
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
    const db = await getDbAsync();
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
    const db = await getDbAsync();
    const logs = db.select().from(smokingLog).all();

    // Filter in JavaScript since expo-sqlite doesn't support complex where clauses well
    const filtered = logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= new Date(startDate) && logDate <= new Date(endDate);
    });

    return filtered.length;
  } catch (error) {
    console.error('Error fetching smoking count:', error);
    return 0;
  }
}

// Delete a smoking log entry
export async function deleteSmokingLog(logId: number) {
  try {
    const db = await getDbAsync();

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
    const db = await getDbAsync();
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const logs = db.select().from(smokingLog).all();

    // Initialize counts for each day
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat

    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      if (logDate >= startOfWeek && logDate <= endOfWeek) {
        const dayIndex = logDate.getDay();
        dayCounts[dayIndex]++;
      }
    });

    return dayCounts;
  } catch (error) {
    console.error('Error fetching weekly breakdown:', error);
    return [0, 0, 0, 0, 0, 0, 0];
  }
}

// Get today's logs with timestamps
export async function getTodayLogs() {
  try {
    const db = await getDbAsync();
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const logs = db.select().from(smokingLog).all();

    const todayLogs = logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= new Date(startOfDay) && logDate <= new Date(endOfDay);
    });

    return todayLogs;
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
    const db = await getDbAsync();
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const logs = db.select().from(smokingLog).all();

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

      const dayStart = new Date(currentDay);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(currentDay);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLogs = logs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= dayStart && logDate <= dayEnd;
      });

      breakdown.push({
        day: dayNames[currentDay.getDay()],
        date: currentDay.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        count: dayLogs.length,
        progress: dayLogs.length / 20, // Assume max 20 per day
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
    const db = await getDbAsync();
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

    const logs = db.select().from(smokingLog).all();

    const weekCounts = new Array(4).fill(0);

    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      if (logDate >= startOfMonth && logDate <= endOfMonth) {
        const weekIndex = Math.min(Math.floor((logDate.getDate() - 1) / 7), 3);
        weekCounts[weekIndex]++;
      }
    });

    return weekCounts;
  } catch (error) {
    console.error('Error fetching monthly breakdown:', error);
    return new Array(4).fill(0);
  }
}

// Get yearly breakdown for the current calendar year.
export async function getYearlyBreakdown() {
  try {
    const db = await getDbAsync();
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
    const logs = db.select().from(smokingLog).all();

    const monthCounts = new Array(12).fill(0);

    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      if (logDate >= startOfYear && logDate <= endOfYear) {
        monthCounts[logDate.getMonth()]++;
      }
    });

    return monthCounts;
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
    const db = await getDbAsync();
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const logs = db.select().from(smokingLog).all();
    const triggers = db.select().from(smokingLogTriggers).all();

    // Filter logs from last 7 days
    const recentLogIds = logs
      .filter((log) => new Date(log.timestamp) >= sevenDaysAgo)
      .map((log) => log.id);

    // Count triggers
    const triggerCounts: { [key: string]: number } = {};
    triggers.forEach((t) => {
      if (recentLogIds.includes(t.logId)) {
        triggerCounts[t.trigger] = (triggerCounts[t.trigger] || 0) + 1;
      }
    });

    // Find top trigger
    let topTrigger = null;
    let maxCount = 0;
    Object.entries(triggerCounts).forEach(([trigger, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topTrigger = trigger;
      }
    });

    return topTrigger;
  } catch (error) {
    console.error('Error fetching top trigger:', error);
    return null;
  }
}

// Get top 5 triggers from the last 7 days
export async function getTop5Triggers() {
  try {
    const db = await getDbAsync();
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const logs = db.select().from(smokingLog).all();
    const triggers = db.select().from(smokingLogTriggers).all();

    // Filter logs from last 7 days
    const recentLogIds = logs
      .filter((log) => new Date(log.timestamp) >= sevenDaysAgo)
      .map((log) => log.id);

    // Count triggers
    const triggerCounts: { [key: string]: number } = {};
    triggers.forEach((t) => {
      if (recentLogIds.includes(t.logId)) {
        triggerCounts[t.trigger] = (triggerCounts[t.trigger] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const sortedTriggers = Object.entries(triggerCounts)
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return sortedTriggers;
  } catch (error) {
    console.error('Error fetching top 5 triggers:', error);
    return [];
  }
}

// Calculate consecutive non-smoking days streak
export async function getNonSmokingStreak() {
  try {
    const logs = db.select().from(smokingLog).all();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    // Check if user smoked today
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const smokedToday = validLogs.some((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= todayStart && logDate <= todayEnd;
    });

    // If smoked today, streak is 0
    if (smokedToday) {
      return 0;
    }

    // Count consecutive non-smoking days going backwards from yesterday
    let streak = 0;
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday

    // Determine earliest valid log date so we don't count before tracking began
    const earliestLogDate = new Date(
      Math.min(...validLogs.map((l) => new Date(l.timestamp).getTime())),
    );
    earliestLogDate.setHours(0, 0, 0, 0);

    while (true) {
      // If we've gone before the earliest log, stop counting — user hadn't started
      if (checkDate < earliestLogDate) break;

      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const smokedOnDay = validLogs.some((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= dayStart && logDate <= dayEnd;
      });

      if (smokedOnDay) {
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
