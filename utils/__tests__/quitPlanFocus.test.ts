import { buildWeekFocus } from '@/utils/quitPlan';
import { strategyLabel } from '@/utils/strategies';

describe('buildWeekFocus', () => {
  it('leaves weeks unfocused without trigger history', () => {
    expect(buildWeekFocus(2, [])).toEqual([
      { focusTrigger: null, focusStrategy: null },
      { focusTrigger: null, focusStrategy: null },
    ]);
  });

  it('rotates through the top triggers', () => {
    const weeks = buildWeekFocus(3, [
      { trigger: 'stress', strategy: 'breathing' },
      { trigger: 'coffee', strategy: 'water' },
    ]);
    expect(weeks.map((week) => week.focusTrigger)).toEqual([
      'stress',
      'coffee',
      'stress',
    ]);
    expect(weeks[1].focusStrategy).toBe('water');
  });
});

describe('strategyLabel', () => {
  it('uses friendly labels and tolerates unknown values', () => {
    expect(strategyLabel('urge_surfing')).toBe('Ride the urge');
    expect(strategyLabel('cold_shower')).toBe('cold shower');
  });
});
