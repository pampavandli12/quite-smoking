import { dbGetAllAsync, dbGetFirstAsync, dbTransactionAsync } from '@/db/client';
import { emitDataChange } from '@/services/dataEvents';
import type {
  MutationResult,
  QuitPlanMode,
  QuitPlanStatus,
} from '@/services/types';

export type QuitPlan = {
  id: number;
  mode: QuitPlanMode;
  status: QuitPlanStatus;
  startedAt: number;
  targetQuitAt: number | null;
  baselineCigarettesPerDay: number;
  currentDailyTarget: number;
  motivation: string | null;
};

export type PlanWeek = {
  id: number;
  weekIndex: number;
  startsAt: number;
  targetCigarettesPerDay: number;
  focusTrigger: string | null;
  focusStrategy: string | null;
  completedAt: number | null;
};

function createTargets(baseline: number, weeks: number, mode: QuitPlanMode) {
  return Array.from({ length: weeks }, (_, index) => {
    const progress = (index + 1) / weeks;
    const reduction = mode === 'quit_date' ? progress : progress * 0.75;
    return Math.max(mode === 'quit_date' && index === weeks - 1 ? 0 : 1, Math.round(baseline * (1 - reduction)));
  });
}

export async function createQuitPlan(input: {
  mode: QuitPlanMode;
  baselineCigarettesPerDay: number;
  targetQuitAt?: number;
  motivation?: string;
}): Promise<MutationResult<QuitPlan>> {
  try {
    const plan = await dbTransactionAsync(async (transaction) => {
      const now = Date.now();
      await transaction.runAsync(
        `UPDATE quit_plan SET status = 'archived', updated_at = ?
         WHERE status IN ('active', 'paused')`,
        [now],
      );
      const row = await transaction.getFirstAsync<{ id: number }>(
        `INSERT INTO quit_plan (
          mode, status, started_at, target_quit_at,
          baseline_cigarettes_per_day, current_daily_target,
          motivation, created_at, updated_at
        ) VALUES (?, 'active', ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
        [
          input.mode,
          now,
          input.targetQuitAt ?? null,
          input.baselineCigarettesPerDay,
          input.baselineCigarettesPerDay,
          input.motivation ?? null,
          now,
          now,
        ],
      );
      if (!row) throw new Error('Quit plan insert did not return an id.');
      const weekCount = input.mode === 'quit_date' && input.targetQuitAt
        ? Math.max(1, Math.ceil((input.targetQuitAt - now) / 604800000))
        : 8;
      const targets = createTargets(input.baselineCigarettesPerDay, weekCount, input.mode);
      for (let index = 0; index < targets.length; index += 1) {
        await transaction.runAsync(
          `INSERT INTO plan_week (
            plan_id, week_index, starts_at, target_cigarettes_per_day
          ) VALUES (?, ?, ?, ?)`,
          [row.id, index, now + index * 604800000, targets[index]],
        );
      }
      return {
        id: row.id,
        mode: input.mode,
        status: 'active' as const,
        startedAt: now,
        targetQuitAt: input.targetQuitAt ?? null,
        baselineCigarettesPerDay: input.baselineCigarettesPerDay,
        currentDailyTarget: input.baselineCigarettesPerDay,
        motivation: input.motivation ?? null,
      };
    });
    emitDataChange('plan');
    return { success: true, data: plan };
  } catch (error) {
    return { success: false, error };
  }
}

export function getActiveQuitPlan(now = Date.now()) {
  return dbGetFirstAsync<QuitPlan>(
    `SELECT id, mode, status, started_at AS startedAt,
       target_quit_at AS targetQuitAt,
       baseline_cigarettes_per_day AS baselineCigarettesPerDay,
       COALESCE(
         (
           SELECT target_cigarettes_per_day
           FROM plan_week
           WHERE plan_id = quit_plan.id AND starts_at <= ?
           ORDER BY starts_at DESC
           LIMIT 1
         ),
         current_daily_target
       ) AS currentDailyTarget,
       motivation
     FROM quit_plan WHERE status IN ('active', 'paused')
     ORDER BY created_at DESC LIMIT 1`,
    [now],
  );
}

export function listPlanWeeks(planId: number) {
  return dbGetAllAsync<PlanWeek>(
    `SELECT id, week_index AS weekIndex, starts_at AS startsAt,
       target_cigarettes_per_day AS targetCigarettesPerDay,
       focus_trigger AS focusTrigger, focus_strategy AS focusStrategy,
       completed_at AS completedAt
     FROM plan_week WHERE plan_id = ? ORDER BY week_index`,
    [planId],
  );
}

export async function setQuitPlanStatus(
  id: number,
  status: QuitPlanStatus,
): Promise<MutationResult> {
  try {
    await dbTransactionAsync((transaction) =>
      transaction.runAsync(
        `UPDATE quit_plan SET status = ?, updated_at = ? WHERE id = ?`,
        [status, Date.now(), id],
      ),
    );
    emitDataChange('plan');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}
