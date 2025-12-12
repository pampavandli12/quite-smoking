import {
  getLast3DaysBreakdown,
  getMonthlyBreakdown,
  getTodayLogs,
  getTodayStats,
  getWeeklyBreakdown,
  getYearlyBreakdown,
  getYesterdayStats,
  logSmokingEvent,
} from "@/db";
import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  SegmentedButtons,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const stressTriggers = [
  "stress",
  "coffee",
  "alcohol",
  "social situations",
  "after meals",
  "boredom",
  "anxiety",
  "work pressure",
  "driving",
  "phone scrolling / gaming",
];

export default function HomePage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [last3DaysData, setLast3DaysData] = useState([0, 0, 0]);
  const [loading, setLoading] = useState(true);

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth;

  // Load data from database
  const loadStats = async () => {
    try {
      setLoading(true);
      const [today, yesterday, logs, last3Days] = await Promise.all([
        getTodayStats(),
        getYesterdayStats(),
        getTodayLogs(),
        getLast3DaysBreakdown(),
      ]);

      setTodayCount(today);
      setYesterdayCount(yesterday);
      setTodayLogs(logs);
      setLast3DaysData(last3Days);

      // Load period-specific data
      if (selectedPeriod === "week") {
        const weekly = await getWeeklyBreakdown();
        setChartData(weekly);
      } else if (selectedPeriod === "month") {
        const monthly = await getMonthlyBreakdown();
        setChartData(monthly);
      } else {
        const yearly = await getYearlyBreakdown();
        setChartData(yearly);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  // Chart labels based on period
  const getChartLabels = () => {
    if (selectedPeriod === "week") {
      return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    } else if (selectedPeriod === "month") {
      // Show every 5th day for readability
      return Array.from({ length: 30 }, (_, i) => {
        if (
          i === 0 ||
          i === 4 ||
          i === 9 ||
          i === 14 ||
          i === 19 ||
          i === 24 ||
          i === 29
        ) {
          return `${i + 1}`;
        }
        return "";
      });
    } else {
      return [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
    }
  };

  // Chart data from database
  const weeklyChartData = {
    labels: getChartLabels(),
    datasets: [
      {
        data: chartData.length > 0 ? chartData : [0],
      },
    ],
  };

  // Mini chart data - last 3 days breakdown
  const todayData = {
    labels: ["", "", ""],
    datasets: [
      {
        data: last3DaysData.length > 0 ? last3DaysData : [0, 0, 0],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      const primary = theme.colors.primary;
      return `${primary}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0")}`;
    },
    labelColor: (opacity = 1) => theme.colors.onSurface,
    strokeWidth: 3,
    propsForBackgroundLines: {
      stroke: "transparent",
    },
    propsForLabels: {
      fontSize: selectedPeriod === "month" ? 10 : 11,
      fontWeight: "400",
    },
    propsForDots: {
      r: "5",
      strokeWidth: "3",
      stroke: theme.colors.primary,
      fill: theme.colors.surface,
    },
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: 32,
      }}
    >
      <Surface style={styles.content} elevation={0}>
        {/* Header */}
        <Surface style={styles.header} elevation={0}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Smoke Track
          </Text>
          <IconButton
            icon="account-circle-outline"
            size={28}
            onPress={() => {}}
          />
        </Surface>

        {/* Today's Count Card */}
        <Card style={styles.todayCard}>
          <Card.Content>
            <Surface style={styles.todayContent} elevation={0}>
              <Surface style={styles.todayLeft} elevation={0}>
                <Text variant="bodyMedium" style={styles.todayLabel}>
                  Today&apos;s Count
                </Text>
                <Text variant="displaySmall" style={styles.todayCount}>
                  {todayCount}
                </Text>
              </Surface>
              <Surface style={styles.miniChartContainer} elevation={0}>
                <LineChart
                  data={todayData}
                  width={120}
                  height={60}
                  chartConfig={{
                    backgroundColor: "#cecedd54",
                    backgroundGradientFrom: "#cecedd54",
                    backgroundGradientTo: "#cecedd54",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
                    strokeWidth: 2,
                    fillShadowGradient: "#cecedd54",
                    fillShadowGradientOpacity: 0.3,
                    propsForDots: {
                      r: "5",
                      strokeWidth: "2",
                      stroke: "#4285F4",
                      fill: "#4285F4",
                    },
                    propsForBackgroundLines: {
                      stroke: "#cecedd54",
                    },
                  }}
                  bezier
                  withDots={true}
                  withShadow={true}
                  withInnerLines={false}
                  withOuterLines={false}
                  withVerticalLabels={false}
                  withHorizontalLabels={false}
                  style={styles.miniChart}
                />
              </Surface>
            </Surface>
          </Card.Content>
        </Card>

        {/* Log Smoking Button */}
        <Button
          mode="contained"
          style={styles.logButton}
          contentStyle={styles.logButtonContent}
          icon="plus"
          onPress={async () => {
            const result = await logSmokingEvent(selectedTriggers);
            if (result.success) {
              setSelectedTriggers([]);
              await loadStats();
            }
          }}
          loading={loading}
          disabled={loading}
        >
          Log Smoking
        </Button>

        {/* Stress Triggers */}
        <Surface style={styles.triggersSection} elevation={0}>
          <Text variant="titleSmall" style={styles.triggersLabel}>
            What triggered it?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.triggersContainer}
          >
            {stressTriggers.map((trigger) => (
              <Chip
                key={trigger}
                selected={selectedTriggers.includes(trigger)}
                onPress={() => {
                  if (selectedTriggers.includes(trigger)) {
                    setSelectedTriggers([]);
                  } else {
                    setSelectedTriggers([trigger]);
                  }
                }}
                style={styles.triggerChip}
                mode="outlined"
              >
                {trigger}
              </Chip>
            ))}
          </ScrollView>
        </Surface>

        {/* Period Selector */}
        <Surface style={styles.periodSelector} elevation={0}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "year", label: "Year" },
            ]}
            style={styles.segmentedButtons}
          />
        </Surface>

        {/* Main Chart */}
        <Surface style={styles.chartContainer} elevation={0}>
          {chartData.length > 0 && chartData.some((val) => val > 0) ? (
            <LineChart
              data={weeklyChartData}
              width={chartWidth + 16}
              height={260}
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
              withDots={true}
              withShadow={false}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              segments={4}
              fromZero
              yAxisSuffix=""
              onDataPointClick={(data) => {
                console.log(data);
              }}
            />
          ) : (
            <Surface style={styles.emptyChartContainer} elevation={0}>
              <Icon
                source="chart-line"
                size={48}
                color={theme.colors.primary}
              />
              <Text variant="bodyLarge" style={styles.emptyChartText}>
                No data yet
              </Text>
              <Text variant="bodySmall" style={styles.emptyChartSubtext}>
                Start logging to see your {selectedPeriod}ly progress
              </Text>
            </Surface>
          )}
        </Surface>

        {/* Detailed Statistics */}
        <Surface style={styles.section} elevation={0}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Detailed Statistics
          </Text>

          <Card style={styles.statCard}>
            <Card.Content>
              <Surface style={styles.statRow} elevation={0}>
                <Text variant="titleMedium">Today</Text>
                <Text variant="titleMedium" style={styles.countText}>
                  {todayCount} {todayCount === 1 ? "cigarette" : "cigarettes"}
                </Text>
              </Surface>
              {todayLogs.length > 0 && (
                <Surface style={styles.timeRow} elevation={0}>
                  <Icon
                    source="clock-outline"
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text variant="bodySmall" style={styles.timeText}>
                    {todayLogs
                      .map((log) => {
                        const time = new Date(log.timestamp);
                        return time.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });
                      })
                      .join(", ")}
                  </Text>
                </Surface>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Surface style={styles.statRow} elevation={0}>
                <Text variant="titleMedium">Yesterday</Text>
                <Text variant="titleMedium" style={styles.countText}>
                  {yesterdayCount}{" "}
                  {yesterdayCount === 1 ? "cigarette" : "cigarettes"}
                </Text>
              </Surface>
            </Card.Content>
          </Card>
        </Surface>

        {/* Weekly Insights */}
        <Surface style={styles.section} elevation={0}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Weekly Insights
          </Text>

          <Surface style={styles.insightItem} elevation={0}>
            <Icon source="chart-line" size={20} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.insightText}>
              Average:{" "}
              {weeklyData.length > 0
                ? Math.round(weeklyData.reduce((a, b) => a + b, 0) / 7)
                : 0}{" "}
              cigarettes per day
            </Text>
          </Surface>

          <Surface style={styles.insightItem} elevation={0}>
            <Icon
              source="calendar-week"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="bodyMedium" style={styles.insightText}>
              Total this week: {weeklyData.reduce((a, b) => a + b, 0)}{" "}
              cigarettes
            </Text>
          </Surface>

          <Surface style={styles.insightItem} elevation={0}>
            <Icon source="information" size={20} color="#4285F4" />
            <Text variant="bodyMedium" style={styles.insightText}>
              Track your progress by logging each cigarette
            </Text>
          </Surface>
        </Surface>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontWeight: "600",
  },
  todayCard: {
    marginBottom: 16,
  },
  todayContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  todayLeft: {
    flex: 1,
    backgroundColor: "transparent",
  },
  todayLabel: {
    marginBottom: 8,
    opacity: 0.7,
  },
  todayCount: {
    fontWeight: "bold",
    color: "#4285F4",
  },
  miniChartContainer: {
    minWidth: 120,
    minHeight: 60,
    backgroundColor: "#aeaec254",
    borderRadius: 8,
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  miniChart: {
    marginLeft: -16,
    marginRight: -16,
    borderRadius: 0,
  },
  logButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  logButtonContent: {
    paddingVertical: 6,
  },
  triggersSection: {
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  triggersLabel: {
    marginBottom: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  triggersContainer: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  triggerChip: {
    marginBottom: 0,
  },
  periodSelector: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  segmentedButtons: {
    backgroundColor: "transparent",
  },
  chartContainer: {
    marginBottom: 24,
    marginHorizontal: -16,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  chart: {
    marginLeft: -16,
    marginRight: -16,
    borderRadius: 0,
    paddingRight: 0,
  },
  emptyChartContainer: {
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 40,
  },
  emptyChartText: {
    marginTop: 16,
    fontWeight: "600",
    opacity: 0.7,
  },
  emptyChartSubtext: {
    marginTop: 4,
    opacity: 0.5,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 16,
  },
  statCard: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  countText: {
    color: "#4285F4",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "transparent",
  },
  timeText: {
    opacity: 0.7,
    flex: 1,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  insightText: {
    flex: 1,
  },
});
