/**
 * Theme accessors.
 *
 * The device theme is the single source of truth — there is no in-app theme
 * switch yet. Change the OS appearance and every screen re-renders, because
 * `useColorScheme` is a live subscription.
 *
 * Docs: https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type ColorScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Which palette is active right now. Never null/undefined. */
export function useThemeScheme(): ColorScheme {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

/** The active palette: `{ background, secondary, text, textSecondary, border, accent }`. */
export function useTheme() {
  return Colors[useThemeScheme()];
}
