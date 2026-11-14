import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { forwardRef, useEffect, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, type PressableProps, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICON_SIZE = 26;

type TabIconProps = Omit<PressableProps, 'children'> & {
  /** Material Icons glyph name. https://icons.expo.fyi */
  icon: keyof typeof MaterialIcons.glyphMap;
  /** Accessible name — the tab bar itself is icon-only. */
  label: string;
  /** Hides the glyph until the icon font finishes loading (web only). */
  ready?: boolean;
  /** Injected by `TabTrigger` via `asChild`. */
  isFocused?: boolean;
};

const TabIcon = forwardRef<ComponentRef<typeof View>, TabIconProps>(function TabIcon(
  { icon, label, ready = true, isFocused, style, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <Pressable
      ref={ref}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={(state) => [styles.tab, typeof style === 'function' ? style(state) : style]}
      {...rest}>
      <MaterialIcons
        color={isFocused ? theme.accent : theme.textSecondary}
        name={icon}
        size={ICON_SIZE}
        style={{ opacity: ready ? 1 : 0 }}
      />
    </Pressable>
  );
});

export default function AppTabs() {
  const theme = useTheme();

  // @expo/vector-icons self-loads its font on mount, but the web class component
  // hydrates with an empty glyph first. Loading it up front avoids blank icons.
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    MaterialIcons.loadFont()
      .then(() => active && setFontLoaded(true))
      .catch((error) => console.warn('MaterialIcons font failed to load', error));
    return () => {
      active = false;
    };
  }, []);

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={[
          styles.tabList,
          { backgroundColor: theme.background, borderTopColor: theme.border },
        ]}>
        <TabTrigger name="home" href="/home" asChild>
          <TabIcon icon="home" label="Home" ready={fontLoaded} />
        </TabTrigger>

        <TabTrigger name="discovery" href="/discovery" asChild>
          <TabIcon icon="map" label="Discovery" ready={fontLoaded} />
        </TabTrigger>

        <TabTrigger name="chats" href="/chats" asChild>
          <TabIcon icon="chat-bubble-outline" label="Chats" ready={fontLoaded} />
        </TabTrigger>

        <TabTrigger name="settings" href="/settings" asChild>
          <TabIcon icon="settings" label="Settings" ready={fontLoaded} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
