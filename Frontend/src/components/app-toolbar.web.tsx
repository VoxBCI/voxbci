import { usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { currentTabLabel } from '@/components/app-toolbar-label';
import { VoxLogo } from '@/components/vox-logo';
import { CardLayout, MaxContentWidth, Spacing, StrokeWidth } from '@/constants/theme';
import { SYMBOL_FONT_FAMILY, useSymbolFont } from '@/hooks/use-symbol-font.web';
import { useTheme } from '@/hooks/use-theme';

const ICON_SIZE = 30;
const TOOLBAR_HEIGHT = 50;
const TOOLBAR_PADDING = 5;
const PAIR_ICON = 'toggle_on';
const PAIR_ICON_SIZE = 40;

/**
 * Top toolbar shared by the four main tabs: the VoxBCI logo plus the name of
 * the tab that is currently open.
 *
 * It is as wide as the cards underneath: the same `CardLayout.gutter` on both
 * sides and the same `MaxContentWidth` cap. Square corners, no margin and only
 * a bottom outline, so it reads as a header rule rather than a floating card.
 */
export function AppToolbar() {
  const pathname = usePathname();
  const theme = useTheme();
  const iconReady = useSymbolFont([PAIR_ICON], PAIR_ICON_SIZE);

  return (
    <View style={styles.frame}>
      <View
        style={[
          styles.toolbar,
          { backgroundColor: theme.background, borderBottomColor: theme.secondary },
        ]}>
        <VoxLogo size={ICON_SIZE} />
        <Text accessibilityRole="header" style={[styles.label, { color: theme.text }]}>
          {currentTabLabel(pathname)}
        </Text>

        <View style={styles.pairHeadset}>
          <Text style={[styles.pairLabel, { color: theme.text }]}>Pair headset</Text>
          <Text
            aria-hidden
            selectable={false}
            style={[
              styles.pairIcon,
              { color: theme.text, opacity: iconReady ? 1 : 0, fontFamily: SYMBOL_FONT_FAMILY },
            ]}>
            {PAIR_ICON}
          </Text>
        </View>
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
  pairHeadset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: 'auto',
  },
  pairIcon: {
    fontSize: PAIR_ICON_SIZE,
    lineHeight: PAIR_ICON_SIZE,
  },
  pairLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
