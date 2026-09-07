jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'standalone' },
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (keys: { android?: string }) => keys.android,
  },
}));

jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(),
  getAppUserID: jest.fn(),
  getCustomerInfo: jest.fn(),
  getOfferings: jest.fn(),
  LOG_LEVEL: { DEBUG: 'DEBUG' },
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(),
  setLogLevel: jest.fn(),
}));

import Purchases from 'react-native-purchases';
import PurchaseService, {
  hasActivePremiumEntitlement,
  REVENUECAT_ENTITLEMENT_ID,
} from '../purchases';

const mockGetCustomerInfo = Purchases.getCustomerInfo as jest.Mock;
const mockGetOfferings = Purchases.getOfferings as jest.Mock;
const mockPurchasePackage = Purchases.purchasePackage as jest.Mock;
const mockRestorePurchases = Purchases.restorePurchases as jest.Mock;

const activeCustomerInfo = {
  entitlements: {
    active: {
      [REVENUECAT_ENTITLEMENT_ID]: { isActive: true },
    },
  },
};

describe('purchase service contracts', () => {
  let errorLog: jest.SpiedFunction<typeof console.error>;

  beforeAll(async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY =
      'goog_release_contract_test';
    await PurchaseService.initialize();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorLog.mockRestore();
  });

  test('keeps the configured entitlement check', async () => {
    mockGetCustomerInfo.mockResolvedValue(activeCustomerInfo);

    await expect(PurchaseService.checkSubscriptionStatus()).resolves.toBe(true);
    expect(mockGetCustomerInfo).toHaveBeenCalledTimes(1);
  });

  test('requires the configured entitlement to be active', () => {
    expect(hasActivePremiumEntitlement(activeCustomerInfo as never)).toBe(true);
    expect(
      hasActivePremiumEntitlement({
        entitlements: {
          active: {
            [REVENUECAT_ENTITLEMENT_ID]: { isActive: false },
          },
        },
      } as never),
    ).toBe(false);
  });

  test('returns the current offering and null when none exists', async () => {
    const offering = { identifier: 'current' };
    mockGetOfferings
      .mockResolvedValueOnce({ current: offering })
      .mockResolvedValueOnce({ current: null });

    await expect(PurchaseService.getOfferings()).resolves.toBe(offering);
    await expect(PurchaseService.getOfferings()).resolves.toBeNull();
  });

  test('preserves purchase success, cancellation, and failure results', async () => {
    const customerInfo = { entitlements: { active: {} } };
    const cancellation = { userCancelled: true };
    const failure = new Error('purchase failed');
    mockPurchasePackage
      .mockResolvedValueOnce({ customerInfo })
      .mockRejectedValueOnce(cancellation)
      .mockRejectedValueOnce(failure);

    await expect(
      PurchaseService.purchasePackage({} as never),
    ).resolves.toEqual({ success: true, customerInfo });
    await expect(
      PurchaseService.purchasePackage({} as never),
    ).resolves.toEqual({ success: false, error: cancellation });
    expect(errorLog).not.toHaveBeenCalled();
    await expect(
      PurchaseService.purchasePackage({} as never),
    ).resolves.toEqual({ success: false, error: failure });
    expect(errorLog).toHaveBeenCalledWith('Purchase error:', failure);
  });

  test('preserves restore success and failure results', async () => {
    const customerInfo = { entitlements: { active: {} } };
    const failure = new Error('restore failed');
    mockRestorePurchases
      .mockResolvedValueOnce(customerInfo)
      .mockRejectedValueOnce(failure);

    await expect(PurchaseService.restorePurchases()).resolves.toEqual({
      success: true,
      customerInfo,
    });
    await expect(PurchaseService.restorePurchases()).resolves.toEqual({
      success: false,
      error: failure,
    });
  });

  test('fails closed without a configured key and keeps purchases disabled', async () => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

    await PurchaseService.initialize();

    expect(PurchaseService.getAvailability()).toEqual({
      available: false,
      reason:
        'Subscriptions are temporarily unavailable. The free app remains available.',
    });
    await expect(
      PurchaseService.purchasePackage({} as never),
    ).resolves.toMatchObject({ success: false });
    expect(Purchases.configure).not.toHaveBeenCalled();

    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY =
      'goog_release_contract_test';
    await PurchaseService.initialize();
  });
});
