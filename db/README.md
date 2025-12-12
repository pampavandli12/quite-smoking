# Database Setup

This app uses expo-sqlite with Drizzle ORM for data persistence.

## Database Schema

### Tables

#### smoking_log

- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `timestamp` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

#### smoking_log_triggers

- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `log_id` (INTEGER, FOREIGN KEY → smoking_log.id)
- `trigger` (TEXT)

## Database Files

- `db/schema.ts` - Drizzle schema definitions
- `db/client.ts` - Database client and initialization
- `db/queries.ts` - Helper functions for database operations
- `db/index.ts` - Main export file
- `drizzle.config.ts` - Drizzle Kit configuration

## Usage

The database is automatically initialized when the app starts in `app/_layout.tsx`.

### Logging a Smoking Event

```typescript
import { logSmokingEvent } from "@/db";

// Log without triggers
await logSmokingEvent();

// Log with triggers
await logSmokingEvent(["stress", "social"]);
```

### Getting Statistics

```typescript
import { getTodayStats, getWeekStats, getAllSmokingLogs } from "@/db";

// Get today's count
const todayCount = await getTodayStats();

// Get this week's count
const weekCount = await getWeekStats();

// Get all logs
const allLogs = await getAllSmokingLogs();
```

### Getting Logs with Triggers

```typescript
import { getSmokingLogsWithTriggers } from "@/db";

const logs = await getSmokingLogsWithTriggers();
// Returns: [{ id, timestamp, triggers: [...] }]
```

### Deleting a Log

```typescript
import { deleteSmokingLog } from "@/db";

await deleteSmokingLog(logId);
```

## Database Location

The database file is stored at: `quitSmoking.db` in the app's document directory.
