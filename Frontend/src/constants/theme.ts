/**
 * Design tokens for the app.
 *
 * Every semantic colour name exists in BOTH palettes — `ThemeColor` is derived
 * from that guarantee, so a view can ask for `type="secondary"` and get the
 * right value in light and dark without branching.
 *
 * Lookup flow:
 *   device theme (useColorScheme)
 *     → 'light' | 'dark'            (src/hooks/use-theme.ts)
 *     → Colors[scheme]              (this file)
 *
 * Web mirror: src/global.css exposes the same values as CSS variables and
 * switches on `prefers-color-scheme`. Keep the two in sync.
 *
 *   light → white page, black text, periwinkle secondary (#D9E1F8)
 *   dark  → black page, white text, graphite secondary (#262626)
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    /** Page background. */
    background: '#FFFFFF',
    /**
     * Raised surfaces (the floating tab bar) and, everywhere else, the outline
     * colour of component panels and inputs.
     */
    secondary: '#D9E1F8',
    /** Primary copy. */
    text: '#000000',
    /** Captions, hints, metadata. */
    textSecondary: '#4A5A6A',
    /** Hairlines and dividers. */
    border: 'rgba(0, 0, 0, 0.10)',
    /** Brand blue used for interactive emphasis. */
    accent: '#007BFF',
  },
  dark: {
    background: '#000000',
    secondary: '#262626',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.72)',
    border: 'rgba(255, 255, 255, 0.18)',
    accent: '#00254C',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

/**
 * Card-layout rule: every card screen keeps its cards close to the screen
 * edges on phones — one `Spacing.two` gutter on the sides and above the first
 * card, one `Spacing.two` gap between cards, and a bottom inset that clears the
 * floating tab bar.
 *
 * Exceptions: the tab bar itself and the map's floating search field.
 */
export const CardLayout = {
  /** Side gutters and the space above the first card. */
  gutter: Spacing.two,
  /** Vertical space between cards. */
  gap: Spacing.two,
  /** Clears the 60px tab pill that floats 20px above the bottom edge. */
  bottomInset: Spacing.six + Spacing.four,
} as const;

/**
 * Component-surface rule: panels, cards and inputs are filled with the page
 * colour (`background`) and outlined with `secondary`. The floating tab bar is
 * the exception — it keeps the `secondary` fill.
 */
export const StrokeWidth = 1;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
