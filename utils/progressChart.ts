import type { StatsPeriod } from '@/utils/statistics';

// Card padding (16) + Gifted Charts' Y-axis label column (about 36) + safety
// space prevents the final point or tooltip from clipping on narrow devices.
const AXIS_RESERVE = 68;
const MIN_PLOT_WIDTH = 120;
const INITIAL_SPACING = 12;
const END_SPACING = 12;
const SECTION_COUNT = 4;

export const CHART_PLOT_HEIGHT = 198;
export const CHART_DATA_POINT_RADIUS = 4;
export const CHART_OVERFLOW_BOTTOM = CHART_DATA_POINT_RADIUS + 6;
export const CHART_LABELS_EXTRA_HEIGHT = 8;
export const CHART_X_AXIS_LABELS_HEIGHT = 22;
export const CHART_Y_AXIS_LABEL_WIDTH = 36;
export const CHART_POINTER_STRIP_HEIGHT = CHART_PLOT_HEIGHT - 18;

export type ProgressChartVerticalLayout = {
  dataPointRadius: number;
  labelsExtraHeight: number;
  overflowBottom: number;
  plotHeight: number;
  pointerStripHeight: number;
  xAxisLabelsHeight: number;
  yAxisLabelWidth: number;
};

export function getProgressChartVerticalLayout(): ProgressChartVerticalLayout {
  return {
    dataPointRadius: CHART_DATA_POINT_RADIUS,
    labelsExtraHeight: CHART_LABELS_EXTRA_HEIGHT,
    overflowBottom: CHART_OVERFLOW_BOTTOM,
    plotHeight: CHART_PLOT_HEIGHT,
    pointerStripHeight: CHART_POINTER_STRIP_HEIGHT,
    xAxisLabelsHeight: CHART_X_AXIS_LABELS_HEIGHT,
    yAxisLabelWidth: CHART_Y_AXIS_LABEL_WIDTH,
  };
}

const PERIOD_LABELS: Record<StatsPeriod, string[]> = {
  week: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  month: ['W1', 'W2', 'W3', 'W4'],
  year: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
};

export type ProgressChartLayout = {
  endSpacing: number;
  initialSpacing: number;
  plotWidth: number;
  spacing: number;
};

export function calculateProgressChartLayout(
  containerWidth: number,
  pointCount: number,
): ProgressChartLayout {
  const plotWidth = Math.max(
    MIN_PLOT_WIDTH,
    Math.floor(containerWidth) - AXIS_RESERVE,
  );
  const usableWidth = Math.max(
    0,
    plotWidth - INITIAL_SPACING - END_SPACING,
  );
  const spacing = pointCount > 1 ? usableWidth / (pointCount - 1) : 0;

  return {
    endSpacing: END_SPACING,
    initialSpacing: INITIAL_SPACING,
    plotWidth,
    spacing,
  };
}

export function calculateProgressAxisMax(values: number[]) {
  const highestValue = Math.max(0, ...values);
  if (highestValue === 0) {
    return SECTION_COUNT;
  }

  const paddedMaximum = highestValue * 1.15;
  const sectionStep = Math.max(
    1,
    Math.ceil(paddedMaximum / SECTION_COUNT),
  );
  return sectionStep * SECTION_COUNT;
}

export function getProgressChartLabels(
  period: StatsPeriod,
  containerWidth: number,
) {
  return PERIOD_LABELS[period].map((label, index) => {
    if (period === 'year' && containerWidth < 380 && index % 2 === 1) {
      return '';
    }
    return label;
  });
}

export function getProgressChartFullLabel(
  period: StatsPeriod,
  index: number,
) {
  return PERIOD_LABELS[period][index] ?? `Period ${index + 1}`;
}

export function formatProgressTooltip(
  label: string,
  value: number,
  comparisonLabel: string,
) {
  return {
    title: label,
    value: `${value} ${value === 1 ? 'cigarette' : 'cigarettes'}`,
    comparison: comparisonLabel,
  };
}
