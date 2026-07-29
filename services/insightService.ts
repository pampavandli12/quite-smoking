import { dbGetAllAsync, dbGetFirstAsync } from '@/db/client';

export type PeakWindow = {
  hour: number;
  count: number;
  distinctDays: number;
};

export type CopingEffectiveness = {
  strategy: string;
  sessions: number;
  successful: number;
  rate: number;
};

export async function getPeakSmokingHours(): Promise<PeakWindow[]> {
  const rows = await dbGetAllAsync<PeakWindow>(
    `SELECT
       CAST(strftime('%H', timestamp / 1000, 'unixepoch', 'localtime') AS INTEGER) AS hour,
       COUNT(*) AS count,
       COUNT(DISTINCT date(timestamp / 1000, 'unixepoch', 'localtime')) AS distinctDays
     FROM smoking_log
     WHERE typeof(timestamp) IN ('integer', 'real')
     GROUP BY hour ORDER BY count DESC LIMIT 2`,
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return total >= 10 && rows.some((row) => row.distinctDays >= 5) ? rows : [];
}

export function getTopTriggerInsight() {
  return dbGetFirstAsync<{ trigger: string; count: number }>(
    `SELECT trigger, COUNT(*) AS count FROM smoking_log_triggers
     GROUP BY trigger HAVING COUNT(*) >= 5 ORDER BY count DESC LIMIT 1`,
  );
}

export async function getCopingEffectiveness(): Promise<CopingEffectiveness[]> {
  const rows = await dbGetAllAsync<Omit<CopingEffectiveness, 'rate'>>(
    `SELECT s.strategy, COUNT(*) AS sessions,
       SUM(CASE WHEN c.outcome IN ('resisted', 'delayed') THEN 1 ELSE 0 END) AS successful
     FROM craving_session_strategy s
     JOIN craving_session c ON c.id = s.session_id
     WHERE c.completed_at IS NOT NULL
     GROUP BY s.strategy HAVING COUNT(*) >= 5
     ORDER BY successful DESC`,
  );
  return rows.map((row) => ({
    ...row,
    rate: Math.round((row.successful / row.sessions) * 100),
  }));
}
