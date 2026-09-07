import { dbGetFirstAsync, dbRunAsync } from '@/db/client';
import { emitDataChange } from '@/services/dataEvents';
import type { MutationResult } from '@/services/types';

export type MotionPreference = 'system' | 'reduced' | 'full';

export type UserPreferences = {
  motionPreference: MotionPreference;
  hapticsEnabled: boolean;
};

export async function getUserPreferences(): Promise<UserPreferences> {
  const row = await dbGetFirstAsync<{
    reduceMotionOverride: number | null;
    hapticsEnabled: number;
  }>(
    `SELECT reduce_motion_override AS reduceMotionOverride,
       haptics_enabled AS hapticsEnabled
     FROM user_preferences WHERE id = 1`,
  );
  return {
    motionPreference:
      row?.reduceMotionOverride === 1
        ? 'reduced'
        : row?.reduceMotionOverride === 0
          ? 'full'
          : 'system',
    hapticsEnabled: row?.hapticsEnabled !== 0,
  };
}

export async function saveUserPreferences(
  preferences: UserPreferences,
): Promise<MutationResult> {
  try {
    const motion =
      preferences.motionPreference === 'system'
        ? null
        : preferences.motionPreference === 'reduced'
          ? 1
          : 0;
    await dbRunAsync(
      `INSERT INTO user_preferences (
        id, reduce_motion_override, haptics_enabled, updated_at
      ) VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        reduce_motion_override = excluded.reduce_motion_override,
        haptics_enabled = excluded.haptics_enabled,
        updated_at = excluded.updated_at`,
      [motion, preferences.hapticsEnabled ? 1 : 0, Date.now()],
    );
    emitDataChange('preferences');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}
