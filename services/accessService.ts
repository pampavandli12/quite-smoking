import { dbGetFirstAsync } from '@/db/client';
import PurchaseService from '@/services/purchases';
import type { AccessTier, FeatureAccess } from '@/services/types';

function buildAccess(tier: AccessTier): FeatureAccess {
  const premium = tier === 'premium';
  const established = tier === 'legacy' || premium;
  return {
    tier,
    canViewFullExistingStats: established,
    canUseUnlimitedRescue: premium,
    canViewAdvancedInsights: premium,
    canExportReports: premium,
  };
}

export async function resolveFeatureAccess(): Promise<FeatureAccess> {
  if (await PurchaseService.checkSubscriptionStatus()) {
    return buildAccess('premium');
  }
  const legacy = await dbGetFirstAsync<{ value: string }>(
    `SELECT value FROM app_metadata WHERE key = 'legacy_access'`,
  );
  return buildAccess(legacy?.value === 'true' ? 'legacy' : 'free');
}
