import { getDailySmokingCounts, getSmokingSettingsHistory } from '@/db';
import { getActiveQuitPlan, listPlanWeeks } from '@/services/quitPlanService';
import {
  computeLifetimeImpact,
  computeOnTargetStreak,
  type BaselineSnapshot,
} from '@/utils/impact';
import { getEffectivePlanWeek } from '@/utils/quitPlan';
import { toEpochMs } from '@/utils/timestamps';

async function loadBaselines(): Promise<BaselineSnapshot[]> {
  const rows = await getSmokingSettingsHistory();
  return rows.flatMap((row) => {
    const createdAt = toEpochMs(row.createdAt);
    return createdAt === null
      ? []
      : [
          {
            cigarettesPerDay: row.cigarettesPerDay,
            costPerCigaretteCents: row.costPerCigaretteCents,
            createdAt,
          },
        ];
  });
}

export async function getLifetimeImpact(since?: number) {
  const [counts, baselines] = await Promise.all([
    getDailySmokingCounts(),
    loadBaselines(),
  ]);
  return computeLifetimeImpact(counts, baselines, Date.now(), since);
}

export type OnTargetStreak = { streak: number; target: number };

// Only meaningful while a plan is active; returns null otherwise.
export async function getOnTargetStreak(): Promise<OnTargetStreak | null> {
  const plan = await getActiveQuitPlan();
  if (!plan || plan.status !== 'active') return null;
  const [weeks, counts] = await Promise.all([
    listPlanWeeks(plan.id),
    getDailySmokingCounts(),
  ]);
  const targetForDay = (endOfDayMs: number) =>
    getEffectivePlanWeek(weeks, endOfDayMs)?.targetCigarettesPerDay ??
    plan.currentDailyTarget;
  return {
    streak: computeOnTargetStreak(counts, targetForDay, plan.startedAt),
    target: plan.currentDailyTarget,
  };
}
