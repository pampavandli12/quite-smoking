import type { CopingStrategy } from '@/services/types';

export const STRATEGY_LABELS: Record<CopingStrategy, string> = {
  breathing: 'Slow breathing',
  walk: 'Take a short walk',
  water: 'Drink water',
  distraction: 'Quick distraction',
  urge_surfing: 'Ride the urge',
  custom: 'My own strategy',
};

export function strategyLabel(value: string) {
  return value in STRATEGY_LABELS
    ? STRATEGY_LABELS[value as CopingStrategy]
    : value.replace(/_/g, ' ');
}
