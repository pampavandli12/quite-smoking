import { getSmokingSettings } from '@/db';
import { dbGetFirstAsync, dbRunAsync } from '@/db/client';
import type { MutationResult } from '@/services/types';

export type WeeklyReportPayload = {
  version: 1;
  total: number;
  previousTotal: number;
  cigarettesAvoided: number;
  moneySavedCents: number;
  resisted: number;
  delayed: number;
  smokedFromRescue: number;
  topTrigger: string | null;
};

function weekStart(date = new Date()) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export async function generateWeeklyReport(): Promise<WeeklyReportPayload | null> {
  const settings = await getSmokingSettings();
  if (!settings) return null;
  const start = weekStart();
  const end = start + 604800000;
  const previousStart = start - 604800000;
  const aggregate = await dbGetFirstAsync<{
    total: number;
    previousTotal: number;
    resisted: number;
    delayed: number;
    smokedFromRescue: number;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM smoking_log WHERE timestamp >= ? AND timestamp < ?) AS total,
      (SELECT COUNT(*) FROM smoking_log WHERE timestamp >= ? AND timestamp < ?) AS previousTotal,
      (SELECT COUNT(*) FROM craving_session WHERE started_at >= ? AND started_at < ? AND outcome = 'resisted') AS resisted,
      (SELECT COUNT(*) FROM craving_session WHERE started_at >= ? AND started_at < ? AND outcome = 'delayed') AS delayed,
      (SELECT COUNT(*) FROM craving_session WHERE started_at >= ? AND started_at < ? AND outcome = 'smoked') AS smokedFromRescue`,
    [start, end, previousStart, start, start, end, start, end, start, end],
  );
  if (!aggregate) return null;
  const trigger = await dbGetFirstAsync<{ trigger: string }>(
    `SELECT t.trigger FROM smoking_log_triggers t
     JOIN smoking_log l ON l.id = t.log_id
     WHERE l.timestamp >= ? AND l.timestamp < ?
     GROUP BY t.trigger ORDER BY COUNT(*) DESC LIMIT 1`,
    [start, end],
  );
  const cigarettesAvoided = Math.max(
    0,
    settings.cigarettesPerDay * 7 - aggregate.total,
  );
  const payload: WeeklyReportPayload = {
    version: 1,
    ...aggregate,
    cigarettesAvoided,
    moneySavedCents: cigarettesAvoided * settings.costPerCigaretteCents,
    topTrigger: trigger?.trigger ?? null,
  };
  await dbRunAsync(
    `INSERT INTO weekly_report (
      week_start, generated_at, baseline_cigarettes,
      cost_per_cigarette_cents, currency_code, payload_json
    ) VALUES (?, ?, ?, ?, 'INR', ?)
    ON CONFLICT(week_start) DO NOTHING`,
    [
      start,
      Date.now(),
      settings.cigarettesPerDay,
      settings.costPerCigaretteCents,
      JSON.stringify(payload),
    ],
  );
  return payload;
}

export async function exportWeeklyReport(): Promise<MutationResult> {
  try {
    let Print: typeof import('expo-print');
    let Sharing: typeof import('expo-sharing');
    try {
      [Print, Sharing] = await Promise.all([
        import('expo-print'),
        import('expo-sharing'),
      ]);
    } catch (error) {
      throw new Error(
        'Report export requires a rebuilt development client.',
        { cause: error },
      );
    }
    const report = await generateWeeklyReport();
    if (!report) throw new Error('Complete setup before exporting a report.');
    const file = await Print.printToFileAsync({
      html: `<html><body style="font-family: sans-serif; padding: 32px">
        <h1>Your weekly progress</h1>
        <p>Cigarettes recorded: ${report.total}</p>
        <p>Cigarettes avoided: ${report.cigarettesAvoided}</p>
        <p>Cravings resisted: ${report.resisted}</p>
        <p>Cravings delayed: ${report.delayed}</p>
        <p>Top trigger: ${report.topTrigger ?? 'Not enough data yet'}</p>
        <small>Educational progress summary; not medical advice.</small>
      </body></html>`,
    });
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf' });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}
