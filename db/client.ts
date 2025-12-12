import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expoDb = openDatabaseSync("quitSmoking.db");

export const db = drizzle(expoDb, { schema });

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create smoking_log table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS smoking_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create smoking_log_triggers table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS smoking_log_triggers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER,
        trigger TEXT,
        FOREIGN KEY (log_id) REFERENCES smoking_log(id)
      );
    `);

    console.log("Database initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}
