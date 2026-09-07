import { getEffectivePlanWeek } from '@/utils/quitPlan';

type PlanWeek = {
  completedAt: number | null;
  focusStrategy: string | null;
  focusTrigger: string | null;
  id: number;
  startsAt: number;
  targetCigarettesPerDay: number;
  weekIndex: number;
};

function createWeek(
  id: number,
  startsAt: number,
  targetCigarettesPerDay: number,
): PlanWeek {
  return {
    completedAt: null,
    focusStrategy: null,
    focusTrigger: null,
    id,
    startsAt,
    targetCigarettesPerDay,
    weekIndex: id - 1,
  };
}

describe('quit plan progression', () => {
  const weeks = [
    createWeek(1, 1_000, 8),
    createWeek(2, 2_000, 6),
    createWeek(3, 3_000, 4),
  ];

  it('uses the first target before and during the first week', () => {
    expect(getEffectivePlanWeek(weeks, 500)?.targetCigarettesPerDay).toBe(8);
    expect(getEffectivePlanWeek(weeks, 1_500)?.targetCigarettesPerDay).toBe(8);
  });

  it('advances to the most recently started week', () => {
    expect(getEffectivePlanWeek(weeks, 2_500)?.targetCigarettesPerDay).toBe(6);
  });

  it('keeps the final target after the plan timeline ends', () => {
    expect(getEffectivePlanWeek(weeks, 10_000)?.targetCigarettesPerDay).toBe(4);
  });
});
