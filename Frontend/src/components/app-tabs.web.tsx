import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { usePathname } from 'expo-router';
import { forwardRef, useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
  View,
} from 'react-native';

import { FloatingPill, Radius, Spacing } from '@/constants/theme';
import { SYMBOL_FONT_FAMILY, useSymbolFont, type SymbolName } from '@/hooks/use-symbol-font.web';
import { useTheme } from '@/hooks/use-theme';

const ICON_SIZE = 26;

/** Inactive tabs are dimmed to half opacity; the active tab is solid. */
const INACTIVE_OPACITY = 0.5;

/** Glyphs drawn by the tab bar (the toolbar adds `neurology` to the same subset). */
const TAB_SYMBOLS: SymbolName[] = ['airwave', 'explore_nearby', 'comic_bubble'];

/** Tab order used to determine slide direction. */
const TAB_ORDER = ['telemetry', 'community', 'chats', 'profile'] as const;

/** GitHub-style identicon standing in for the signed-in profile. */
const AVATAR = require('../../assets/images/avatar-identicon.png');
/** Desaturated copy, used while the tab is inactive. */
const AVATAR_MUTED = require('../../assets/images/avatar-identicon-muted.png');

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

function tabIndexFromPathname(pathname: string) {
  const segment = pathname.replace(/^\//, '').split('/')[0];
  const index = TAB_ORDER.indexOf(segment as (typeof TAB_ORDER)[number]);
  return index === -1 ? 0 : index;
}

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
  const fontReady = useSymbolFont(TAB_SYMBOLS, ICON_SIZE);
  const theme = useTheme();
  const pathname = usePathname();
  const index = tabIndexFromPathname(pathname);
  const previousIndex = useRef(index);
  const translateX = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (previousIndex.current === index || width === 0) {
      previousIndex.current = index;
      return;
    }

    const direction = index > previousIndex.current ? 1 : -1;
    previousIndex.current = index;
    translateX.setValue(direction * width);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, translateX, width]);

  return (
    <Tabs>
      <Animated.View
        style={[styles.slotWrap, { transform: [{ translateX }] }]}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.width;
          setWidth((current) => (Math.abs(current - next) < 0.5 ? current : next));
        }}>
        <TabSlot style={styles.slot} />
      </Animated.View>
      <TabList style={[styles.tabList, { backgroundColor: theme.secondary } as ViewStyle]}>
        <TabTrigger name="telemetry" href="/telemetry" asChild>
          <TabIcon icon="airwave" label="Telemetry" ready={fontReady} />
        </TabTrigger>

        <TabTrigger name="community" href="/community" asChild>
          <TabIcon icon="explore_nearby" label="Community" ready={fontReady} />
        </TabTrigger>

        <TabTrigger name="chats" href="/chats" asChild>
          <TabIcon icon="comic_bubble" label="Chats" ready={fontReady} />
        </TabTrigger>

        <TabTrigger name="profile" href="/profile" asChild>
          <TabIcon avatar label="Profile" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  slotWrap: {
    flex: 1,
    minHeight: 0,
  },
  slot: {
    flex: 1,
    // `TabSlot` defaults to `flexShrink: 0`, so a tall screen (like the
    // telemetry dashboard) pushes the tab bar past the bottom of the viewport.
    flexShrink: 1,
    minHeight: 0,
  },
  tabList: {
    position: 'absolute',
    bottom: FloatingPill.inset,
    // `left: 0` + `right: 0` + auto margins centre the pill, so the gutter on
    // each side is identical at every viewport width.
    left: 0,
    right: 0,
    width: FloatingPill.width,
    maxWidth: FloatingPill.maxWidth,
    marginHorizontal: 'auto',
    height: FloatingPill.height,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    // Flat by design: no border and no shadow, only the solid fill applied
    // inline from the active palette.
    borderRadius: Radius.pill,
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
    fontFamily: SYMBOL_FONT_FAMILY,
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
