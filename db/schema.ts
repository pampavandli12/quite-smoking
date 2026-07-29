import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const smokingLog = sqliteTable('smoking_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: integer('timestamp')
    .notNull()
    .default(sql`(cast(strftime('%s', 'now') as integer) * 1000)`),
  note: text('note'),
  updatedAt: integer('updated_at'),
  source: text('source').notNull().default('manual'),
});

export const smokingLogTriggers = sqliteTable('smoking_log_triggers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  logId: integer('log_id')
    .notNull()
    .references(() => smokingLog.id),
  trigger: text('trigger').notNull(),
});

export const userSmokingSettings = sqliteTable('user_smoking_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cigarettesPerDay: integer('cigarettes_per_day').notNull(),
  costPerCigaretteCents: integer('cost_per_cigarette_cents').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(cast(strftime('%s', 'now') as integer) * 1000)`),
});
