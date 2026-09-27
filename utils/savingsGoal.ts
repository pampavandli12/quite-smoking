export const MAX_GOAL_TITLE_LENGTH = 60;

export type SavingsGoalInput = { title: string; targetAmountCents: number };

export function validateSavingsGoal(input: SavingsGoalInput) {
  const title = input.title.trim();
  if (!title) return 'Give your goal a name.';
  if (title.length > MAX_GOAL_TITLE_LENGTH) {
    return `Keep the name under ${MAX_GOAL_TITLE_LENGTH} characters.`;
  }
  if (!Number.isInteger(input.targetAmountCents) || input.targetAmountCents <= 0) {
    return 'Enter an amount greater than zero.';
  }
  return null;
}

export function getGoalProgress(savedCents: number, targetCents: number) {
  if (targetCents <= 0) return 0;
  return Math.min(1, Math.max(0, savedCents / targetCents));
}
