export type SmokingLogWithTriggerRow = {
  id: number;
  timestamp: number | string;
  triggerId: number | null;
  trigger: string | null;
};

export type SmokingLogWithTriggers = {
  id: number;
  timestamp: number | string;
  triggers: string[];
};

export function groupSmokingLogsWithTriggers(
  rows: SmokingLogWithTriggerRow[],
): SmokingLogWithTriggers[] {
  const groupedById = new Map<number, SmokingLogWithTriggers>();

  rows.forEach((row) => {
    const existingLog = groupedById.get(row.id);

    if (existingLog) {
      if (row.trigger) {
        existingLog.triggers.push(row.trigger);
      }
      return;
    }

    groupedById.set(row.id, {
      id: row.id,
      timestamp: row.timestamp,
      triggers: row.trigger ? [row.trigger] : [],
    });
  });

  return Array.from(groupedById.values());
}
