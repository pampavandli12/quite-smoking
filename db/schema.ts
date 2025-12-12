import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const smokingLog = sqliteTable("smoking_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: text("timestamp")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const smokingLogTriggers = sqliteTable("smoking_log_triggers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id")
    .notNull()
    .references(() => smokingLog.id),
  trigger: text("trigger").notNull(),
});
