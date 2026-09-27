const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type HealthMilestone = {
  id: string;
  afterMs: number;
  label: string;
  title: string;
  description: string;
};

// General public-health information (WHO, NHS, CDC). Shown with a
// "not medical advice" disclaimer. Ids are stable because notifications and
// "seen" flags may reference them.
export const HEALTH_MILESTONES: HealthMilestone[] = [
  {
    id: '20m',
    afterMs: 20 * MINUTE,
    label: '20 minutes',
    title: 'Heart rate settles',
    description: 'Your heart rate and blood pressure begin to drop.',
  },
  {
    id: '8h',
    afterMs: 8 * HOUR,
    label: '8 hours',
    title: 'Oxygen recovers',
    description: 'Carbon monoxide levels fall and oxygen levels return toward normal.',
  },
  {
    id: '48h',
    afterMs: 48 * HOUR,
    label: '2 days',
    title: 'Taste and smell return',
    description: 'Nicotine has left your body and your senses start to sharpen.',
  },
  {
    id: '72h',
    afterMs: 72 * HOUR,
    label: '3 days',
    title: 'Easier breathing',
    description: 'Airways relax and many people notice more energy.',
  },
  {
    id: '2w',
    afterMs: 14 * DAY,
    label: '2 weeks',
    title: 'Circulation improves',
    description: 'Blood flow improves, making walking and exercise easier.',
  },
  {
    id: '1mo',
    afterMs: 30 * DAY,
    label: '1 month',
    title: 'Lungs start to clear',
    description: 'Coughing and shortness of breath begin to decrease.',
  },
  {
    id: '3mo',
    afterMs: 90 * DAY,
    label: '3 months',
    title: 'Lung function rises',
    description: 'Lung function can improve noticeably over the first months.',
  },
  {
    id: '1y',
    afterMs: 365 * DAY,
    label: '1 year',
    title: 'Heart risk halved',
    description: 'Your added risk of coronary heart disease is about half that of a smoker.',
  },
  {
    id: '5y',
    afterMs: 5 * 365 * DAY,
    label: '5 years',
    title: 'Stroke risk falls',
    description: 'Stroke risk moves closer to that of a non-smoker.',
  },
  {
    id: '10y',
    afterMs: 10 * 365 * DAY,
    label: '10 years',
    title: 'Lung cancer risk halved',
    description: 'Your risk of dying from lung cancer is about half that of a smoker.',
  },
];

export type HealthProgress = {
  elapsedMs: number;
  achieved: HealthMilestone[];
  next: HealthMilestone | null;
  // 0–1 progress from the previous milestone to the next one.
  progressToNext: number;
};

export function getHealthProgress(
  since: number,
  now = Date.now(),
): HealthProgress {
  const elapsedMs = Math.max(0, now - since);
  const achieved = HEALTH_MILESTONES.filter((m) => m.afterMs <= elapsedMs);
  const next = HEALTH_MILESTONES[achieved.length] ?? null;
  const previousMs = achieved[achieved.length - 1]?.afterMs ?? 0;
  const progressToNext = next
    ? Math.min(1, (elapsedMs - previousMs) / (next.afterMs - previousMs))
    : 1;
  return { elapsedMs, achieved, next, progressToNext };
}

export function formatElapsed(ms: number) {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / DAY);
  const hours = Math.floor((safe % DAY) / HOUR);
  const minutes = Math.floor((safe % HOUR) / MINUTE);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
