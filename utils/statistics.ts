export type StatsPeriod = 'week' | 'month' | 'year';

export type SmokingBaseline = {
  cigarettesPerDay: number;
  costPerCigaretteCents: number;
};

export type DetailedWeeklyBreakdownItem = {
  count: number;
  date: string;
  day: string;
  progress: number;
};

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function getAverage(period: StatsPeriod, total: number) {
  if (total <= 0) {
    return 0;
  }

  if (period === 'week') {
    return Math.round(total / 7);
  }

  if (period === 'month') {
    return Math.round(total / 4);
  }

  return Math.round(total / 12);
}

export function getComparisonLabel(period: StatsPeriod) {
  if (period === 'week') {
    return 'last week';
  }

  if (period === 'month') {
    return 'last month';
  }

  return 'last year';
}

export function getCurrentPeriodLabel(period: StatsPeriod) {
  return period === 'week' ? 'week' : period === 'month' ? 'month' : 'year';
}

export function getAverageLabel(period: StatsPeriod) {
  if (period === 'week') {
    return 'Daily Average';
  }

  if (period === 'month') {
    return 'Weekly Average';
  }

  return 'Monthly Average';
}

export function getTotalLabel(period: StatsPeriod) {
  if (period === 'week') {
    return 'Total This Week';
  }

  if (period === 'month') {
    return 'Total This Month';
  }

  return 'Total This Year';
}

export function getPercentageChange(currentTotal: number, previousTotal: number) {
  return previousTotal > 0
    ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
    : 0;
}

export function getSavings(
  baseline: SmokingBaseline | null,
  period: StatsPeriod,
  currentTotal: number,
  today = new Date(),
) {
  if (!baseline) {
    return { cigarettesSaved: 0, moneySaved: 0 };
  }

  let periodDays: number;

  if (period === 'week') {
    periodDays = 7;
  } else if (period === 'month') {
    periodDays = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();
  } else {
    periodDays = 365;
  }

  const cigarettesSaved = baseline.cigarettesPerDay * periodDays - currentTotal;
  const moneySaved = Math.round(
    (cigarettesSaved * baseline.costPerCigaretteCents) / 100,
  );

  return { cigarettesSaved, moneySaved };
}

export function createDetailedWeeklyBreakdown(
  dayCounts: number[],
  today = new Date(),
): DetailedWeeklyBreakdownItem[] {
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return DAY_NAMES.map((_, index) => {
    const currentDay = new Date(startOfWeek);
    currentDay.setDate(startOfWeek.getDate() + index);
    const count = dayCounts[currentDay.getDay()] ?? 0;

    return {
      day: DAY_NAMES[currentDay.getDay()],
      date: currentDay.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      count,
      progress: count / 20,
    };
  });
}

export function getPreviousMonthRange(today = new Date()) {
  return {
    start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
    end: new Date(
      today.getFullYear(),
      today.getMonth(),
      0,
      23,
      59,
      59,
      999,
    ),
  };
}

export function getPreviousYearRange(today = new Date()) {
  return {
    start: new Date(today.getFullYear() - 1, 0, 1),
    end: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
  };
}
