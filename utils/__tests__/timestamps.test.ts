import { toEpochMs } from '@/utils/timestamps';

describe('toEpochMs', () => {
  it('keeps epoch milliseconds', () => {
    expect(toEpochMs(1_700_000_000_000)).toBe(1_700_000_000_000);
    expect(toEpochMs('1700000000000')).toBe(1_700_000_000_000);
  });

  it('reads legacy SQLite datetime strings as UTC', () => {
    expect(toEpochMs('2024-05-01 10:00:00')).toBe(Date.UTC(2024, 4, 1, 10));
  });

  it('rejects missing and invalid values', () => {
    expect(toEpochMs(null)).toBeNull();
    expect(toEpochMs('not a date')).toBeNull();
    expect(toEpochMs(0)).toBeNull();
  });
});
