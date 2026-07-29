export type MutationResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: unknown };

export type AccessTier = 'free' | 'legacy' | 'premium';

export type FeatureAccess = {
  tier: AccessTier;
  canViewFullExistingStats: boolean;
  canUseUnlimitedRescue: boolean;
  canViewAdvancedInsights: boolean;
  canExportReports: boolean;
};

export type CravingOutcome = 'resisted' | 'delayed' | 'smoked' | 'abandoned';
export type CopingStrategy =
  | 'breathing'
  | 'walk'
  | 'water'
  | 'distraction'
  | 'urge_surfing'
  | 'custom';

export type QuitPlanMode = 'quit_date' | 'gradual_reduction';
export type QuitPlanStatus = 'active' | 'paused' | 'completed' | 'archived';
