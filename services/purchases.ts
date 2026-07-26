import { REVENUE_CAT_KEYS } from '@/utils/constants';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import {
  getErrorMessage,
  isUserCancelledPurchaseError,
} from '@/utils/purchaseErrors';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// RevenueCat API Keys
// For Expo Go testing, use the Test Store API key from https://rev.cat/sdk-test-store
const REVENUECAT_API_KEY = Platform.select({
  ios: REVENUE_CAT_KEYS.ios,
  android: REVENUE_CAT_KEYS.android,
});

export const REVENUECAT_ENTITLEMENT_ID = 'QuitSmoke Pro';

export type PurchaseOperationResult = {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: unknown;
};

class PurchaseService {
  private static instance: PurchaseService;
  private isConfigured = false;
  private mockMode = false;

  private constructor() {}

  static getInstance(): PurchaseService {
    if (!PurchaseService.instance) {
      PurchaseService.instance = new PurchaseService();
    }
    return PurchaseService.instance;
  }

  /**
   * Initialize RevenueCat SDK
   * Call this when app starts
   */
  async initialize(userId?: string): Promise<void> {
    // If running in Expo Go without proper keys, enable mock mode
    if (
      isExpoGo &&
      (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.includes('YOUR'))
    ) {
      console.warn(
        'Running in Expo Go without RevenueCat keys - using mock mode',
      );
      this.mockMode = true;
      this.isConfigured = true;
      return;
    }

    if (!REVENUECAT_API_KEY) {
      console.warn('RevenueCat API key not configured - using mock mode');
      this.mockMode = true;
      this.isConfigured = true;
      return;
    }

    try {
      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId,
      });

      // Enable debug mode in development
      if (__DEV__) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }

      this.isConfigured = true;
      if (__DEV__) {
        console.log('RevenueCat initialized successfully');
      }
    } catch (error: unknown) {
      console.error('Failed to initialize RevenueCat:', error);
      // If initialization fails, fall back to mock mode
      const errorMessage = getErrorMessage(error);
      if (
        errorMessage.includes('Expo Go') ||
        errorMessage.includes('native store')
      ) {
        console.warn('Falling back to mock mode for Expo Go');
        this.mockMode = true;
        this.isConfigured = true;
      }
    }
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    if (this.mockMode) {
      console.log('Mock mode: Returning mock offering');
      return null; // Return null in mock mode
    }

    if (!this.isConfigured) {
      console.warn('Purchases not configured');
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return offerings.current;
      }
      return null;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return null;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(
    packageToPurchase: PurchasesPackage,
  ): Promise<PurchaseOperationResult> {
    if (this.mockMode) {
      console.log('Mock mode: Simulating successful purchase');
      // Simulate successful purchase in mock mode
      return { success: true, customerInfo: {} as CustomerInfo };
    }

    if (!this.isConfigured) {
      return {
        success: false,
        error: { message: 'Purchases not configured' },
      };
    }

    try {
      const { customerInfo } =
        await Purchases.purchasePackage(packageToPurchase);
      return { success: true, customerInfo };
    } catch (error: unknown) {
      if (!isUserCancelledPurchaseError(error)) {
        console.error('Purchase error:', error);
      }
      return { success: false, error };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseOperationResult> {
    if (this.mockMode) {
      console.log('Mock mode: No purchases to restore');
      return {
        success: true,
        customerInfo: {} as CustomerInfo,
      };
    }

    if (!this.isConfigured) {
      return {
        success: false,
        error: { message: 'Purchases not configured' },
      };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return { success: true, customerInfo };
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, error };
    }
  }

  /**
   * Check if user has active subscription
   */
  async checkSubscriptionStatus(): Promise<boolean> {
    if (this.mockMode) {
      console.log('Mock mode: Returning false for subscription status');
      return false; // No subscription in mock mode
    }

    if (!this.isConfigured) {
      return false;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return (
        typeof customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !==
        'undefined'
      );
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Get customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (this.mockMode || !this.isConfigured) {
      return null;
    }

    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }

  /**
   * Login user (optional - for cross-platform subscription access)
   */
  async login(userId: string): Promise<void> {
    if (this.mockMode || !this.isConfigured) {
      return;
    }

    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    if (this.mockMode || !this.isConfigured) {
      return;
    }

    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  /**
   * Check if running in mock mode
   */
  isMockMode(): boolean {
    return this.mockMode;
  }
}

export default PurchaseService.getInstance();
