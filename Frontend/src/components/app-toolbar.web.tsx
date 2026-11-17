import { usePathname } from 'expo-router';
import { StyleSheet, Text, type TextStyle, View } from 'react-native';

import { currentTabLabel } from '@/components/app-toolbar-label';
import { CardLayout, MaxContentWidth, Spacing, StrokeWidth } from '@/constants/theme';
import { SYMBOL_FONT_FAMILY, useSymbolFont } from '@/hooks/use-symbol-font.web';
import { useTheme } from '@/hooks/use-theme';

const ICON_SIZE = 30;
const TOOLBAR_HEIGHT = 50;
const TOOLBAR_PADDING = 5;

/**
 * Top toolbar shared by the four main tabs: a Material Symbols "neurology"
 * glyph plus the name of the tab that is currently open.
 *
 * It is as wide as the cards underneath: the same `CardLayout.gutter` on both
 * sides and the same `MaxContentWidth` cap. Square corners, no margin and only
 * a bottom outline, so it reads as a header rule rather than a floating card.
 */
export function AppToolbar() {
  const pathname = usePathname();
  const theme = useTheme();
  const fontReady = useSymbolFont(['neurology'], ICON_SIZE);

  return (
    <View style={styles.frame}>
      <View
        style={[
          styles.toolbar,
          { backgroundColor: theme.background, borderBottomColor: theme.secondary },
        ]}>
        <Text
          accessibilityElementsHidden
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.glyph, { color: theme.text, opacity: fontReady ? 1 : 0 }]}>
          neurology
        </Text>
        <Text accessibilityRole="header" style={[styles.label, { color: theme.text }]}>
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
    gap: Spacing.two,
    padding: TOOLBAR_PADDING,
    // Header rule: square corners and a bottom outline only.
    borderRadius: 0,
    borderBottomWidth: StrokeWidth,
  },
  glyph: {
    fontFamily: SYMBOL_FONT_FAMILY,
    fontSize: ICON_SIZE,
    lineHeight: ICON_SIZE,
    // Not part of RN's TextStyle type, but react-native-web forwards it.
    fontFeatureSettings: "'liga' 1",
  } as TextStyle,
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
