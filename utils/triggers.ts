// Stored trigger values shared by logging and Rescue. Values are persisted in
// smoking_log_triggers and craving_session, so never rename existing entries.
export const RESCUE_TRIGGERS = [
  'stress',
  'coffee',
  'boredom',
  'after meals',
  'anxiety',
  'social situations',
  'alcohol',
  'habit',
] as const;

export const MAX_CRAVING_NOTE_LENGTH = 280;

export function normalizeCravingNote(note?: string | null) {
  const trimmed = note?.trim() ?? '';
  return trimmed ? trimmed.slice(0, MAX_CRAVING_NOTE_LENGTH) : null;
}
