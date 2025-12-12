import {
  getDetailedWeeklyBreakdown,
  getMonthlyBreakdown,
  getPreviousWeekStats,
  getTodayStats,
  getTop5Triggers,
  getTopTrigger,
  getWeeklyBreakdown,
  getWeekStats,
  getYearlyBreakdown,
  getYesterdayStats,
} from "@/db";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  Card,
  Icon,
  SegmentedButtons,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StatsPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [currentTotal, setCurrentTotal] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [dailyBreakdown, setDailyBreakdown] = useState<any[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthInsight, setHealthInsight] = useState("");
  const [todayCount, setTodayCount] = useState(0);
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [topTriggers, setTopTriggers] = useState<
    { trigger: string; count: number }[]
  >([]);

  const screenWidth = Dimensions.get("window").width;

  // Health insight message generators
  const getProgressMessage = (today: number, yesterday: number) => {
    if (today < yesterday) {
      return "Great job! You smoked fewer cigarettes today than yesterday 🎉";
    } else if (today > yesterday) {
      return "You smoked more today than yesterday. Think about what triggered it 💭";
    } else {
      return "Consistent! You smoked the same as yesterday. Try to cut down tomorrow 💪";
    }
  };

  const getTriggerMessage = (trigger: string) => {
    switch (trigger) {
      case "stress":
        return "Stress seems to be your biggest trigger. Try deep breathing or a short walk instead 🧘";
      case "coffee":
        return "Coffee often makes you want to smoke. How about switching to tea once a day? ☕➡️🍵";
      case "alcohol":
        return "Alcohol is a strong trigger for smoking. Plan ahead if you're going out 🍺";
      case "after meals":
        return "Smoking after meals is common. Try brushing your teeth or chewing gum instead 🪥";
      case "boredom":
        return "Boredom is a sneaky trigger. Keep your hands busy with a quick hobby or game 🎮";
      case "work pressure":
        return "Work pressure often drives smoking. Step away for a 2-minute walk instead 🚶";
      case "driving":
        return "Driving can be a strong trigger. Keep sugar-free mints in your car 🚗";
      case "phone scrolling / gaming":
        return "Scrolling or gaming often pairs with smoking. Try short breaks without a cigarette 📱";
      case "anxiety":
        return "Anxiety can make you reach for cigarettes. Try a 5-minute meditation instead 🧘";
      case "social situations":
        return "Social situations can be tough. Plan your response ahead of time 👥";
      default:
        return `Looks like "${trigger}" is your top trigger. Can you think of a healthy alternative? 💡`;
    }
  };

  const fallbackMessages = [
    "Every cigarette skipped is a victory 🏆",
    "Within 20 minutes of not smoking, your heart rate drops ❤️",
    "Your lungs start to heal the moment you reduce smoking 🫁",
    "You're stronger than your cravings 💪",
    "Small steps every day lead to big changes 🌟",
  ];

  const getFallbackMessage = () => {
    return fallbackMessages[
      Math.floor(Math.random() * fallbackMessages.length)
    ];
  };

  // Generate health insight
  const generateHealthInsight = async () => {
    try {
      const [today, yesterday, topTrigger] = await Promise.all([
        getTodayStats(),
        getYesterdayStats(),
        getTopTrigger(),
      ]);

      setTodayCount(today);
      setYesterdayCount(yesterday);

      // Priority 1: Progress message if there's data
      if (today > 0 || yesterday > 0) {
        setHealthInsight(getProgressMessage(today, yesterday));
        return;
      }

      // Priority 2: Trigger message if there's a top trigger
      if (topTrigger) {
        setHealthInsight(getTriggerMessage(topTrigger));
        return;
      }

      // Priority 3: Fallback message
      setHealthInsight(getFallbackMessage());
    } catch (error) {
      console.error("Error generating health insight:", error);
      setHealthInsight(getFallbackMessage());
    }
  };

  // Load stats from database
  const loadStats = async () => {
    try {
      setLoading(true);

      if (selectedPeriod === "week") {
        const [currentWeek, previousWeek, breakdown, weeklyData, triggers] =
          await Promise.all([
            getWeekStats(),
            getPreviousWeekStats(),
            getDetailedWeeklyBreakdown(),
            getWeeklyBreakdown(),
            getTop5Triggers(),
          ]);

        setCurrentTotal(currentWeek);
        setPreviousTotal(previousWeek);
        setDailyBreakdown(breakdown);
        setChartData(weeklyData);
        setTopTriggers(triggers);
      } else if (selectedPeriod === "month") {
        const monthlyData = await getMonthlyBreakdown();
        const total = monthlyData.reduce((sum, val) => sum + val, 0);
        setCurrentTotal(total);
        setPreviousTotal(0); // Could implement previous month comparison
        setChartData(monthlyData);
        setDailyBreakdown([]);
        setTopTriggers([]);
      } else {
        const yearlyData = await getYearlyBreakdown();
        const total = yearlyData.reduce((sum, val) => sum + val, 0);
        setCurrentTotal(total);
        setPreviousTotal(0); // Could implement previous year comparison
        setChartData(yearlyData);
        setDailyBreakdown([]);
        setTopTriggers([]);
      }

      // Generate health insight
      await generateHealthInsight();
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  // Reload stats when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [selectedPeriod])
  );

  // Chart labels based on period
  const getChartLabels = () => {
    if (selectedPeriod === "week") {
      return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    } else if (selectedPeriod === "month") {
      // Show every 5th day
      return Array.from({ length: 30 }, (_, i) =>
        i % 5 === 0 ? `${i + 1}` : ""
      );
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

  // Data for the chart
  const weeklyData = {
    labels: getChartLabels(),
    datasets: [
      {
        data: chartData.length > 0 ? chartData : [0],
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

  // Calculate average based on period
  const getAverage = () => {
    if (selectedPeriod === "week") {
      return currentTotal > 0 ? Math.round(currentTotal / 7) : 0;
    } else if (selectedPeriod === "month") {
      return currentTotal > 0 ? Math.round(currentTotal / 30) : 0;
    } else {
      return currentTotal > 0 ? Math.round(currentTotal / 12) : 0;
    }
  };

  const average = getAverage();

  // Calculate percentage change
  const percentageChange =
    previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : 0;

  // Get period label
  const getPeriodLabel = () => {
    return selectedPeriod === "week"
      ? "day"
      : selectedPeriod === "month"
      ? "day"
      : "month";
  };

  const getComparisonLabel = () => {
    return selectedPeriod === "week"
      ? "last week"
      : selectedPeriod === "month"
      ? "last month"
      : "last year";
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 32,
      }}
    >
      <Surface style={styles.content} elevation={0}>
        {/* Header */}
        <Surface style={styles.header} elevation={0}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Smoking Statistics
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Track your progress
          </Text>
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
          />
        </Surface>

        {/* Chart */}
        <Surface style={styles.chartContainer} elevation={0}>
          <LineChart
            data={weeklyData}
            width={screenWidth + 16}
            height={240}
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
        </Surface>

        {/* Stats Cards Row */}
        <Surface style={styles.statsRow} elevation={0}>
          <Card style={styles.statCardHalf}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.statLabel}>
                {selectedPeriod === "week"
                  ? "Daily"
                  : selectedPeriod === "month"
                  ? "Daily"
                  : "Monthly"}{" "}
                Average
              </Text>
              <Surface style={styles.statValueRow} elevation={0}>
                <Text variant="headlineLarge" style={styles.statNumber}>
                  {average}
                </Text>
                <Text variant="bodyMedium">
                  {" "}
                  {average === 1 ? "cigarette" : "cigarettes"}
                </Text>
              </Surface>
              {previousTotal > 0 && (
                <Surface style={styles.changeRow} elevation={0}>
                  <Icon
                    source={
                      percentageChange < 0 ? "trending-down" : "trending-up"
                    }
                    size={16}
                    color={percentageChange < 0 ? "#4CAF50" : "#F44336"}
                  />
                  <Text
                    variant="bodySmall"
                    style={
                      percentageChange < 0
                        ? styles.changeTextGreen
                        : styles.changeTextRed
                    }
                  >
                    {percentageChange > 0 ? "+" : ""}
                    {percentageChange}% vs {getComparisonLabel()}
                  </Text>
                </Surface>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.statCardHalf}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Total This{" "}
                {selectedPeriod === "week"
                  ? "Week"
                  : selectedPeriod === "month"
                  ? "Month"
                  : "Year"}
              </Text>
              <Surface style={styles.statValueRow} elevation={0}>
                <Text variant="headlineLarge" style={styles.statNumber}>
                  {currentTotal}
                </Text>
                <Text variant="bodyMedium">
                  {" "}
                  {currentTotal === 1 ? "cigarette" : "cigarettes"}
                </Text>
              </Surface>
              {previousTotal > 0 && (
                <Surface style={styles.changeRow} elevation={0}>
                  <Icon
                    source={
                      percentageChange < 0 ? "trending-down" : "trending-up"
                    }
                    size={16}
                    color={percentageChange < 0 ? "#4CAF50" : "#F44336"}
                  />
                  <Text
                    variant="bodySmall"
                    style={
                      percentageChange < 0
                        ? styles.changeTextGreen
                        : styles.changeTextRed
                    }
                  >
                    {percentageChange > 0 ? "+" : ""}
                    {percentageChange}% vs {getComparisonLabel()}
                  </Text>
                </Surface>
              )}
            </Card.Content>
          </Card>
        </Surface>

        {/* Top Triggers - Only for week view */}
        {selectedPeriod === "week" && topTriggers.length > 0 && (
          <Surface style={styles.section} elevation={0}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Top Triggers
            </Text>
            <Text variant="bodyMedium" style={styles.sectionSubtitle}>
              What makes you reach for a cigarette
            </Text>

            {topTriggers.map((item, index) => (
              <Card key={index} style={styles.triggerCard}>
                <Card.Content style={styles.triggerCardContent}>
                  <Surface style={styles.triggerLeft} elevation={0}>
                    <Surface style={styles.triggerRank} elevation={0}>
                      <Text variant="bodyMedium" style={styles.triggerRankText}>
                        {index + 1}
                      </Text>
                    </Surface>
                    <Text variant="bodyLarge" style={styles.triggerName}>
                      {item.trigger}
                    </Text>
                  </Surface>
                  <Surface style={styles.triggerRight} elevation={0}>
                    <Surface
                      style={styles.triggerProgressBarContainer}
                      elevation={0}
                    >
                      <Surface
                        style={[
                          styles.triggerProgressBarFilled,
                          {
                            width: `${
                              (item.count / (topTriggers[0]?.count || 1)) * 100
                            }%`,
                          },
                        ]}
                        elevation={0}
                      />
                    </Surface>
                    <Text variant="titleMedium" style={styles.triggerCount}>
                      {item.count}
                    </Text>
                  </Surface>
                </Card.Content>
              </Card>
            ))}
          </Surface>
        )}

        {/* Daily Breakdown - Only for week view */}
        {selectedPeriod === "week" && dailyBreakdown.length > 0 && (
          <Surface style={styles.section} elevation={0}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Daily Breakdown
            </Text>

            {dailyBreakdown.map((item, index) => (
              <Card key={index} style={styles.dayCard}>
                <Card.Content style={styles.dayCardContent}>
                  <Surface style={styles.dayLeft} elevation={0}>
                    <Text variant="bodyLarge" style={styles.dayName}>
                      {item.day}
                    </Text>
                    <Text variant="bodySmall" style={styles.dayDate}>
                      {item.date}
                    </Text>
                  </Surface>
                  <Surface style={styles.dayRight} elevation={0}>
                    <Surface style={styles.progressBarContainer} elevation={0}>
                      <Surface
                        style={[
                          styles.progressBarFilled,
                          { width: `${item.progress * 100}%` },
                        ]}
                        elevation={0}
                      />
                    </Surface>
                    <Text variant="titleMedium" style={styles.dayCount}>
                      {item.count}
                    </Text>
                  </Surface>
                </Card.Content>
              </Card>
            ))}
          </Surface>
        )}

        {/* Your Goals */}
        <Card style={styles.goalCard}>
          <Card.Content>
            <Surface style={styles.goalHeader} elevation={0}>
              <Text variant="titleLarge" style={styles.goalTitle}>
                Your Goals
              </Text>
              {previousTotal > 0 && (
                <Surface style={styles.goalBadge} elevation={0}>
                  <Text variant="titleMedium" style={styles.goalPercentage}>
                    {Math.abs(percentageChange)}%
                  </Text>
                </Surface>
              )}
            </Surface>

            {previousTotal > 0 ? (
              <>
                <Text variant="bodyLarge" style={styles.goalDescription}>
                  {Math.abs(percentageChange)}%{" "}
                  {percentageChange < 0 ? "less" : "more"} than{" "}
                  {getComparisonLabel()}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.goalStatus,
                    { color: percentageChange <= 0 ? "#4CAF50" : "#F44336" },
                  ]}
                >
                  {percentageChange <= 0 ? "On track" : "Need improvement"}
                </Text>
              </>
            ) : (
              <Text variant="bodyLarge" style={styles.goalDescription}>
                {currentTotal > 0
                  ? `You've logged ${currentTotal} ${
                      currentTotal === 1 ? "cigarette" : "cigarettes"
                    } this ${
                      selectedPeriod === "week"
                        ? "week"
                        : selectedPeriod === "month"
                        ? "month"
                        : "year"
                    }. Keep tracking to see your progress!`
                  : "Start tracking to set your goals and monitor progress 📊"}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Health Insight */}
        <Card style={[styles.insightCard, { backgroundColor: "#E3F2FD" }]}>
          <Card.Content>
            <Surface style={styles.insightHeader} elevation={0}>
              <Icon source="lightbulb-outline" size={20} color="#4285F4" />
              <Text variant="titleMedium" style={styles.insightTitle}>
                Health Insight
              </Text>
            </Surface>
            <Text variant="bodyMedium" style={styles.insightText}>
              {healthInsight ||
                "Track your progress to get personalized insights 💡"}
            </Text>
          </Card.Content>
        </Card>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  header: {
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  periodSelector: {
    marginBottom: 20,
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
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  statCardHalf: {
    flex: 1,
  },
  statLabel: {
    marginBottom: 8,
    opacity: 0.7,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  statNumber: {
    fontWeight: "bold",
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "transparent",
  },
  changeTextGreen: {
    color: "#4CAF50",
  },
  changeTextRed: {
    color: "#F44336",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    opacity: 0.6,
    marginBottom: 16,
  },
  triggerCard: {
    marginBottom: 12,
  },
  triggerCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  triggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    backgroundColor: "transparent",
  },
  triggerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  triggerRankText: {
    color: "#4285F4",
    fontWeight: "600",
  },
  triggerName: {
    fontWeight: "500",
    textTransform: "capitalize",
  },
  triggerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1.8,
    backgroundColor: "transparent",
  },
  triggerProgressBarContainer: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E8E8E8",
    overflow: "hidden",
  },
  triggerProgressBarFilled: {
    height: "100%",
    backgroundColor: "#4285F4",
    borderRadius: 6,
  },
  triggerCount: {
    fontWeight: "600",
    minWidth: 30,
    textAlign: "right",
    color: "#4285F4",
  },
  dayCard: {
    marginBottom: 12,
  },
  dayCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  dayLeft: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dayName: {
    fontWeight: "500",
    marginBottom: 2,
  },
  dayDate: {
    opacity: 0.6,
  },
  dayRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1.8,
    backgroundColor: "transparent",
  },
  progressBarContainer: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E8E8E8",
    overflow: "hidden",
  },
  progressBarFilled: {
    height: "100%",
    backgroundColor: "#4285F4",
    borderRadius: 6,
  },
  dayCount: {
    fontWeight: "600",
    minWidth: 30,
    textAlign: "right",
  },
  goalCard: {
    marginBottom: 24,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  goalTitle: {
    fontWeight: "600",
  },
  goalBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  goalPercentage: {
    color: "#4285F4",
    fontWeight: "bold",
  },
  goalDescription: {
    marginBottom: 8,
    color: "#666",
  },
  goalStatus: {
    color: "#4CAF50",
    fontWeight: "500",
  },
  insightCard: {
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  insightTitle: {
    fontWeight: "600",
    color: "#4285F4",
  },
  insightText: {
    color: "#333",
    lineHeight: 20,
  },
});
