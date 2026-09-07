import { dbGetAllAsync, dbGetFirstAsync, dbTransactionAsync } from '@/db/client';
import { emitDataChange } from '@/services/dataEvents';
import type {
  CopingStrategy,
  CravingOutcome,
  MutationResult,
} from '@/services/types';

export type CravingSession = {
  id: number;
  startedAt: number;
  trigger: string | null;
  intensityBefore: number | null;
  selectedDurationSeconds: number;
};

const fallbackStrategy: Record<string, CopingStrategy> = {
  stress: 'breathing',
  anxiety: 'urge_surfing',
  coffee: 'water',
  boredom: 'distraction',
  'after meals': 'walk',
};

export async function getRecommendedStrategy(trigger: string) {
  const learned = await dbGetFirstAsync<{ strategy: CopingStrategy }>(
    `SELECT s.strategy
     FROM craving_session_strategy s
     JOIN craving_session c ON c.id = s.session_id
     WHERE c.trigger = ? AND c.outcome IN ('resisted', 'delayed')
     GROUP BY s.strategy HAVING COUNT(*) >= 3
     ORDER BY COUNT(*) DESC LIMIT 1`,
    [trigger],
  );
  return learned?.strategy ?? fallbackStrategy[trigger] ?? 'breathing';
}

export async function startCravingSession(input: {
  trigger: string;
  intensity: number;
  durationSeconds: number;
  strategy: CopingStrategy;
}): Promise<MutationResult<CravingSession>> {
  if (!Number.isInteger(input.intensity) || input.intensity < 1 || input.intensity > 10) {
    return { success: false, error: new Error('Intensity must be from 1 to 10.') };
  }
  try {
    const session = await dbTransactionAsync(async (transaction) => {
      const now = Date.now();
      const row = await transaction.getFirstAsync<{ id: number }>(
        `INSERT INTO craving_session (
          started_at, trigger, intensity_before, selected_duration_seconds,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
        [now, input.trigger, input.intensity, input.durationSeconds, now, now],
      );
      if (!row) throw new Error('Craving session insert did not return an id.');
      await transaction.runAsync(
        `INSERT INTO craving_session_strategy (session_id, strategy)
         VALUES (?, ?)`,
        [row.id, input.strategy],
      );
      return {
        id: row.id,
        startedAt: now,
        trigger: input.trigger,
        intensityBefore: input.intensity,
        selectedDurationSeconds: input.durationSeconds,
      };
    });
    emitDataChange('craving');
    return { success: true, data: session };
  } catch (error) {
    return { success: false, error };
  }
}

export async function completeCravingSession(input: {
  id: number;
  intensityAfter: number;
  outcome: CravingOutcome;
}): Promise<MutationResult<{ smokingLogId?: number }>> {
  try {
    const data = await dbTransactionAsync(async (transaction) => {
      const now = Date.now();
      let smokingLogId: number | undefined;
      if (input.outcome === 'smoked') {
        const log = await transaction.getFirstAsync<{ id: number }>(
          `INSERT INTO smoking_log (timestamp, source, updated_at)
           VALUES (?, 'rescue', ?) RETURNING id`,
          [now, now],
        );
        if (!log) throw new Error('Smoking log insert did not return an id.');
        smokingLogId = log.id;
      }
      await transaction.runAsync(
        `UPDATE craving_session
         SET completed_at = ?, intensity_after = ?, outcome = ?,
             linked_smoking_log_id = ?, updated_at = ?
         WHERE id = ?`,
        [now, input.intensityAfter, input.outcome, smokingLogId ?? null, now, input.id],
      );
      await transaction.runAsync(
        `UPDATE craving_session_strategy SET completed = 1 WHERE session_id = ?`,
        [input.id],
      );
      return { smokingLogId };
    });
    emitDataChange('craving');
    emitDataChange('history');
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

export function getIncompleteCravingSession() {
  return dbGetFirstAsync<CravingSession>(
    `SELECT id, started_at AS startedAt, trigger,
       intensity_before AS intensityBefore,
       selected_duration_seconds AS selectedDurationSeconds
     FROM craving_session WHERE completed_at IS NULL
     ORDER BY started_at DESC LIMIT 1`,
  );
}

export async function countThisWeekRescueSessions() {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  const rows = await dbGetAllAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM craving_session WHERE started_at >= ?`,
    [start.getTime()],
  );
  return rows[0]?.count ?? 0;
}
