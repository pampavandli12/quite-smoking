import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expoDb = openDatabaseSync('quitSmoking.db');

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

    // Create user_smoking_settings table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS user_smoking_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cigarettes_per_day INTEGER NOT NULL,
        cost_per_cigarette_cents INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}
