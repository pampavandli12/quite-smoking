/**
 * Example of how to use the database in a component
 *
 * This file demonstrates best practices for:
 * - Logging smoking events
 * - Fetching statistics
 * - Displaying data
 */

import {
  getSmokingLogsWithTriggers,
  getTodayStats,
  getWeekStats,
  logSmokingEvent,
} from "@/db";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";

export function DatabaseExample() {
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Load statistics on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const today = await getTodayStats();
    const week = await getWeekStats();
    const logs = await getSmokingLogsWithTriggers();

    setTodayCount(today);
    setWeekCount(week);
    setRecentLogs(logs.slice(-5)); // Last 5 logs
  };

  const handleLogSmoke = async () => {
    // Example: Log with triggers
    const result = await logSmokingEvent(["stress", "break"]);

    if (result.success) {
      console.log("Logged successfully with ID:", result.logId);
      // Reload stats
      await loadStats();
    }
  };

  return (
    <View>
      <Text variant="headlineSmall">Database Example</Text>

      <Text>Today: {todayCount} cigarettes</Text>
      <Text>This week: {weekCount} cigarettes</Text>

      <Button onPress={handleLogSmoke}>Log Smoking Event</Button>

      <Text variant="titleMedium">Recent Logs:</Text>
      {recentLogs.map((log) => (
        <View key={log.id}>
          <Text>
            {log.timestamp} - Triggers: {log.triggers.join(", ")}
          </Text>
        </View>
      ))}
    </View>
  );
}
