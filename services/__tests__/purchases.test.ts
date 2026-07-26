jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'standalone' },
}));

jest.mock('react-native', () => ({
  Platform: {
    select: (keys: { android?: string }) => keys.android,
  },
}));

jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  getCustomerInfo: jest.fn(),
  getOfferings: jest.fn(),
  LOG_LEVEL: { DEBUG: 'DEBUG' },
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  setLogLevel: jest.fn(),
}));

import Purchases from 'react-native-purchases';
import PurchaseService, {
  REVENUECAT_ENTITLEMENT_ID,
} from '../purchases';

const mockGetCustomerInfo = Purchases.getCustomerInfo as jest.Mock;
const mockGetOfferings = Purchases.getOfferings as jest.Mock;
const mockPurchasePackage = Purchases.purchasePackage as jest.Mock;
const mockRestorePurchases = Purchases.restorePurchases as jest.Mock;

const activeCustomerInfo = {
  entitlements: {
    active: {
      [REVENUECAT_ENTITLEMENT_ID]: {},
    },
  },
};

describe('purchase service contracts', () => {
  let errorLog: jest.SpiedFunction<typeof console.error>;

  beforeAll(async () => {
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
});
