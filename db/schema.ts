import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const smokingLog = sqliteTable("smoking_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: integer("timestamp")
    .notNull()
    .default(sql`(cast(strftime('%s', 'now') as integer) * 1000)`),
});

export const smokingLogTriggers = sqliteTable("smoking_log_triggers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id")
    .notNull()
    .references(() => smokingLog.id),
  trigger: text("trigger").notNull(),
});
