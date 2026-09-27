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

export type TriggerFocus = { trigger: string; strategy: string };

export type WeekFocus = {
  focusTrigger: string | null;
  focusStrategy: string | null;
};

// Rotates the user's most common triggers across plan weeks. With no trigger
// history every week stays unfocused, matching plans created before this.
export function buildWeekFocus(
  weekCount: number,
  focuses: TriggerFocus[],
): WeekFocus[] {
  return Array.from({ length: weekCount }, (_, index) => {
    const focus = focuses.length ? focuses[index % focuses.length] : null;
    return {
      focusTrigger: focus?.trigger ?? null,
      focusStrategy: focus?.strategy ?? null,
    };
  });
}
