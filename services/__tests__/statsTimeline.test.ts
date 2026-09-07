import {
  getMonthlyBreakdown,
  getPreviousWeekStats,
  getSmokingCountByDateRange,
  getWeeklyBreakdown,
  getWeekStats,
  getYearlyBreakdown,
} from '@/db';
import { loadTimeline } from '../statsTimeline';

jest.mock('@/db', () => ({
  getMonthlyBreakdown: jest.fn(),
  getPreviousWeekStats: jest.fn(),
  getSmokingCountByDateRange: jest.fn(),
  getWeeklyBreakdown: jest.fn(),
  getWeekStats: jest.fn(),
  getYearlyBreakdown: jest.fn(),
}));

const mockMonthlyBreakdown = jest.mocked(getMonthlyBreakdown);
const mockPreviousWeekStats = jest.mocked(getPreviousWeekStats);
const mockRangeCount = jest.mocked(getSmokingCountByDateRange);
const mockWeeklyBreakdown = jest.mocked(getWeeklyBreakdown);
const mockWeekStats = jest.mocked(getWeekStats);
const mockYearlyBreakdown = jest.mocked(getYearlyBreakdown);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('stats timeline orchestration', () => {
  test('preserves the independent weekly total and breakdown contracts', async () => {
    mockWeeklyBreakdown.mockResolvedValue([1, 2, 3, 4, 5, 6, 7]);
    mockWeekStats.mockResolvedValue(27);
    mockPreviousWeekStats.mockResolvedValue(12);

    await expect(loadTimeline('week')).resolves.toEqual({
      currentTotal: 27,
      previousTotal: 12,
      data: [1, 2, 3, 4, 5, 6, 7],
    });
    expect(mockRangeCount).not.toHaveBeenCalled();
  });

  test.each([
    ['month', mockMonthlyBreakdown, [1, 2, 3, 4]],
    ['year', mockYearlyBreakdown, [2, 3, 4]],
  ] as const)(
    'builds the %s snapshot and requests one previous-period range',
    async (period, breakdownMock, data) => {
      breakdownMock.mockResolvedValue([...data]);
      mockRangeCount.mockResolvedValue(9);

      await expect(loadTimeline(period)).resolves.toEqual({
        currentTotal: data.reduce((sum, value) => sum + value, 0),
        previousTotal: 9,
        data,
      });
      expect(mockRangeCount).toHaveBeenCalledTimes(1);
    },
  );
});
