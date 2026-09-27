import { getLastSmokingTimestamp, getSmokingSettingsHistory } from '@/db';
import { toEpochMs } from '@/utils/timestamps';

export type RecoveryAnchor = {
  since: number;
  source: 'last_cigarette' | 'tracking_start';
};

// Recovery is measured from the last recorded cigarette, or from when the
// user started tracking if nothing has been logged yet.
export async function getRecoveryAnchor(): Promise<RecoveryAnchor | null> {
  const last = await getLastSmokingTimestamp();
  if (last !== null) return { since: last, source: 'last_cigarette' };
  const settings = await getSmokingSettingsHistory();
  const start = toEpochMs(settings[0]?.createdAt);
  return start === null ? null : { since: start, source: 'tracking_start' };
}
