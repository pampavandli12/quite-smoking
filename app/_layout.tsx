import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  useFonts,
} from "@expo-google-fonts/roboto";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { Button, PaperProvider, Text } from "react-native-paper";
import { AppSymbol, appSymbolSource } from "../components/AppSymbol";
import { initializeDatabase } from "../db/client";
import PurchaseService from "../services/purchases";
import { darkTheme, lightTheme } from "./theme";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

type DatabaseStatus = "loading" | "ready" | "failed";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;
  const [databaseStatus, setDatabaseStatus] =
    useState<DatabaseStatus>("loading");
  const [purchasesInitialized, setPurchasesInitialized] = useState(false);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  const setupDatabase = useCallback(async () => {
    setDatabaseStatus("loading");

    try {
      const success = await initializeDatabase();

      if (success) {
        setDatabaseStatus("ready");
        return;
      }

      console.error("Database initialization returned false.");
      setDatabaseStatus("failed");
    } catch (error) {
      console.error("Unexpected database initialization error:", error);
      setDatabaseStatus("failed");
    }
  }, []);

  useEffect(() => {
    setupDatabase();
  }, [setupDatabase]);

  useEffect(() => {
    async function setupPurchases() {
      try {
        await PurchaseService.initialize();
        setPurchasesInitialized(true);
      } catch (error) {
        console.error("Failed to initialize purchases:", error);
        // Still allow app to continue even if purchases fail
        setPurchasesInitialized(true);
      }
    }
    setupPurchases();
  }, []);

  useEffect(() => {
    if (
      fontsLoaded &&
      databaseStatus !== "loading" &&
      purchasesInitialized
    ) {
      SplashScreen.hideAsync();
    }
  }, [databaseStatus, fontsLoaded, purchasesInitialized]);

  if (!fontsLoaded || databaseStatus === "loading" || !purchasesInitialized) {
    return (
      <PaperProvider theme={theme}>
        <View
          style={[
            styles.startupContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View
            style={[
              styles.startupIcon,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <AppSymbol name="leaf" size={42} color={theme.colors.primary} />
          </View>
          <Text
            variant="headlineSmall"
            style={[styles.startupTitle, { color: theme.colors.onBackground }]}
          >
            Quit Smoking
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Preparing your private space…
          </Text>
        </View>
      </PaperProvider>
    );
  }

  if (databaseStatus === "failed") {
    return (
      <PaperProvider theme={theme}>
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <AppSymbol
            name="database-alert"
            size={48}
            color={theme.colors.error}
          />
          <Text
            variant="headlineSmall"
            style={[styles.errorTitle, { color: theme.colors.onBackground }]}
          >
            We couldn&apos;t start the app
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.errorMessage,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Your data is safe, but the app could not open its local database.
            Please try again.
          </Text>
          <Button
            mode="contained"
            icon={appSymbolSource("refresh")}
            onPress={setupDatabase}
            style={styles.retryButton}
          >
            Try again
          </Button>
          <Text
            variant="bodySmall"
            style={[
              styles.recoveryText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            If this keeps happening, close and reopen the app.
          </Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="history" />
      </Stack>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  startupContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  startupIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 76,
    justifyContent: "center",
    width: 76,
  },
  startupTitle: {
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 18,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    marginTop: 20,
    textAlign: "center",
  },
  errorMessage: {
    marginTop: 12,
    maxWidth: 360,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
  },
  recoveryText: {
    marginTop: 16,
    maxWidth: 320,
    textAlign: "center",
  },
});
