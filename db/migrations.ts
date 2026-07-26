export const DATABASE_VERSION = 1;

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

export const CREATE_INDEXES_SQL = `
  CREATE INDEX IF NOT EXISTS idx_smoking_log_timestamp
  ON smoking_log(timestamp);

  CREATE INDEX IF NOT EXISTS idx_smoking_log_triggers_log_id
  ON smoking_log_triggers(log_id);

  CREATE INDEX IF NOT EXISTS idx_smoking_log_timestamp_normalized
  ON smoking_log(
    CASE
      WHEN typeof(timestamp) IN ('integer', 'real') THEN CAST(timestamp AS INTEGER)
      WHEN CAST(timestamp AS INTEGER) >= 946684800000 THEN CAST(timestamp AS INTEGER)
      ELSE CAST(strftime('%s', timestamp, 'utc') AS INTEGER) * 1000
    END
  );
`;
