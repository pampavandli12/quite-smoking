import { DatabaseSync } from 'node:sqlite';
import {
  CREATE_INDEXES_SQL,
  CREATE_TABLES_SQL,
  DATABASE_VERSION,
  NORMALIZE_LEGACY_TIMESTAMPS_SQL,
} from '../migrations';

function migrate(database: DatabaseSync) {
  database.exec(CREATE_TABLES_SQL);
  const currentVersion = database
    .prepare('PRAGMA user_version')
    .get() as { user_version: number };

  if (currentVersion.user_version < DATABASE_VERSION) {
    database.exec('BEGIN');
    try {
      database.exec(NORMALIZE_LEGACY_TIMESTAMPS_SQL);
      database.exec(`PRAGMA user_version = ${DATABASE_VERSION}`);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }

  database.exec(CREATE_INDEXES_SQL);
}

describe('database migration', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec(CREATE_TABLES_SQL);
  });

  afterEach(() => {
    database.close();
  });

  test('normalizes convertible legacy timestamps and preserves invalid values', () => {
    database.exec(`
      INSERT INTO smoking_log (timestamp) VALUES
        ('2026-07-25T10:30:00.000Z'),
        ('not-a-date'),
        (1753439400000);
      INSERT INTO user_smoking_settings (
        cigarettes_per_day,
        cost_per_cigarette_cents,
        created_at
      ) VALUES (10, 2000, '2026-07-25T10:30:00.000Z');
    `);

    migrate(database);

    const logs = database
      .prepare('SELECT timestamp, typeof(timestamp) as type FROM smoking_log ORDER BY id')
      .all();
    const settings = database
      .prepare(
        'SELECT created_at, typeof(created_at) as type FROM user_smoking_settings',
      )
      .get();

    expect(logs).toEqual([
      { timestamp: 1784975400000, type: 'integer' },
      { timestamp: 'not-a-date', type: 'text' },
      { timestamp: 1753439400000, type: 'integer' },
    ]);
    expect(settings).toEqual({
      created_at: 1784975400000,
      type: 'integer',
    });
    expect(database.prepare('PRAGMA user_version').get()).toEqual({
      user_version: DATABASE_VERSION,
    });
  });

  test('is idempotent after the migration version is recorded', () => {
    database.exec(`
      INSERT INTO smoking_log (timestamp)
      VALUES ('2026-07-25T10:30:00.000Z');
    `);

    migrate(database);
    const firstResult = database
      .prepare('SELECT timestamp FROM smoking_log')
      .get();
    migrate(database);

    expect(database.prepare('SELECT timestamp FROM smoking_log').get()).toEqual(
      firstResult,
    );
  });

  test('rolls back normalization and the version marker on failure', () => {
    database.exec(`
      INSERT INTO smoking_log (timestamp)
      VALUES ('2026-07-25T10:30:00.000Z');
      CREATE TRIGGER reject_timestamp_update
      BEFORE UPDATE ON smoking_log
      BEGIN
        SELECT RAISE(ABORT, 'forced migration failure');
      END;
    `);

    expect(() => migrate(database)).toThrow('forced migration failure');
    expect(database.prepare('SELECT timestamp FROM smoking_log').get()).toEqual(
      { timestamp: '2026-07-25T10:30:00.000Z' },
    );
    expect(database.prepare('PRAGMA user_version').get()).toEqual({
      user_version: 0,
    });
  });

  test.each([
    ['disabled', 'OFF', 0],
    ['enabled', 'ON', 1],
  ] as const)(
    'does not change foreign-key enforcement when it is %s',
    (_label, setting, expected) => {
      database.exec(`PRAGMA foreign_keys = ${setting}`);
      expect(database.prepare('PRAGMA foreign_keys').get()).toEqual({
        foreign_keys: expected,
      });

      migrate(database);

      expect(database.prepare('PRAGMA foreign_keys').get()).toEqual({
        foreign_keys: expected,
      });
    },
  );

  test('creates the hot query indexes', () => {
    migrate(database);

    const indexes = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' ORDER BY name",
      )
      .all()
      .map((row) => (row as { name: string }).name);

    expect(indexes).toEqual([
      'idx_smoking_log_timestamp',
      'idx_smoking_log_timestamp_normalized',
      'idx_smoking_log_triggers_log_id',
    ]);
  });

  test('uses the normalized timestamp index for legacy-compatible ranges', () => {
    migrate(database);

    const plan = database
      .prepare(`
        EXPLAIN QUERY PLAN
        SELECT COUNT(*)
        FROM smoking_log
        WHERE (
          CASE
            WHEN typeof(timestamp) IN ('integer', 'real') THEN CAST(timestamp AS INTEGER)
            WHEN CAST(timestamp AS INTEGER) >= 946684800000 THEN CAST(timestamp AS INTEGER)
            ELSE CAST(strftime('%s', timestamp, 'utc') AS INTEGER) * 1000
          END
        ) BETWEEN ? AND ?
      `)
      .all(0, Date.now())
      .map((row) => (row as { detail: string }).detail)
      .join(' ');

    expect(plan).toContain('idx_smoking_log_timestamp_normalized');
  });

  test('keeps the normalized index usable with a large mixed history', () => {
    database.exec(`
      WITH RECURSIVE sequence(value) AS (
        SELECT 0
        UNION ALL
        SELECT value + 1 FROM sequence WHERE value < 9999
      )
      INSERT INTO smoking_log (timestamp)
      SELECT
        CASE
          WHEN value % 2 = 0 THEN 1704067200000 + (value * 60000)
          ELSE datetime(1704067200 + (value * 60), 'unixepoch')
        END
      FROM sequence;
    `);

    migrate(database);

    expect(
      database.prepare('SELECT COUNT(*) AS count FROM smoking_log').get(),
    ).toEqual({ count: 10000 });

    const plan = database
      .prepare(`
        EXPLAIN QUERY PLAN
        SELECT COUNT(*)
        FROM smoking_log
        WHERE (
          CASE
            WHEN typeof(timestamp) IN ('integer', 'real') THEN CAST(timestamp AS INTEGER)
            WHEN CAST(timestamp AS INTEGER) >= 946684800000 THEN CAST(timestamp AS INTEGER)
            ELSE CAST(strftime('%s', timestamp, 'utc') AS INTEGER) * 1000
          END
        ) BETWEEN ? AND ?
      `)
      .all(1704067200000, 1704667200000)
      .map((row) => (row as { detail: string }).detail)
      .join(' ');

    expect(plan).toContain('idx_smoking_log_timestamp_normalized');
  });
});
