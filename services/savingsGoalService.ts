import { dbGetFirstAsync, dbRunAsync } from '@/db/client';
import { emitDataChange } from '@/services/dataEvents';
import type { MutationResult } from '@/services/types';
import { validateSavingsGoal, type SavingsGoalInput } from '@/utils/savingsGoal';

export type SavingsGoal = {
  id: number;
  title: string;
  targetAmountCents: number;
  createdAt: number;
  completedAt: number | null;
};

export function getActiveSavingsGoal() {
  return dbGetFirstAsync<SavingsGoal>(
    `SELECT id, title, target_amount_cents AS targetAmountCents,
       created_at AS createdAt, completed_at AS completedAt
     FROM savings_goal WHERE completed_at IS NULL
     ORDER BY created_at DESC, id DESC LIMIT 1`,
  );
}

export async function countCompletedSavingsGoals() {
  const row = await dbGetFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM savings_goal WHERE completed_at IS NOT NULL`,
  );
  return row?.count ?? 0;
}

export async function createSavingsGoal(
  input: SavingsGoalInput,
): Promise<MutationResult> {
  const invalid = validateSavingsGoal(input);
  if (invalid) return { success: false, error: new Error(invalid) };
  try {
    await dbRunAsync(
      `INSERT INTO savings_goal (title, target_amount_cents, created_at)
       VALUES (?, ?, ?)`,
      [input.title.trim(), input.targetAmountCents, Date.now()],
    );
    emitDataChange('goal');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}

export async function completeSavingsGoal(id: number): Promise<MutationResult> {
  try {
    await dbRunAsync(
      `UPDATE savings_goal SET completed_at = ? WHERE id = ? AND completed_at IS NULL`,
      [Date.now(), id],
    );
    emitDataChange('goal');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}

export async function deleteSavingsGoal(id: number): Promise<MutationResult> {
  try {
    await dbRunAsync(`DELETE FROM savings_goal WHERE id = ?`, [id]);
    emitDataChange('goal');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}
