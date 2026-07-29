import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 5;

export type DatabaseMigration = {
  version: number;
  migrate: (transaction: SQLiteDatabase) => Promise<void>;
};

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS smoking_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
  );

  CREATE TABLE IF NOT EXISTS smoking_log_triggers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id INTEGER NOT NULL,
    trigger TEXT NOT NULL,
    FOREIGN KEY (log_id) REFERENCES smoking_log(id)
  );

  CREATE TABLE IF NOT EXISTS user_smoking_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cigarettes_per_day INTEGER NOT NULL,
    cost_per_cigarette_cents INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
  );
`;

export const NORMALIZE_LEGACY_TIMESTAMPS_SQL = `
  DROP INDEX IF EXISTS idx_smoking_log_timestamp_ms;

  UPDATE smoking_log
  SET timestamp = CAST(strftime('%s', timestamp, 'utc') AS INTEGER) * 1000
  WHERE typeof(timestamp) = 'text'
    AND strftime('%s', timestamp, 'utc') IS NOT NULL;

  UPDATE user_smoking_settings
  SET created_at = CAST(strftime('%s', created_at, 'utc') AS INTEGER) * 1000
  WHERE typeof(created_at) = 'text'
    AND strftime('%s', created_at, 'utc') IS NOT NULL;
`;

export const MIGRATION_2_SQL = `
  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  ALTER TABLE smoking_log ADD COLUMN note TEXT;
  ALTER TABLE smoking_log ADD COLUMN updated_at INTEGER;
  ALTER TABLE smoking_log ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
`;

export const MIGRATION_3_SQL = `
  CREATE TABLE IF NOT EXISTS craving_session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    trigger TEXT,
    intensity_before INTEGER CHECK(intensity_before BETWEEN 1 AND 10),
    intensity_after INTEGER CHECK(intensity_after BETWEEN 1 AND 10),
    selected_duration_seconds INTEGER NOT NULL,
    outcome TEXT CHECK(outcome IN ('resisted', 'delayed', 'smoked', 'abandoned')),
    linked_smoking_log_id INTEGER,
    note TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (linked_smoking_log_id) REFERENCES smoking_log(id)
  );
  CREATE TABLE IF NOT EXISTS craving_session_strategy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    strategy TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES craving_session(id)
  );
  CREATE INDEX IF NOT EXISTS idx_craving_session_started_at
  ON craving_session(started_at);
`;

export const MIGRATION_4_SQL = `
  CREATE TABLE IF NOT EXISTS quit_plan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL CHECK(mode IN ('quit_date', 'gradual_reduction')),
    status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'completed', 'archived')),
    started_at INTEGER NOT NULL,
    target_quit_at INTEGER,
    baseline_cigarettes_per_day INTEGER NOT NULL,
    current_daily_target INTEGER NOT NULL,
    motivation TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS plan_week (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    week_index INTEGER NOT NULL,
    starts_at INTEGER NOT NULL,
    target_cigarettes_per_day INTEGER NOT NULL,
    focus_trigger TEXT,
    focus_strategy TEXT,
    completed_at INTEGER,
    FOREIGN KEY (plan_id) REFERENCES quit_plan(id),
    UNIQUE(plan_id, week_index)
  );
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    currency_code TEXT NOT NULL DEFAULT 'INR',
    locale TEXT,
    reduce_motion_override INTEGER,
    haptics_enabled INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_plan_week_plan_id ON plan_week(plan_id);
`;

export const MIGRATION_5_SQL = `
  CREATE TABLE IF NOT EXISTS notification_preferences (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    enabled INTEGER NOT NULL DEFAULT 0,
    daily_check_in_time TEXT,
    milestone_enabled INTEGER NOT NULL DEFAULT 1,
    risk_window_enabled INTEGER NOT NULL DEFAULT 0,
    plan_reminders_enabled INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS weekly_report (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start INTEGER NOT NULL UNIQUE,
    generated_at INTEGER NOT NULL,
    baseline_cigarettes INTEGER NOT NULL,
    cost_per_cigarette_cents INTEGER NOT NULL,
    currency_code TEXT NOT NULL,
    payload_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS savings_goal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    target_amount_cents INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    completed_at INTEGER
  );
`;

export const ENSURE_PRODUCT_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  ${MIGRATION_3_SQL}
  ${MIGRATION_4_SQL}
  ${MIGRATION_5_SQL}
`;

export const DATABASE_MIGRATIONS: DatabaseMigration[] = [
  {
    version: 1,
    migrate: (transaction) =>
      transaction.execAsync(NORMALIZE_LEGACY_TIMESTAMPS_SQL),
  },
  {
    version: 2,
    migrate: async (transaction) => {
      const existing = await transaction.getFirstAsync<{ count: number }>(`
        SELECT
          (SELECT COUNT(*) FROM smoking_log) +
          (SELECT COUNT(*) FROM user_smoking_settings) AS count
      `);
      await transaction.execAsync(MIGRATION_2_SQL);
      if ((existing?.count ?? 0) > 0) {
        await transaction.runAsync(
          `INSERT OR IGNORE INTO app_metadata (key, value, updated_at)
           VALUES ('legacy_access', 'true', ?)`,
          [Date.now()],
        );
      }
    },
  },
  { version: 3, migrate: (transaction) => transaction.execAsync(MIGRATION_3_SQL) },
  { version: 4, migrate: (transaction) => transaction.execAsync(MIGRATION_4_SQL) },
  { version: 5, migrate: (transaction) => transaction.execAsync(MIGRATION_5_SQL) },
];

export const CREATE_INDEXES_SQL = `
  CREATE INDEX IF NOT EXISTS idx_smoking_log_timestamp ON smoking_log(timestamp);
  CREATE INDEX IF NOT EXISTS idx_smoking_log_triggers_log_id ON smoking_log_triggers(log_id);
  CREATE INDEX IF NOT EXISTS idx_smoking_log_timestamp_normalized
  ON smoking_log(
    CASE
      WHEN typeof(timestamp) IN ('integer', 'real') THEN CAST(timestamp AS INTEGER)
      WHEN CAST(timestamp AS INTEGER) >= 946684800000 THEN CAST(timestamp AS INTEGER)
      ELSE CAST(strftime('%s', timestamp, 'utc') AS INTEGER) * 1000
    END
  );
`;
