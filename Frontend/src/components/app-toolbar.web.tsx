import { usePathname } from 'expo-router';
import { StyleSheet, Text, type TextStyle, View } from 'react-native';

import { currentTabLabel } from '@/components/app-toolbar-label';
import { OutlinedView } from '@/components/outlined-view';
import { CardLayout, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { SYMBOL_FONT_FAMILY, useSymbolFont } from '@/hooks/use-symbol-font.web';
import { useTheme } from '@/hooks/use-theme';

const ICON_SIZE = 40;
const TOOLBAR_PADDING = 15;

/**
 * Small top-left toolbar shared by the four main tabs: a Material Symbols
 * "neurology" glyph plus the name of the tab that is currently open.
 *
 * Like every other panel it follows the component-surface rule (`OutlinedView`)
 * and sits inside the card gutter, so it lines up with the cards underneath.
 */
export function AppToolbar() {
  const pathname = usePathname();
  const theme = useTheme();
  const fontReady = useSymbolFont(['neurology'], ICON_SIZE);

  return (
    <View style={styles.gutter}>
      <OutlinedView style={styles.toolbar}>
        <Text
          accessibilityElementsHidden
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.glyph,
            { color: theme.text, opacity: fontReady ? 1 : 0 },
          ]}>
          neurology
        </Text>
        <Text accessibilityRole="header" style={[styles.label, { color: theme.text }]}>
          {currentTabLabel(pathname)}
        </Text>
      </OutlinedView>
    </View>
  );
}

const styles = StyleSheet.create({
  gutter: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    alignItems: 'flex-start',
    paddingTop: CardLayout.gutter,
    paddingHorizontal: CardLayout.gutter,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: TOOLBAR_PADDING,
    borderRadius: Radius.md,
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
