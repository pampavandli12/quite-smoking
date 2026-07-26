import { groupSmokingLogsWithTriggers } from '../groupSmokingLogs';

describe('groupSmokingLogsWithTriggers', () => {
  test('preserves log and trigger order while grouping in linear time', () => {
    expect(
      groupSmokingLogsWithTriggers([
        {
          id: 2,
          timestamp: 2000,
          triggerId: 3,
          trigger: 'coffee',
        },
        {
          id: 2,
          timestamp: 2000,
          triggerId: 4,
          trigger: 'stress',
        },
        {
          id: 1,
          timestamp: '2026-07-25T10:00:00.000Z',
          triggerId: null,
          trigger: null,
        },
      ]),
    ).toEqual([
      {
        id: 2,
        timestamp: 2000,
        triggers: ['coffee', 'stress'],
      },
      {
        id: 1,
        timestamp: '2026-07-25T10:00:00.000Z',
        triggers: [],
      },
    ]);
  });
});
