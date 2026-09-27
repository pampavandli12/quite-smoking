import {
  dailyCheckInIdsToCancel,
  DAILY_CHECK_IN_ID,
  idsWithPrefix,
  MILESTONE_ID_PREFIX,
  upcomingMilestoneNotifications,
  upcomingPlanWeekNotifications,
} from '@/utils/notificationSchedule';

const HOUR = 3_600_000;

describe('daily check-in cancellation', () => {
  it('cancels the new id and legacy random ids, but not other kinds', () => {
    expect(
      dailyCheckInIdsToCancel([
        DAILY_CHECK_IN_ID,
        '6f1c-legacy-uuid',
        'milestone-72h',
        'plan-week-2',
      ]),
    ).toEqual([DAILY_CHECK_IN_ID, '6f1c-legacy-uuid']);
  });

  it('selects ids by prefix', () => {
    expect(idsWithPrefix(['milestone-1y', 'plan-week-1'], MILESTONE_ID_PREFIX)).toEqual([
      'milestone-1y',
    ]);
  });
});

describe('milestone notifications', () => {
  it('skips short milestones and past milestones', () => {
    const planned = upcomingMilestoneNotifications(0, 50 * HOUR);
    expect(planned.map((item) => item.identifier)).toEqual([
      'milestone-72h',
      'milestone-2w',
      'milestone-1mo',
    ]);
    expect(planned[0].date).toBe(72 * HOUR);
  });

  it('returns nothing once every milestone has passed', () => {
    expect(upcomingMilestoneNotifications(0, 20 * 365 * 24 * HOUR)).toEqual([]);
  });
});

describe('plan week notifications', () => {
  const weeks = [
    { weekIndex: 0, startsAt: 0, targetCigarettesPerDay: 10 },
    { weekIndex: 1, startsAt: 100 * HOUR, targetCigarettesPerDay: 7 },
    { weekIndex: 2, startsAt: 200 * HOUR, targetCigarettesPerDay: 0 },
    { weekIndex: 3, startsAt: 300 * HOUR, targetCigarettesPerDay: 0 },
  ];

  it('schedules the next upcoming weeks only', () => {
    const planned = upcomingPlanWeekNotifications(weeks, 150 * HOUR);
    expect(planned.map((item) => item.identifier)).toEqual([
      'plan-week-2',
      'plan-week-3',
    ]);
    expect(planned[0].body).toContain('smoke-free');
  });

  it('includes the new target in the message', () => {
    expect(upcomingPlanWeekNotifications(weeks, 0)[0].body).toContain('7');
  });
});
