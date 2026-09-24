import { dbGetFirstAsync, dbRunAsync } from '@/db/client';
import { emitDataChange } from '@/services/dataEvents';
import type { MutationResult } from '@/services/types';
import {
  type CurrencyCode,
  detectCurrencyFromDevice,
  detectDeviceLocale,
  isCurrencyCode,
} from '@/utils/currency';

export type MotionPreference = 'system' | 'reduced' | 'full';

export type UserPreferences = {
  motionPreference: MotionPreference;
  hapticsEnabled: boolean;
  currencyCode: CurrencyCode;
};

type PreferencesRow = {
  reduceMotionOverride: number | null;
  hapticsEnabled: number | null;
  currencyCode: string | null;
  locale: string | null;
};

function parseMotionPreference(
  reduceMotionOverride: number | null | undefined,
): MotionPreference {
  if (reduceMotionOverride === 1) return 'reduced';
  if (reduceMotionOverride === 0) return 'full';
  return 'system';
}

function parseCurrencyCode(value: string | null | undefined): CurrencyCode {
  if (value && isCurrencyCode(value)) return value;
  return detectCurrencyFromDevice();
}

let seedingPromise: Promise<void> | null = null;

const PREFERENCES_SELECT = `SELECT reduce_motion_override AS reduceMotionOverride,
  haptics_enabled AS hapticsEnabled,
  currency_code AS currencyCode,
  locale
FROM user_preferences WHERE id = 1`;

async function readPreferencesRow() {
  return dbGetFirstAsync<PreferencesRow>(PREFERENCES_SELECT);
}

async function seedCurrencyIfNeeded() {
  const row = await readPreferencesRow();
  if (row?.locale) return;

  const currencyCode = parseCurrencyCode(row?.currencyCode);
  const locale = detectDeviceLocale();

  await dbRunAsync(
    `INSERT INTO user_preferences (
      id, currency_code, locale, haptics_enabled, updated_at
    ) VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      currency_code = excluded.currency_code,
      locale = excluded.locale,
      updated_at = excluded.updated_at
    WHERE user_preferences.locale IS NULL`,
    [currencyCode, locale, row?.hapticsEnabled ?? 1, Date.now()],
  );
}

function ensureCurrencySeeded(): Promise<void> {
  if (!seedingPromise) {
    seedingPromise = seedCurrencyIfNeeded().finally(() => {
      seedingPromise = null;
    });
  }
  return seedingPromise;
}

export async function getUserPreferences(): Promise<UserPreferences> {
  await ensureCurrencySeeded();

  const row = await readPreferencesRow();

  return {
    motionPreference: parseMotionPreference(row?.reduceMotionOverride),
    hapticsEnabled: row?.hapticsEnabled !== 0,
    currencyCode: parseCurrencyCode(row?.currencyCode),
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
        id, reduce_motion_override, haptics_enabled, currency_code, locale, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        reduce_motion_override = excluded.reduce_motion_override,
        haptics_enabled = excluded.haptics_enabled,
        updated_at = excluded.updated_at`,
      [
        motion,
        preferences.hapticsEnabled ? 1 : 0,
        preferences.currencyCode,
        detectDeviceLocale(),
        Date.now(),
      ],
    );
    emitDataChange('preferences');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}

export async function saveCurrencyPreference(
  currencyCode: CurrencyCode,
): Promise<MutationResult> {
  try {
    const locale = detectDeviceLocale();
    await dbRunAsync(
      `INSERT INTO user_preferences (
        id, currency_code, locale, haptics_enabled, updated_at
      ) VALUES (1, ?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET
        currency_code = excluded.currency_code,
        locale = excluded.locale,
        updated_at = excluded.updated_at`,
      [currencyCode, locale, Date.now()],
    );
    emitDataChange('preferences');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}
