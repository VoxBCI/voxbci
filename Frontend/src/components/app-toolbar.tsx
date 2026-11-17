import { usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentTabLabel } from '@/components/app-toolbar-label';
import { OutlinedView } from '@/components/outlined-view';
import { CardLayout, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICON_SIZE = 40;
const TOOLBAR_PADDING = 15;

/**
 * Small top-left toolbar shared by the four main tabs: a brain glyph plus the
 * name of the tab that is currently open.
 *
 * `SymbolView` maps the Material Symbols "neurology" glyph on Android and the
 * closest SF Symbol on iOS. Like every other panel it follows the
 * component-surface rule (`OutlinedView`).
 */
export function AppToolbar() {
  const pathname = usePathname();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.gutter, { paddingTop: Math.max(insets.top, CardLayout.gutter) }]}>
      <OutlinedView style={styles.toolbar}>
        <SymbolView
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          name={{ ios: 'brain', android: 'neurology' }}
          size={ICON_SIZE}
          tintColor={theme.text}
        />
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
    paddingHorizontal: CardLayout.gutter,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: TOOLBAR_PADDING,
    borderRadius: Radius.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
