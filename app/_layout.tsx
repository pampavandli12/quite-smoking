import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  useFonts,
} from "@expo-google-fonts/roboto";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { initializeDatabase } from "../db/client";
import PurchaseService from "../services/purchases";
import { darkTheme, lightTheme } from "./theme";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState(
    colorScheme === "dark" ? darkTheme : lightTheme
  );
  const [dbInitialized, setDbInitialized] = useState(false);
  const [purchasesInitialized, setPurchasesInitialized] = useState(false);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  useEffect(() => {
    async function setupDatabase() {
      const success = await initializeDatabase();
      setDbInitialized(success);
    }
    setupDatabase();
  }, []);

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
    if (fontsLoaded && dbInitialized && purchasesInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbInitialized, purchasesInitialized]);

  useEffect(() => {
    setTheme(colorScheme === "dark" ? darkTheme : lightTheme);
  }, [colorScheme]);

  if (!fontsLoaded || !dbInitialized || !purchasesInitialized) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PaperProvider>
  );
}
