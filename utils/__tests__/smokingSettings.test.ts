import {
  areSmokingSettingsValid,
  parseSmokingSettings,
} from '../smokingSettings';

describe('smoking settings input rules', () => {
  test.each([
    ['10', '15', true],
    ['1', '0.01', true],
    ['', '15', false],
    ['10', '', false],
    ['0', '15', false],
    ['10', '0', false],
  ])(
    'validates cigarettes=%s and cost=%s',
    (cigarettes, cost, expected) => {
      expect(areSmokingSettingsValid(cigarettes, cost)).toBe(expected);
    },
  );

  test('preserves the existing parseInt and parseFloat behavior', () => {
    expect(parseSmokingSettings('10abc', '12.50abc')).toEqual({
      cigarettesPerDay: 10,
      costPerCigarette: 12.5,
    });
  });
});
