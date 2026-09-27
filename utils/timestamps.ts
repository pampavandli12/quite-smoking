const MIN_VALID_TIMESTAMP_MS = Date.UTC(2000, 0, 1);

// Reads epoch-ms numbers and legacy string timestamps ("2024-05-01 10:00:00"
// is stored as UTC, matching the SQL normalization in db/queries.ts).
export function toEpochMs(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= MIN_VALID_TIMESTAMP_MS ? value : null;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= MIN_VALID_TIMESTAMP_MS) return numeric;
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(value)
    ? value
    : `${value.trim().replace(' ', 'T')}Z`;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) && parsed >= MIN_VALID_TIMESTAMP_MS ? parsed : null;
}
