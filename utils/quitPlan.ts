export type PlanWeekTarget = {
  startsAt: number;
};

export function getEffectivePlanWeek<T extends PlanWeekTarget>(
  weeks: T[],
  now = Date.now(),
): T | undefined {
  return (
    [...weeks]
      .reverse()
      .find((week) => week.startsAt <= now) ?? weeks[0]
  );
}
