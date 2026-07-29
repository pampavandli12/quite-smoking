import {
  dbGetAllAsync,
  dbGetFirstAsync,
  dbRunAsync,
  dbTransactionAsync,
} from '@/db/client';
import { emitDataChange } from '@/services/dataEvents';
import type { MutationResult } from '@/services/types';

export type HistoryItem = {
  id: number;
  timestamp: number | string;
  note: string | null;
  source: string;
  triggers: string[];
};

type HistoryRow = Omit<HistoryItem, 'triggers'> & { triggers: string | null };

export async function listHistory(
  limit = 50,
  offset = 0,
): Promise<HistoryItem[]> {
  const rows = await dbGetAllAsync<HistoryRow>(
    `SELECT l.id, l.timestamp, l.note, l.source,
       GROUP_CONCAT(t.trigger, '|||') AS triggers
     FROM smoking_log l
     LEFT JOIN smoking_log_triggers t ON t.log_id = l.id
     GROUP BY l.id
     ORDER BY l.timestamp DESC, l.id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows.map((row) => ({
    ...row,
    triggers: row.triggers ? row.triggers.split('|||') : [],
  }));
}

export async function addHistoryItem(input: {
  timestamp: number;
  triggers?: string[];
  note?: string;
}): Promise<MutationResult<{ id: number }>> {
  try {
    const id = await dbTransactionAsync(async (transaction) => {
      const result = await transaction.getFirstAsync<{ id: number }>(
        `INSERT INTO smoking_log (timestamp, note, source, updated_at)
         VALUES (?, ?, 'history', ?) RETURNING id`,
        [input.timestamp, input.note ?? null, Date.now()],
      );
      if (!result) throw new Error('History insert did not return an id.');
      for (const trigger of input.triggers ?? []) {
        await transaction.runAsync(
          `INSERT INTO smoking_log_triggers (log_id, trigger) VALUES (?, ?)`,
          [result.id, trigger],
        );
      }
      return result.id;
    });
    emitDataChange('history');
    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, error };
  }
}

export async function updateHistoryItem(input: {
  id: number;
  timestamp: number;
  triggers: string[];
  note?: string;
}): Promise<MutationResult> {
  try {
    await dbTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `UPDATE smoking_log SET timestamp = ?, note = ?, updated_at = ? WHERE id = ?`,
        [input.timestamp, input.note ?? null, Date.now(), input.id],
      );
      await transaction.runAsync(
        `DELETE FROM smoking_log_triggers WHERE log_id = ?`,
        [input.id],
      );
      for (const trigger of input.triggers) {
        await transaction.runAsync(
          `INSERT INTO smoking_log_triggers (log_id, trigger) VALUES (?, ?)`,
          [input.id, trigger],
        );
      }
    });
    emitDataChange('history');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}

export async function deleteHistoryItem(id: number): Promise<MutationResult> {
  try {
    await dbTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `UPDATE craving_session
         SET linked_smoking_log_id = NULL, outcome = 'abandoned', updated_at = ?
         WHERE linked_smoking_log_id = ?`,
        [Date.now(), id],
      );
      await transaction.runAsync(
        `DELETE FROM smoking_log_triggers WHERE log_id = ?`,
        [id],
      );
      await transaction.runAsync(`DELETE FROM smoking_log WHERE id = ?`, [id]);
    });
    emitDataChange('history');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getHistoryItem(id: number) {
  return dbGetFirstAsync<HistoryRow>(
    `SELECT l.id, l.timestamp, l.note, l.source, NULL AS triggers
     FROM smoking_log l WHERE l.id = ?`,
    [id],
  );
}
