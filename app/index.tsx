import { router } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import {
  Button,
  Divider,
  Icon,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SubscriptionPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleSubscribe = () => {
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
          £9.99/month
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
      >
        Start 7-Day Free Trial
      </Button>

      {/* Restore Purchase Button */}
      <Button
        mode="text"
        style={styles.restoreButton}
        textColor={theme.colors.secondary}
        onPress={() => {}}
      >
        Restore Purchase
      </Button>

      {/* Terms */}
      <Text variant="bodySmall" style={styles.terms}>
        By continuing, you agree to our Terms of Service and Privacy Policy
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
    marginBottom: 16,
  },
  terms: {
    textAlign: "center",
    opacity: 0.6,
    paddingHorizontal: 20,
  },
});
