import { drizzle } from 'drizzle-orm/expo-sqlite';
import {
  openDatabaseSync,
  type SQLiteBindParams,
  type SQLiteRunResult,
} from 'expo-sqlite';
import * as schema from './schema';

export const expoDb = openDatabaseSync('quitSmoking.db');

export const db = drizzle(expoDb, { schema });

let sqliteQueue = Promise.resolve();

function serializeSqlite<T>(operation: () => Promise<T>) {
  const next = sqliteQueue.then(operation, operation);
  sqliteQueue = next.then(
    () => undefined,
    () => undefined,
  );

  return next;
}

export function dbExecAsync(source: string) {
  return serializeSqlite(() => expoDb.execAsync(source));
}

export function dbRunAsync(
  source: string,
  params: SQLiteBindParams = [],
): Promise<SQLiteRunResult> {
  return serializeSqlite(() => expoDb.runAsync(source, params));
}

export function dbGetFirstAsync<T>(
  source: string,
  params: SQLiteBindParams = [],
) {
  return serializeSqlite(() => expoDb.getFirstAsync<T>(source, params));
}

export function dbGetAllAsync<T>(
  source: string,
  params: SQLiteBindParams = [],
) {
  return serializeSqlite(() => expoDb.getAllAsync<T>(source, params));
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create smoking_log table
    await dbExecAsync(`
      CREATE TABLE IF NOT EXISTS smoking_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
      );
    `);

    // Create smoking_log_triggers table
    await dbExecAsync(`
      CREATE TABLE IF NOT EXISTS smoking_log_triggers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER NOT NULL,
        trigger TEXT NOT NULL,
        FOREIGN KEY (log_id) REFERENCES smoking_log(id)
      );
    `);

    // Create user_smoking_settings table
    await dbExecAsync(`
      CREATE TABLE IF NOT EXISTS user_smoking_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cigarettes_per_day INTEGER NOT NULL,
        cost_per_cigarette_cents INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
      );
    `);

    await dbExecAsync(`
      DROP INDEX IF EXISTS idx_smoking_log_timestamp_ms;

      UPDATE smoking_log
      SET timestamp = CAST(strftime('%s', timestamp, 'utc') AS INTEGER) * 1000
      WHERE typeof(timestamp) = 'text'
        AND strftime('%s', timestamp, 'utc') IS NOT NULL;

      UPDATE user_smoking_settings
      SET created_at = CAST(strftime('%s', created_at, 'utc') AS INTEGER) * 1000
      WHERE typeof(created_at) = 'text'
        AND strftime('%s', created_at, 'utc') IS NOT NULL;
    `);

    try {
      await dbExecAsync(`
        CREATE INDEX IF NOT EXISTS idx_smoking_log_timestamp
        ON smoking_log(timestamp);

        CREATE INDEX IF NOT EXISTS idx_smoking_log_triggers_log_id
        ON smoking_log_triggers(log_id);
      `);
    } catch (indexError) {
      console.warn('Database indexes could not be created:', indexError);
    }

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error(
      'Database initialization failed while preparing quitSmoking.db:',
      error,
    );
    return false;
  }
}
