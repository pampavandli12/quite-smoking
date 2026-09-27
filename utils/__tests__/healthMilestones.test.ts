import {
  formatElapsed,
  getHealthProgress,
  HEALTH_MILESTONES,
} from '@/utils/healthMilestones';

const HOUR = 3_600_000;

describe('health milestones', () => {
  it('is ordered by time with unique ids', () => {
    const times = HEALTH_MILESTONES.map((m) => m.afterMs);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(new Set(HEALTH_MILESTONES.map((m) => m.id)).size).toBe(
      HEALTH_MILESTONES.length,
    );
  });

  it('starts with nothing achieved', () => {
    const progress = getHealthProgress(1_000, 1_000);
    expect(progress.achieved).toHaveLength(0);
    expect(progress.next?.id).toBe('20m');
    expect(progress.progressToNext).toBe(0);
  });

  it('achieves a milestone exactly at its time', () => {
    const progress = getHealthProgress(0, 20 * 60_000);
    expect(progress.achieved.map((m) => m.id)).toEqual(['20m']);
    expect(progress.next?.id).toBe('8h');
    expect(progress.progressToNext).toBe(0);
  });

  it('measures progress between milestones', () => {
    // Halfway between 48h and 72h.
    const progress = getHealthProgress(0, 60 * HOUR);
    expect(progress.next?.id).toBe('72h');
    expect(progress.progressToNext).toBeCloseTo(0.5);
  });

  it('completes after the last milestone', () => {
    const progress = getHealthProgress(0, 20 * 365 * 24 * HOUR);
    expect(progress.next).toBeNull();
    expect(progress.progressToNext).toBe(1);
  });

  it('never reports negative time for future timestamps', () => {
    expect(getHealthProgress(5_000, 1_000).elapsedMs).toBe(0);
  });
});

describe('formatElapsed', () => {
  it('formats minutes, hours, and days', () => {
    expect(formatElapsed(5 * 60_000)).toBe('5m');
    expect(formatElapsed(2 * HOUR + 15 * 60_000)).toBe('2h 15m');
    expect(formatElapsed(3 * 24 * HOUR + 4 * HOUR)).toBe('3d 4h');
  });
});
