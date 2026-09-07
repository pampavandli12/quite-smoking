import {
  createDetailedWeeklyBreakdown,
  getAverage,
  getAverageLabel,
  getComparisonLabel,
  getCurrentPeriodLabel,
  getPercentageChange,
  getSavings,
  getTotalLabel,
  getPreviousMonthRange,
  getPreviousYearRange,
} from '../statistics';

describe('statistics calculations', () => {
  test.each([
    ['week', 14, 2],
    ['month', 14, 4],
    ['year', 25, 2],
    ['week', 0, 0],
    ['week', -1, 0],
  ] as const)('calculates the %s average', (period, total, expected) => {
    expect(getAverage(period, total)).toBe(expected);
  });

  test.each([
    ['week', 'last week', 'week', 'Daily Average', 'Total This Week'],
    ['month', 'last month', 'month', 'Weekly Average', 'Total This Month'],
    ['year', 'last year', 'year', 'Monthly Average', 'Total This Year'],
  ] as const)(
    'keeps labels stable for %s',
    (period, comparison, current, average, total) => {
      expect(getComparisonLabel(period)).toBe(comparison);
      expect(getCurrentPeriodLabel(period)).toBe(current);
      expect(getAverageLabel(period)).toBe(average);
      expect(getTotalLabel(period)).toBe(total);
    },
  );

  test.each([
    [8, 10, -20],
    [12, 10, 20],
    [10, 10, 0],
    [10, 0, 0],
  ])(
    'calculates percentage change from %i to %i',
    (current, previous, expected) => {
      expect(getPercentageChange(current, previous)).toBe(expected);
    },
  );

  test('calculates weekly savings through the current day', () => {
    expect(
      getSavings(
        { cigarettesPerDay: 10, costPerCigaretteCents: 1500 },
        'week',
        20,
        new Date(2026, 6, 29),
      ),
    ).toEqual({ cigarettesSaved: 20, moneySaved: 300 });
  });

  test('preserves negative savings when usage exceeds the baseline', () => {
    expect(
      getSavings(
        { cigarettesPerDay: 1, costPerCigaretteCents: 1250 },
        'week',
        9,
        new Date(2026, 6, 26),
      ),
    ).toEqual({ cigarettesSaved: -8, moneySaved: -100 });
  });

  test('uses elapsed calendar days for the current month', () => {
    expect(
      getSavings(
        { cigarettesPerDay: 2, costPerCigaretteCents: 100 },
        'month',
        0,
        new Date(2024, 1, 15),
      ),
    ).toEqual({ cigarettesSaved: 30, moneySaved: 30 });
  });

  test('uses elapsed calendar days for the current year', () => {
    expect(
      getSavings(
        { cigarettesPerDay: 2, costPerCigaretteCents: 100 },
        'year',
        10,
        new Date(2024, 1, 29),
      ),
    ).toEqual({ cigarettesSaved: 110, moneySaved: 110 });
  });

  test('returns zero savings without settings', () => {
    expect(getSavings(null, 'week', 10)).toEqual({
      cigarettesSaved: 0,
      moneySaved: 0,
    });
  });

  test('builds the existing Sunday-first detailed weekly breakdown', () => {
    const breakdown = createDetailedWeeklyBreakdown(
      [1, 2, 3, 4, 5, 6, 7],
      new Date(2026, 6, 29),
    );

    expect(breakdown.map(({ day, count, progress }) => ({
      day,
      count,
      progress,
    }))).toEqual([
      { day: 'Sunday', count: 1, progress: 0.05 },
      { day: 'Monday', count: 2, progress: 0.1 },
      { day: 'Tuesday', count: 3, progress: 0.15 },
      { day: 'Wednesday', count: 4, progress: 0.2 },
      { day: 'Thursday', count: 5, progress: 0.25 },
      { day: 'Friday', count: 6, progress: 0.3 },
      { day: 'Saturday', count: 7, progress: 0.35 },
    ]);
  });

  test('creates the previous calendar month range', () => {
    const range = getPreviousMonthRange(new Date(2026, 0, 15));

    expect(range.start).toEqual(new Date(2025, 11, 1));
    expect(range.end).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
  });

  test('creates the previous calendar year range', () => {
    const range = getPreviousYearRange(new Date(2026, 6, 15));

    expect(range.start).toEqual(new Date(2025, 0, 1));
    expect(range.end).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
  });
});
