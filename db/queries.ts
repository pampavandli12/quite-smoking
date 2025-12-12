import { eq } from "drizzle-orm";
import { db } from "./client";
import { smokingLog, smokingLogTriggers } from "./schema";

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
        }))
      );
    }

    return { success: true, logId };
  } catch (error) {
    console.error("Error logging smoking event:", error);
    return { success: false, error };
  }
}

// Get all smoking logs
export async function getAllSmokingLogs() {
  try {
    const logs = db.select().from(smokingLog).all();
    return logs;
  } catch (error) {
    console.error("Error fetching smoking logs:", error);
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
    console.error("Error fetching smoking logs with triggers:", error);
    return [];
  }
}

// Get smoking count for a specific date range
export async function getSmokingCountByDateRange(
  startDate: string,
  endDate: string
) {
  try {
    const logs = db.select().from(smokingLog).all();

    // Filter in JavaScript since expo-sqlite doesn't support complex where clauses well
    const filtered = logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= new Date(startDate) && logDate <= new Date(endDate);
    });

    return filtered.length;
  } catch (error) {
    console.error("Error fetching smoking count:", error);
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
    console.error("Error deleting smoking log:", error);
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
      endOfWeek.toISOString()
    );
    return count;
  } catch (error) {
    console.error("Error fetching week stats:", error);
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

    const logs = db.select().from(smokingLog).all();

    // Initialize counts for each day
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat

    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      if (logDate >= startOfWeek) {
        const dayIndex = logDate.getDay();
        dayCounts[dayIndex]++;
      }
    });

    return dayCounts;
  } catch (error) {
    console.error("Error fetching weekly breakdown:", error);
    return [0, 0, 0, 0, 0, 0, 0];
  }
}

// Get today's logs with timestamps
export async function getTodayLogs() {
  try {
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
      yesterday.setHours(23, 59, 59, 999)
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
      endOfLastWeek.toISOString()
    );
    return count;
  } catch (error) {
    console.error("Error fetching previous week stats:", error);
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

    const logs = db.select().from(smokingLog).all();

    const breakdown = [];
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
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
        date: currentDay.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count: dayLogs.length,
        progress: dayLogs.length / 20, // Assume max 20 per day
      });
    }

    return breakdown;
  } catch (error) {
    console.error("Error fetching detailed weekly breakdown:", error);
    return [];
  }
}

// Get monthly breakdown (30 days)
export async function getMonthlyBreakdown() {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const logs = db.select().from(smokingLog).all();

    const dayCounts = new Array(30).fill(0);

    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      const daysDiff = Math.floor(
        (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= 0 && daysDiff < 30) {
        dayCounts[29 - daysDiff]++;
      }
    });

    return dayCounts;
  } catch (error) {
    console.error("Error fetching monthly breakdown:", error);
    return new Array(30).fill(0);
  }
}

// Get yearly breakdown (12 months)
export async function getYearlyBreakdown() {
  try {
    const today = new Date();
    const logs = db.select().from(smokingLog).all();

    const monthCounts = new Array(12).fill(0);

    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      const yearDiff = today.getFullYear() - logDate.getFullYear();
      const monthDiff = today.getMonth() - logDate.getMonth();
      const totalMonthsDiff = yearDiff * 12 + monthDiff;

      if (totalMonthsDiff >= 0 && totalMonthsDiff < 12) {
        monthCounts[11 - totalMonthsDiff]++;
      }
    });

    return monthCounts;
  } catch (error) {
    console.error("Error fetching yearly breakdown:", error);
    return new Array(12).fill(0);
  }
}

// Get top trigger from the last 7 days
export async function getTopTrigger() {
  try {
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
    console.error("Error fetching top trigger:", error);
    return null;
  }
}

// Get top 5 triggers from the last 7 days
export async function getTop5Triggers() {
  try {
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
    console.error("Error fetching top 5 triggers:", error);
    return [];
  }
}

// Get last 3 days breakdown
export async function getLast3DaysBreakdown() {
  try {
    const today = new Date();
    const logs = db.select().from(smokingLog).all();

    // Initialize counts for last 3 days (day before yesterday, yesterday, today)
    const dayCounts = [0, 0, 0];

    logs.forEach((log) => {
      const logDate = new Date(log.timestamp);
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const logStart = new Date(
        logDate.getFullYear(),
        logDate.getMonth(),
        logDate.getDate()
      );

      // Calculate days difference
      const diffTime = todayStart.getTime() - logStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        dayCounts[2]++; // Today
      } else if (diffDays === 1) {
        dayCounts[1]++; // Yesterday
      } else if (diffDays === 2) {
        dayCounts[0]++; // Day before yesterday
      }
    });

    return dayCounts;
  } catch (error) {
    console.error("Error fetching last 3 days breakdown:", error);
    return [0, 0, 0];
  }
}
