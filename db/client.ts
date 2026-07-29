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
  DATABASE_MIGRATIONS,
  DATABASE_VERSION,
  ENSURE_PRODUCT_TABLES_SQL,
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

async function ensureProductSchema() {
  await dbExecAsync(ENSURE_PRODUCT_TABLES_SQL);
  const columns = await dbGetAllAsync<{ name: string }>(
    `PRAGMA table_info(smoking_log)`,
  );
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('note')) {
    await dbExecAsync(`ALTER TABLE smoking_log ADD COLUMN note TEXT`);
  }
  if (!columnNames.has('updated_at')) {
    await dbExecAsync(`ALTER TABLE smoking_log ADD COLUMN updated_at INTEGER`);
  }
  if (!columnNames.has('source')) {
    await dbExecAsync(
      `ALTER TABLE smoking_log
       ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'`,
    );
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    await dbExecAsync(CREATE_TABLES_SQL);

    const versionRow = await dbGetFirstAsync<{ userVersion: number }>(
      'SELECT user_version as userVersion FROM pragma_user_version',
    );
    const currentVersion = versionRow?.userVersion ?? 0;

    for (const migration of DATABASE_MIGRATIONS) {
      if (migration.version <= currentVersion) {
        continue;
      }
      await dbTransactionAsync(async (transaction) => {
        await migration.migrate(transaction);
        await transaction.execAsync(
          `PRAGMA user_version = ${migration.version}`,
        );
      });
    }

    const metadataTable = await dbGetFirstAsync<{ name: string }>(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = 'app_metadata'`,
    );

    // Development hot reloads and interrupted historical builds may leave a
    // version marker ahead of the additive schema. Reconcile safely without
    // modifying existing smoking data.
    await ensureProductSchema();
    if (currentVersion >= 2 && !metadataTable) {
      const existing = await dbGetFirstAsync<{ count: number }>(`
        SELECT
          (SELECT COUNT(*) FROM smoking_log) +
          (SELECT COUNT(*) FROM user_smoking_settings) AS count
      `);
      if ((existing?.count ?? 0) > 0) {
        await dbRunAsync(
          `INSERT OR IGNORE INTO app_metadata (key, value, updated_at)
           VALUES ('legacy_access', 'true', ?)`,
          [Date.now()],
        );
      }
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
