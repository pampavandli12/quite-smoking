import {
  computeLifetimeImpact,
  computeOnTargetStreak,
  localDayKey,
} from '@/utils/impact';

function at(year: number, month: number, day: number, hour = 12) {
  return new Date(year, month - 1, day, hour).getTime();
}

describe('computeLifetimeImpact', () => {
  it('returns null without a baseline', () => {
    expect(computeLifetimeImpact([], [], at(2026, 1, 10))).toBeNull();
  });

  it('counts every day from the first baseline, including today', () => {
    const impact = computeLifetimeImpact(
      [
        { day: '2026-01-01', count: 10 },
        { day: '2026-01-02', count: 4 },
      ],
      [{ cigarettesPerDay: 10, costPerCigaretteCents: 50, createdAt: at(2026, 1, 1) }],
      at(2026, 1, 3),
    );
    // Day 1: 0 avoided, day 2: 6, day 3 (today, nothing logged): 10.
    expect(impact).toEqual({
      daysTracked: 3,
      cigarettesAvoided: 16,
      moneySavedCents: 800,
    });
  });

  it('never counts smoking above baseline as negative savings', () => {
    const impact = computeLifetimeImpact(
      [{ day: '2026-01-01', count: 25 }],
      [{ cigarettesPerDay: 10, costPerCigaretteCents: 50, createdAt: at(2026, 1, 1) }],
      at(2026, 1, 1),
    );
    expect(impact?.cigarettesAvoided).toBe(0);
    expect(impact?.moneySavedCents).toBe(0);
  });

  it('applies each baseline from the day it was saved', () => {
    const impact = computeLifetimeImpact(
      [],
      [
        { cigarettesPerDay: 20, costPerCigaretteCents: 10, createdAt: at(2026, 1, 1) },
        { cigarettesPerDay: 10, costPerCigaretteCents: 30, createdAt: at(2026, 1, 2) },
      ],
      at(2026, 1, 2),
    );
    expect(impact).toEqual({
      daysTracked: 2,
      cigarettesAvoided: 30,
      moneySavedCents: 20 * 10 + 10 * 30,
    });
  });
});

describe('computeLifetimeImpact since a date', () => {
  it('only counts days from the given date, with the baseline in effect then', () => {
    const impact = computeLifetimeImpact(
      [{ day: '2026-01-03', count: 4 }],
      [
        { cigarettesPerDay: 20, costPerCigaretteCents: 10, createdAt: at(2026, 1, 1) },
        { cigarettesPerDay: 10, costPerCigaretteCents: 30, createdAt: at(2026, 1, 2) },
      ],
      at(2026, 1, 4),
      at(2026, 1, 3, 18),
    );
    // Jan 3: 6 avoided, Jan 4: 10 avoided, both at the second baseline.
    expect(impact).toEqual({
      daysTracked: 2,
      cigarettesAvoided: 16,
      moneySavedCents: 16 * 30,
    });
  });
});

describe('computeOnTargetStreak', () => {
  const target = () => 5;

  it('is 0 when today is already over target', () => {
    expect(
      computeOnTargetStreak(
        [{ day: '2026-01-10', count: 6 }],
        target,
        at(2026, 1, 1),
        at(2026, 1, 10),
      ),
    ).toBe(0);
  });

  it('counts completed days back to the plan start', () => {
    expect(
      computeOnTargetStreak(
        [
          { day: '2026-01-07', count: 5 },
          { day: '2026-01-08', count: 3 },
          { day: '2026-01-09', count: 0 },
        ],
        target,
        at(2026, 1, 7),
        at(2026, 1, 10),
      ),
    ).toBe(3);
  });

  it('stops at a day over target', () => {
    expect(
      computeOnTargetStreak(
        [
          { day: '2026-01-07', count: 9 },
          { day: '2026-01-08', count: 3 },
          { day: '2026-01-09', count: 2 },
        ],
        target,
        at(2026, 1, 1),
        at(2026, 1, 10),
      ),
    ).toBe(2);
  });

  it('uses the target in effect on each day', () => {
    // Target drops from 5 to 2 on Jan 9.
    const weekly = (endOfDay: number) => (endOfDay >= at(2026, 1, 9, 0) ? 2 : 5);
    expect(
      computeOnTargetStreak(
        [
          { day: '2026-01-08', count: 4 },
          { day: '2026-01-09', count: 2 },
        ],
        weekly,
        at(2026, 1, 1),
        at(2026, 1, 10),
      ),
    ).toBe(9);
  });
});

describe('localDayKey', () => {
  it('pads months and days', () => {
    expect(localDayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
