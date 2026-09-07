import {
  calculateProgressAxisMax,
  calculateProgressChartLayout,
  formatProgressTooltip,
  getProgressChartLabels,
} from '@/utils/progressChart';

describe('progress chart presentation helpers', () => {
  it.each([
    [280, 4],
    [320, 7],
    [390, 12],
    [430, 1],
  ])('fits %i px with %i points without overflow', (width, pointCount) => {
    const layout = calculateProgressChartLayout(width, pointCount);
    const occupiedWidth =
      layout.initialSpacing +
      layout.endSpacing +
      layout.spacing * Math.max(0, pointCount - 1);

    expect(occupiedWidth).toBeLessThanOrEqual(layout.plotWidth);
    expect(layout.plotWidth).toBeGreaterThanOrEqual(120);
    expect(pointCount > 1 ? layout.spacing : 0).toBeGreaterThanOrEqual(0);
  });

  it('does not collapse multiple points onto the same x position', () => {
    expect(calculateProgressChartLayout(320, 12).spacing).toBeGreaterThan(0);
  });

  it('adds rounded integer headroom to the y axis', () => {
    expect(calculateProgressAxisMax([])).toBe(4);
    expect(calculateProgressAxisMax([0, 0])).toBe(4);
    expect(calculateProgressAxisMax([15, 9, 3])).toBe(20);
    expect(calculateProgressAxisMax([1])).toBe(4);
  });

  it('thins year labels only on narrow layouts', () => {
    expect(getProgressChartLabels('year', 320)).toEqual([
      'Jan', '', 'Mar', '', 'May', '', 'Jul', '', 'Sep', '', 'Nov', '',
    ]);
    expect(getProgressChartLabels('year', 430)).toHaveLength(12);
    expect(getProgressChartLabels('week', 280)).toHaveLength(7);
  });

  it('formats accessible singular and plural tooltips', () => {
    expect(formatProgressTooltip('Mon', 1, 'vs last week').value).toBe(
      '1 cigarette',
    );
    expect(formatProgressTooltip('Tue', 2, 'vs last week')).toEqual({
      title: 'Tue',
      value: '2 cigarettes',
      comparison: 'vs last week',
    });
  });
});
