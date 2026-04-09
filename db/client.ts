import { drizzle } from "drizzle-orm/expo-sqlite";
import { importDatabaseFromAssetAsync, openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DB_NAME = "quitSmoking.db";
const DB_ASSET_ID = require("../assets/quitSmoking.db");
const FORCE_OVERWRITE_WITH_BUNDLED_DB = true;

type AppDatabase = ReturnType<typeof drizzle>;

let dbInstance: AppDatabase | null = null;
let initializationPromise: Promise<boolean> | null = null;

function createDatabase() {
  const expoDb = openDatabaseSync(DB_NAME);
  return {
    expoDb,
    db: drizzle(expoDb, { schema }),
  };
}

async function shiftBundledDataToCurrentDate(
  expoDb: ReturnType<typeof openDatabaseSync>,
) {
  const latestRow = await expoDb.getFirstAsync<{ latest: string | null }>(
    "SELECT MAX(timestamp) AS latest FROM smoking_log;",
  );

  if (!latestRow?.latest) {
    return;
  }

  const latestTimestamp = new Date(latestRow.latest.replace(" ", "T"));
  if (Number.isNaN(latestTimestamp.getTime())) {
    return;
  }

  const now = new Date();
  const diffMs = now.getTime() - latestTimestamp.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds <= 0) {
    return;
  }

  await expoDb.runAsync(
    `
      UPDATE smoking_log
      SET timestamp = datetime(strftime('%s', timestamp) + ?, 'unixepoch')
      WHERE timestamp IS NOT NULL;
    `,
    diffSeconds,
  );
}

export function getDb(): AppDatabase {
  if (!dbInstance) {
    throw new Error("Database has not been initialized yet.");
  }

  return dbInstance;
}

export async function getDbAsync(): Promise<AppDatabase> {
  if (!dbInstance) {
    const success = await initializeDatabase();
    if (!success || !dbInstance) {
      throw new Error("Database initialization failed.");
    }
  }

  return dbInstance;
}

export const db = new Proxy({} as AppDatabase, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});

export async function initializeDatabase() {
  if (dbInstance) {
    return true;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      await importDatabaseFromAssetAsync(DB_NAME, {
        assetId: DB_ASSET_ID,
        forceOverwrite: FORCE_OVERWRITE_WITH_BUNDLED_DB,
      });

      const { expoDb, db } = createDatabase();
      dbInstance = db;

      await expoDb.execAsync("PRAGMA foreign_keys = ON;");

      await expoDb.execAsync(`
        CREATE TABLE IF NOT EXISTS smoking_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await expoDb.execAsync(`
        CREATE TABLE IF NOT EXISTS smoking_log_triggers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          log_id INTEGER,
          trigger TEXT,
          FOREIGN KEY (log_id) REFERENCES smoking_log(id)
        );
      `);

      await shiftBundledDataToCurrentDate(expoDb);

      console.log("Database initialized successfully with bundled test data");
      return true;
    } catch (error) {
      console.error("Error initializing database:", error);
      return false;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}
