import { Asset } from 'expo-asset';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { forwardRef, useEffect, useState, type ComponentRef } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme, useThemeScheme } from '@/hooks/use-theme';

const ICON_SIZE = 26;
const BAR_INSET = 20;
const BAR_MAX_WIDTH = 340;

/** Inactive tabs are dimmed to half opacity; the active tab is solid. */
const INACTIVE_OPACITY = 0.5;

/**
 * Floating pill. The surface and the icon ink come from the active palette
 * (light: black icons on the pale secondary blue, dark: white on deep blue),
 * so the bar follows the device theme like the rest of the app.
 */
const BAR_SHADOW = {
  light: '0 12px 28px rgba(0, 37, 76, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
  dark: '0 16px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
} as const;

/**
 * Google Material Symbols glyph names. `person_pin_circle` only exists in the
 * newer Material Symbols set (https://fonts.google.com/icons) — the Material
 * Icons font bundled with `@expo/vector-icons` has no such glyph.
 */
type SymbolName = 'dashboard' | 'person_pin_circle' | 'mail';

const SYMBOLS: SymbolName[] = ['dashboard', 'person_pin_circle', 'mail'];

/** GitHub-style identicon standing in for the signed-in profile. */
const AVATAR = require('../../assets/images/avatar-identicon.png');
/** Desaturated copy, used while the tab is inactive. */
const AVATAR_MUTED = require('../../assets/images/avatar-identicon-muted.png');

/**
 * Material Symbols draws each icon name as a ligature, so the string
 * "groups_2" renders as a single glyph. We bundle a ~2 KB subset holding just
 * the four tab icons instead of pulling the full font from a CDN.
 */
const FONT_FAMILY = 'VoxMaterialSymbols';
const FONT_STYLE_ID = 'vox-material-symbols';
const FONT_ASSET = require('../../assets/fonts/material-symbols-outlined-subset.woff2');

function useSymbolFont() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    if (!document.getElementById(FONT_STYLE_ID)) {
      const asset = Asset.fromModule(FONT_ASSET);
      const style = document.createElement('style');
      style.id = FONT_STYLE_ID;
      style.textContent = `@font-face{font-family:'${FONT_FAMILY}';src:url("${asset.localUri ?? asset.uri}") format('woff2');font-style:normal;font-weight:normal;font-display:block;}`;
      document.head.appendChild(style);
    }

    document.fonts
      .load(`${ICON_SIZE}px "${FONT_FAMILY}"`, SYMBOLS.join(' '))
      .then(() => {
        if (active) setReady(true);
      })
      .catch((error) => console.warn('Material Symbols font failed to load', error));

    return () => {
      active = false;
    };
  }, []);

  return ready;
}

type TabIconProps = Omit<PressableProps, 'children'> & {
  /** Material Symbols glyph name. */
  icon?: SymbolName;
  /** Renders the profile identicon instead of a glyph. */
  avatar?: boolean;
  /** Accessible name — the tab bar itself is icon-only. */
  label: string;
  /** Hides the glyph until the icon font finishes loading (web only). */
  ready?: boolean;
  /** Injected by `TabTrigger` via `asChild`. */
  isFocused?: boolean;
};

const TabIcon = forwardRef<ComponentRef<typeof View>, TabIconProps>(function TabIcon(
  { icon, avatar = false, label, ready = true, isFocused, style, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <Pressable
      ref={ref}
      aria-selected={isFocused}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        // `TabTrigger` injects its own row styles; ours go last so the icon is
        // centred in its cell instead of being pinned to the left edge.
        styles.tab,
        { opacity: isFocused ? 1 : INACTIVE_OPACITY },
      ]}
      {...rest}>
      {avatar ? (
        <Image
          accessibilityElementsHidden
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          source={isFocused ? AVATAR : AVATAR_MUTED}
          style={styles.avatar}
        />
      ) : (
        <Text
          accessibilityElementsHidden
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.glyph, { color: theme.text, opacity: ready ? 1 : 0 }]}>
          {icon}
        </Text>
      )}
    </Pressable>
  );
});

export default function AppTabs() {
  const fontReady = useSymbolFont();
  const theme = useTheme();
  const scheme = useThemeScheme();

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList
        style={[
          styles.tabList,
          {
            backgroundColor: theme.secondary,
            borderColor: theme.border,
            boxShadow: BAR_SHADOW[scheme],
          } as ViewStyle,
        ]}>
        <TabTrigger name="telemetry" href="/telemetry" asChild>
          <TabIcon icon="dashboard" label="Telemetry" ready={fontReady} />
        </TabTrigger>

        <TabTrigger name="community" href="/community" asChild>
          <TabIcon icon="person_pin_circle" label="Community" ready={fontReady} />
        </TabTrigger>

        <TabTrigger name="chats" href="/chats" asChild>
          <TabIcon icon="mail" label="Chats" ready={fontReady} />
        </TabTrigger>

        <TabTrigger name="settings" href="/settings" asChild>
          <TabIcon avatar label="Settings" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  slot: {
    // `TabSlot` defaults to `flexShrink: 0`, so a tall screen (like the
    // telemetry dashboard) pushes the tab bar past the bottom of the viewport.
    flexShrink: 1,
    minHeight: 0,
  },
  tabList: {
    position: 'absolute',
    bottom: BAR_INSET,
    // `left: 0` + `right: 0` + auto margins centre the pill, so the gutter on
    // each side is identical at every viewport width.
    left: 0,
    right: 0,
    width: '88%',
    maxWidth: BAR_MAX_WIDTH,
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    // Keeps the inner highlight and the glass surface inside the pill.
    overflow: 'hidden',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    // Equal share of the bar per tab = evenly spaced icons, edge to edge.
    flex: 1,
    height: 52,
    borderRadius: Radius.pill,
  },
  glyph: {
    fontFamily: FONT_FAMILY,
    fontSize: ICON_SIZE,
    lineHeight: ICON_SIZE,
    textAlign: 'center',
    // Not part of RN's TextStyle type, but react-native-web forwards it.
    fontFeatureSettings: "'liga' 1",
  } as TextStyle,
  avatar: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
  },
});
