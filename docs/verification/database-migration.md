# Database Migration Verification

The database filename and schema remain unchanged. `PRAGMA user_version = 1`
records completion of legacy timestamp normalization.

Before release:

- Run `db/__tests__/migrations.test.ts`.
- Test fresh, integer, legacy text, invalid text, mixed, and populated fixtures.
- Upgrade a device without clearing data.
- Confirm `PRAGMA integrity_check` returns `ok`.
- Confirm logging creates one log and its trigger atomically.
- Confirm restarting does not rerun timestamp normalization.
- Compare Home and Week/Month/Year values before and after upgrade.

If migration fails, initialization returns failure and the existing recovery UI
is shown. Do not delete, recreate, or silently reset the database.
