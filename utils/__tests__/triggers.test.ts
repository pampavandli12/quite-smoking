import {
  MAX_CRAVING_NOTE_LENGTH,
  normalizeCravingNote,
  RESCUE_TRIGGERS,
} from '@/utils/triggers';

describe('rescue triggers', () => {
  it('keeps the original Rescue triggers first and in order', () => {
    expect(RESCUE_TRIGGERS.slice(0, 5)).toEqual([
      'stress',
      'coffee',
      'boredom',
      'after meals',
      'anxiety',
    ]);
  });

  it('includes the triggers offered when logging a cigarette', () => {
    expect(RESCUE_TRIGGERS).toEqual(
      expect.arrayContaining(['social situations', 'alcohol', 'habit']),
    );
  });
});

describe('craving note normalization', () => {
  it('treats empty input as no note', () => {
    expect(normalizeCravingNote(undefined)).toBeNull();
    expect(normalizeCravingNote('   ')).toBeNull();
  });

  it('trims and caps the note length', () => {
    expect(normalizeCravingNote('  walked it off ')).toBe('walked it off');
    expect(normalizeCravingNote('x'.repeat(400))).toHaveLength(
      MAX_CRAVING_NOTE_LENGTH,
    );
  });
});
