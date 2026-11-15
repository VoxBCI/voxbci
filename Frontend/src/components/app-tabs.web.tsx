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

const ICON_SIZE = 26;
const BAR_INSET = 20;
const BAR_MAX_WIDTH = 380;

/**
 * Floating "liquid glass" bar: a dark translucent pill with a backdrop blur,
 * a hairline rim and an inner top highlight. Those three properties are plain
 * CSS that react-native-web forwards, so the casts below are web-only.
 */
const GLASS = {
  backgroundColor: 'rgba(10, 22, 38, 0.66)',
  borderColor: 'rgba(255, 255, 255, 0.18)',
  backdropFilter: 'blur(22px) saturate(180%)',
  boxShadow:
    '0 18px 40px rgba(3, 12, 24, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.28)',
} as ViewStyle;

/**
 * Google Material Symbols glyph names. `person_pin_circle` only exists in the
 * newer Material Symbols set (https://fonts.google.com/icons) — the Material
 * Icons font bundled with `@expo/vector-icons` has no such glyph.
 */
type SymbolName = 'dashboard' | 'person_pin_circle' | 'mail';

const SYMBOLS: SymbolName[] = ['dashboard', 'person_pin_circle', 'mail'];

/** GitHub-style identicon standing in for the signed-in profile. */
const AVATAR = require('../../assets/images/avatar-identicon.png');

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
  return (
    <Pressable
      ref={ref}
      aria-selected={isFocused}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={(state) => [
        styles.tab,
        isFocused && styles.tabFocused,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {avatar ? (
        <Image
          accessibilityElementsHidden
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          source={AVATAR}
          style={styles.avatar}
        />
      ) : (
        <Text
          accessibilityElementsHidden
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.glyph,
            { color: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.62)', opacity: ready ? 1 : 0 },
          ]}>
          {icon}
        </Text>
      )}
    </Pressable>
  );
});

export default function AppTabs() {
  const fontReady = useSymbolFont();

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList style={[styles.tabList, GLASS]}>
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
    left: Spacing.four,
    right: Spacing.four,
    marginHorizontal: 'auto',
    maxWidth: BAR_MAX_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    // Keeps the inner highlight and the glass surface inside the pill.
    overflow: 'hidden',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 44,
    borderRadius: Radius.pill,
  },
  tabFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.28)',
  } as ViewStyle,
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
