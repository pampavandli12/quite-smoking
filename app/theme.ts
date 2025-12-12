import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const lightTheme = {
  ...MD3LightTheme,
  fonts: {
    ...MD3LightTheme.fonts,
    default: {
      fontFamily: "Roboto_400Regular",
    },
  },
  colors: {
    ...MD3LightTheme.colors,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  fonts: {
    ...MD3DarkTheme.fonts,
    default: {
      fontFamily: "Roboto_400Regular",
    },
  },
  colors: {
    ...MD3DarkTheme.colors,
  },
};
