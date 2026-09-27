import { getGoalProgress, validateSavingsGoal } from '@/utils/savingsGoal';

describe('savings goal validation', () => {
  it('accepts a named goal with a positive amount', () => {
    expect(validateSavingsGoal({ title: ' Headphones ', targetAmountCents: 500000 })).toBeNull();
  });

  it('rejects empty names and non-positive amounts', () => {
    expect(validateSavingsGoal({ title: '  ', targetAmountCents: 100 })).toBeTruthy();
    expect(validateSavingsGoal({ title: 'Trip', targetAmountCents: 0 })).toBeTruthy();
    expect(validateSavingsGoal({ title: 'Trip', targetAmountCents: 10.5 })).toBeTruthy();
  });
});

describe('goal progress', () => {
  it('clamps between 0 and 1', () => {
    expect(getGoalProgress(250, 1000)).toBe(0.25);
    expect(getGoalProgress(5000, 1000)).toBe(1);
    expect(getGoalProgress(-10, 1000)).toBe(0);
    expect(getGoalProgress(10, 0)).toBe(0);
  });
});
