export type DailyCount = { day: string; count: number };

export type BaselineSnapshot = {
  cigarettesPerDay: number;
  costPerCigaretteCents: number;
  createdAt: number;
};

export type LifetimeImpact = {
  daysTracked: number;
  cigarettesAvoided: number;
  moneySavedCents: number;
};

export function localDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(time: number) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Day-by-day comparison with the baseline in effect on each day. Uses the
// same "max(0, baseline - smoked)" rule as Home's "Saved today", applied to
// every tracked day. Days before the first baseline (or before `since`, when
// given) are not counted.
export function computeLifetimeImpact(
  dailyCounts: DailyCount[],
  baselines: BaselineSnapshot[],
  now = Date.now(),
  since?: number,
): LifetimeImpact | null {
  const sorted = [...baselines].sort((a, b) => a.createdAt - b.createdAt);
  if (sorted.length === 0) return null;
  const counts = new Map(dailyCounts.map((row) => [row.day, row.count]));
  const today = startOfLocalDay(now);
  const cursor = startOfLocalDay(sorted[0].createdAt);
  const firstCountedDay =
    since === undefined ? '' : localDayKey(startOfLocalDay(since));
  let baselineIndex = 0;
  let daysTracked = 0;
  let cigarettesAvoided = 0;
  let moneySavedCents = 0;

  while (cursor.getTime() <= today.getTime()) {
    const dayKey = localDayKey(cursor);
    while (
      baselineIndex + 1 < sorted.length &&
      localDayKey(new Date(sorted[baselineIndex + 1].createdAt)) <= dayKey
    ) {
      baselineIndex += 1;
    }
    if (dayKey < firstCountedDay) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    const baseline = sorted[baselineIndex];
    const avoided = Math.max(0, baseline.cigarettesPerDay - (counts.get(dayKey) ?? 0));
    cigarettesAvoided += avoided;
    moneySavedCents += avoided * baseline.costPerCigaretteCents;
    daysTracked += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return { daysTracked, cigarettesAvoided, moneySavedCents };
}

// Consecutive completed days within the daily target, mirroring the
// smoke-free streak: going over today's target resets it to 0, otherwise
// counting starts from yesterday. Days before the plan started are ignored.
export function computeOnTargetStreak(
  dailyCounts: DailyCount[],
  targetForDay: (endOfDayMs: number) => number,
  planStartedAt: number,
  now = Date.now(),
) {
  const counts = new Map(dailyCounts.map((row) => [row.day, row.count]));
  const endOfDay = (date: Date) => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end.getTime();
  };
  const today = startOfLocalDay(now);
  if ((counts.get(localDayKey(today)) ?? 0) > targetForDay(endOfDay(today))) {
    return 0;
  }
  const firstDay = localDayKey(startOfLocalDay(planStartedAt));
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (localDayKey(cursor) >= firstDay && streak < 10000) {
    if ((counts.get(localDayKey(cursor)) ?? 0) > targetForDay(endOfDay(cursor))) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
