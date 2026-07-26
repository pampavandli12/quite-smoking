import { drizzle } from 'drizzle-orm/expo-sqlite';
import {
  openDatabaseSync,
  type SQLiteBindParams,
  type SQLiteDatabase,
  type SQLiteRunResult,
} from 'expo-sqlite';
import * as schema from './schema';
import {
  CREATE_INDEXES_SQL,
  CREATE_TABLES_SQL,
  DATABASE_VERSION,
  NORMALIZE_LEGACY_TIMESTAMPS_SQL,
} from './migrations';

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

export function dbTransactionAsync<T>(
  operation: (transaction: SQLiteDatabase) => Promise<T>,
) {
  return serializeSqlite(async () => {
    const results: T[] = [];

    await expoDb.withTransactionAsync(async () => {
      results.push(await operation(expoDb));
    });

    if (results.length !== 1) {
      throw new Error('Database transaction completed without a result.');
    }

    return results[0];
  });
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    await dbExecAsync(CREATE_TABLES_SQL);

    const versionRow = await dbGetFirstAsync<{ userVersion: number }>(
      'SELECT user_version as userVersion FROM pragma_user_version',
    );
    const currentVersion = versionRow?.userVersion ?? 0;

    if (currentVersion < DATABASE_VERSION) {
      await dbTransactionAsync(async (transaction) => {
        await transaction.execAsync(NORMALIZE_LEGACY_TIMESTAMPS_SQL);
        await transaction.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
      });
    }

    try {
      await dbExecAsync(CREATE_INDEXES_SQL);
    } catch (indexError) {
      console.warn('Database indexes could not be created:', indexError);
    }

    if (__DEV__) {
      console.log('Database initialized successfully');
    }
    return true;
  } catch (error) {
    console.error(
      'Database initialization failed while preparing quitSmoking.db:',
      error,
    );
    return false;
  }
}
