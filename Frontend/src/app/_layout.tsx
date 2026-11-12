// Side-effect import: registers the global web stylesheet (theme CSS variables).
// React Native ignores it; native colours come from constants/theme.ts.
import '../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';

import { useTheme, useThemeScheme } from '@/hooks/use-theme';

// Keep the native splash up only until the JS bundle is ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useThemeScheme();
  const theme = useTheme();

  // Navigation owns a few surfaces of its own (screen background, header,
  // android system bars). Feed it the same tokens so there is no white flash
  // between screens in dark mode.
  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.accent,
        background: theme.background,
        card: theme.background,
        text: theme.text,
        border: theme.border,
        notification: theme.secondary,
      },
    };
  }, [scheme, theme]);

  useEffect(() => {
    // The app draws its own 3s splash screen (app/index.tsx), so hide the native one.
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={navigationTheme}>
      {/* Status bar icons follow the active palette (dark icons on white, light on navy). */}
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      />
    </ThemeProvider>
  );
}
