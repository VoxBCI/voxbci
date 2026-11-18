import { usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { currentTabLabel } from '@/components/app-toolbar-label';
import { CardLayout, MaxContentWidth, Spacing, StrokeWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TOOLBAR_HEIGHT = 50;
const TOOLBAR_PADDING = 5;

/**
 * Top toolbar shared by the four main tabs: shows the name of the tab that is
 * currently open.
 *
 * It is as wide as the cards underneath: the same `CardLayout.gutter` on both
 * sides and the same `MaxContentWidth` cap. Square corners, no margin and only
 * a bottom outline, so it reads as a header rule rather than a floating card.
 */
export function AppToolbar() {
  const pathname = usePathname();
  const theme = useTheme();
  const isCommunity = pathname === '/community';

  return (
    <View style={[styles.frame, isCommunity && { backgroundColor: theme.accent }]}>
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: isCommunity ? theme.accent : theme.background,
            borderBottomColor: theme.secondary,
          },
        ]}>
        <Text
          accessibilityRole="header"
          style={[styles.label, { color: isCommunity ? '#FFFFFF' : theme.text }]}>
          {currentTabLabel(pathname)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Card-width frame: gutter on the sides, capped like the card column. */
  frame: {
    width: '100%',
    // The gutter is part of the frame, so the bar itself can grow to the full
    // `MaxContentWidth` on wide screens and stay at `100% - gutters` on phones.
    maxWidth: MaxContentWidth + CardLayout.gutter * 2,
    alignSelf: 'center',
    paddingHorizontal: CardLayout.gutter,
  },
  toolbar: {
    width: '100%',
    height: TOOLBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: TOOLBAR_PADDING,
    // Header rule: square corners and a bottom outline only.
    borderRadius: 0,
    borderBottomWidth: StrokeWidth,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
