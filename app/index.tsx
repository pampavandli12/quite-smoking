import PurchaseService from "@/services/purchases";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import {
  Button,
  Divider,
  Icon,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import type { PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SubscriptionPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [subscriptionPackage, setSubscriptionPackage] =
    useState<PurchasesPackage | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    checkSubscription();
    loadOfferings();
  }, []);

  const checkSubscription = async () => {
    const isActive = await PurchaseService.checkSubscriptionStatus();
    setHasActiveSubscription(isActive);
    if (isActive) {
      // User already has subscription, navigate to home
      router.replace("/(tabs)/home");
    }
  };

  const loadOfferings = async () => {
    try {
      const offering = await PurchaseService.getOfferings();
      if (offering && offering.availablePackages.length > 0) {
        // Get monthly package or first available package
        const monthlyPackage =
          offering.monthly || offering.availablePackages[0];
        setSubscriptionPackage(monthlyPackage);
      }
    } catch (error) {
      console.error("Error loading offerings:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!subscriptionPackage) {
      Alert.alert(
        "Not Available",
        "Subscription packages are not available at the moment. Please try again later."
      );
      return;
    }

    setLoading(true);
    try {
      const { success, customerInfo, error } =
        await PurchaseService.purchasePackage(subscriptionPackage);

      if (success && customerInfo) {
        Alert.alert("Success!", "Welcome to Premium! 🎉", [
          {
            text: "Continue",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]);
      } else if (error && !error.userCancelled) {
        Alert.alert(
          "Purchase Failed",
          "Something went wrong. Please try again."
        );
      }
    } catch (error) {
      console.error("Purchase error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const { success, customerInfo } =
        await PurchaseService.restorePurchases();

      if (success && customerInfo) {
        // Check if we're in mock mode
        const isMock = PurchaseService.isMockMode();

        if (isMock) {
          // In mock mode, just show a message
          Alert.alert(
            "Mock Mode",
            "Running in development mode. No purchases to restore."
          );
        } else {
          const hasEntitlement =
            typeof customerInfo.entitlements?.active?.["premium"] !==
            "undefined";

          if (hasEntitlement) {
            Alert.alert("Success!", "Your purchase has been restored! 🎉", [
              {
                text: "Continue",
                onPress: () => router.replace("/(tabs)/home"),
              },
            ]);
          } else {
            Alert.alert(
              "No Purchases Found",
              "We couldn't find any previous purchases to restore."
            );
          }
        }
      }
    } catch (error) {
      console.error("Restore error:", error);
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow user to skip subscription for now
    router.replace("/(tabs)/home");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
      ]}
    >
      {/* Header Image */}
      <Surface style={styles.headerImageContainer} elevation={0}>
        <Surface
          style={[
            styles.headerImagePlaceholder,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Icon source="account-group" size={60} color={theme.colors.primary} />
        </Surface>
      </Surface>

      {/* Title Section */}
      <Surface style={styles.titleSection} elevation={0}>
        <Text variant="headlineMedium" style={styles.title}>
          Try Premium Free for 7 Days
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Cancel anytime, no commitment
        </Text>
      </Surface>

      <Divider style={styles.divider} />

      {/* What You'll Get Section */}
      <Surface style={styles.section} elevation={0}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          What You'll Get
        </Text>

        <Surface style={styles.featureItem} elevation={0}>
          <Icon source="check-circle" size={24} color="#4CAF50" />
          <Surface style={styles.featureTextContainer} elevation={0}>
            <Text variant="bodyLarge" style={styles.featureTitle}>
              Unlimited Access
            </Text>
            <Text variant="bodyMedium" style={styles.featureDescription}>
              Access all premium features and content
            </Text>
          </Surface>
        </Surface>

        <Surface style={styles.featureItem} elevation={0}>
          <Icon source="check-circle" size={24} color="#4CAF50" />
          <Surface style={styles.featureTextContainer} elevation={0}>
            <Text variant="bodyLarge" style={styles.featureTitle}>
              Ad-Free Experience
            </Text>
            <Text variant="bodyMedium" style={styles.featureDescription}>
              Enjoy uninterrupted usage without ads
            </Text>
          </Surface>
        </Surface>

        <Surface style={styles.featureItem} elevation={0}>
          <Icon source="check-circle" size={24} color="#4CAF50" />
          <Surface style={styles.featureTextContainer} elevation={0}>
            <Text variant="bodyLarge" style={styles.featureTitle}>
              Priority Support
            </Text>
            <Text variant="bodyMedium" style={styles.featureDescription}>
              Get help from our dedicated support team
            </Text>
          </Surface>
        </Surface>

        <Surface style={styles.featureItem} elevation={0}>
          <Icon source="check-circle" size={24} color="#4CAF50" />
          <Surface style={styles.featureTextContainer} elevation={0}>
            <Text variant="bodyLarge" style={styles.featureTitle}>
              Offline Downloads
            </Text>
            <Text variant="bodyMedium" style={styles.featureDescription}>
              Download content for offline viewing
            </Text>
          </Surface>
        </Surface>
      </Surface>

      <Divider style={styles.divider} />

      {/* Pricing Section */}
      <Surface style={styles.pricingSection} elevation={0}>
        <Text variant="displaySmall" style={styles.price}>
          $1.20/month
        </Text>
        <Text variant="bodyMedium" style={styles.priceSubtext}>
          after 7-day free trial
        </Text>
        <Text variant="bodyMedium" style={styles.savings}>
          Save 50% vs monthly
        </Text>
      </Surface>

      {/* Benefits List */}
      <Surface
        style={[
          styles.benefitsCard,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
        elevation={0}
      >
        <Surface style={styles.benefitRow} elevation={0}>
          <Icon source="check-circle" size={20} color="#4CAF50" />
          <Text variant="bodyMedium" style={styles.benefitText}>
            7 days completely free
          </Text>
        </Surface>
        <Surface style={styles.benefitRow} elevation={0}>
          <Icon source="check-circle" size={20} color="#4CAF50" />
          <Text variant="bodyMedium" style={styles.benefitText}>
            Cancel anytime
          </Text>
        </Surface>
        <Surface style={styles.benefitRow} elevation={0}>
          <Icon source="check-circle" size={20} color="#4CAF50" />
          <Text variant="bodyMedium" style={styles.benefitText}>
            Full access to all features
          </Text>
        </Surface>
      </Surface>

      {/* Payment Methods */}
      <Surface style={styles.paymentSection} elevation={0}>
        <Surface style={styles.paymentIcons} elevation={0}>
          <Icon source="credit-card" size={24} color={theme.colors.onSurface} />
          <Icon source="apple" size={24} color={theme.colors.onSurface} />
          <Icon source="google" size={24} color={theme.colors.onSurface} />
          <Icon source="cash" size={24} color={theme.colors.onSurface} />
        </Surface>
        <Surface style={styles.secureRow} elevation={0}>
          <Icon source="lock" size={16} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodySmall" style={styles.secureText}>
            Secure payment processing
          </Text>
        </Surface>
      </Surface>

      {/* CTA Button */}
      <Button
        mode="contained"
        style={styles.ctaButton}
        contentStyle={styles.ctaButtonContent}
        onPress={handleSubscribe}
        loading={loading}
        disabled={loading}
      >
        {loading ? "Processing..." : "Start 7-Day Free Trial"}
      </Button>

      {/* Restore Purchase Button */}
      <Button
        mode="text"
        style={styles.restoreButton}
        textColor={theme.colors.secondary}
        onPress={handleRestore}
        disabled={loading}
      >
        Restore Purchase
      </Button>

      {/* Skip Button (for testing) */}
      <Button
        mode="text"
        style={styles.skipButton}
        textColor={theme.colors.onSurfaceVariant}
        onPress={handleSkip}
        disabled={loading}
      >
        Skip for now
      </Button>

      {/* Terms */}
      <Text variant="bodySmall" style={styles.terms}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
        Subscription automatically renews unless cancelled at least 24 hours
        before the end of the trial period.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerImageContainer: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  headerImagePlaceholder: {
    width: "100%",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
  },
  divider: {
    marginVertical: 20,
  },
  section: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: "transparent",
  },
  featureTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    opacity: 0.7,
  },
  pricingSection: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  price: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  priceSubtext: {
    opacity: 0.7,
    marginBottom: 8,
  },
  savings: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  benefitsCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  benefitText: {
    marginLeft: 12,
  },
  paymentSection: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  paymentIcons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  secureText: {
    marginLeft: 6,
    opacity: 0.7,
  },
  ctaButton: {
    marginBottom: 8,
    borderRadius: 8,
  },
  ctaButtonContent: {
    paddingVertical: 8,
  },
  restoreButton: {
    marginBottom: 8,
  },
  skipButton: {
    marginBottom: 16,
  },
  terms: {
    textAlign: "center",
    opacity: 0.6,
    paddingHorizontal: 20,
  },
});
