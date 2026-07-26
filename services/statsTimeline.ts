import {
  getMonthlyBreakdown,
  getPreviousWeekStats,
  getSmokingCountByDateRange,
  getWeeklyBreakdown,
  getWeekStats,
  getYearlyBreakdown,
} from '@/db';
import {
  getPreviousMonthRange,
  getPreviousYearRange,
  type StatsPeriod,
} from '@/utils/statistics';

export type TimelineResult = {
  currentTotal: number;
  data: number[];
  previousTotal: number;
};

function getRangeTotal(start: Date, end: Date) {
  return getSmokingCountByDateRange(start.toISOString(), end.toISOString());
}

export async function loadTimeline(
  period: StatsPeriod,
): Promise<TimelineResult> {
  if (period === 'week') {
    const [currentTotal, previousTotal, data] = await Promise.all([
      getWeekStats(),
      getPreviousWeekStats(),
      getWeeklyBreakdown(),
    ]);

    return {
      currentTotal,
      previousTotal,
      data,
    };
  }

  if (period === 'month') {
    const { start, end } = getPreviousMonthRange();
    const [data, previousTotal] = await Promise.all([
      getMonthlyBreakdown(),
      getRangeTotal(start, end),
    ]);

    return {
      currentTotal: data.reduce((sum, value) => sum + value, 0),
      previousTotal,
      data,
    };
  }

  const { start, end } = getPreviousYearRange();
  const [data, previousTotal] = await Promise.all([
    getYearlyBreakdown(),
    getRangeTotal(start, end),
  ]);

  return {
    currentTotal: data.reduce((sum, value) => sum + value, 0),
    previousTotal,
    data,
  };
}
