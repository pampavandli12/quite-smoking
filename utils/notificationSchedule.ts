import { HEALTH_MILESTONES } from '@/utils/healthMilestones';

export const DAILY_CHECK_IN_ID = 'daily-check-in';
export const MILESTONE_ID_PREFIX = 'milestone-';
export const PLAN_WEEK_ID_PREFIX = 'plan-week-';

// Milestones sooner than this are skipped so heavy smokers are not notified
// after every cigarette.
export const MIN_NOTIFIED_MILESTONE_MS = 48 * 3_600_000;
const MIN_LEAD_MS = 60_000;

export type PlannedNotification = {
  identifier: string;
  date: number;
  title: string;
  body: string;
};

function isOwnIdentifier(identifier: string) {
  return (
    identifier === DAILY_CHECK_IN_ID ||
    identifier.startsWith(MILESTONE_ID_PREFIX) ||
    identifier.startsWith(PLAN_WEEK_ID_PREFIX)
  );
}

// Before identifiers existed, the daily check-in was the only scheduled
// notification and had a random id, so any unknown id is treated as one.
export function dailyCheckInIdsToCancel(identifiers: string[]) {
  return identifiers.filter(
    (identifier) => identifier === DAILY_CHECK_IN_ID || !isOwnIdentifier(identifier),
  );
}

export function idsWithPrefix(identifiers: string[], prefix: string) {
  return identifiers.filter((identifier) => identifier.startsWith(prefix));
}

export function upcomingMilestoneNotifications(
  since: number,
  now = Date.now(),
  limit = 3,
): PlannedNotification[] {
  return HEALTH_MILESTONES.filter(
    (milestone) =>
      milestone.afterMs >= MIN_NOTIFIED_MILESTONE_MS &&
      since + milestone.afterMs > now + MIN_LEAD_MS,
  )
    .slice(0, limit)
    .map((milestone) => ({
      identifier: `${MILESTONE_ID_PREFIX}${milestone.id}`,
      date: since + milestone.afterMs,
      title: `${milestone.label} smoke-free`,
      body: `${milestone.title}. ${milestone.description}`,
    }));
}

export function upcomingPlanWeekNotifications(
  weeks: { weekIndex: number; startsAt: number; targetCigarettesPerDay: number }[],
  now = Date.now(),
  limit = 2,
): PlannedNotification[] {
  return weeks
    .filter((week) => week.weekIndex > 0 && week.startsAt > now + MIN_LEAD_MS)
    .sort((a, b) => a.startsAt - b.startsAt)
    .slice(0, limit)
    .map((week) => ({
      identifier: `${PLAN_WEEK_ID_PREFIX}${week.weekIndex}`,
      date: week.startsAt,
      title: `Week ${week.weekIndex + 1} of your plan starts now`,
      body:
        week.targetCigarettesPerDay === 0
          ? 'Your target this week is smoke-free. You have prepared for this.'
          : `Your new daily target is ${week.targetCigarettesPerDay}. One choice at a time.`,
    }));
}
