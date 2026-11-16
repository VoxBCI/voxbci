import { View, type ViewProps } from 'react-native';

import { StrokeWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Component-surface rule: every panel, card and input is filled with the page
 * colour (`background`) and defined by a `secondary` outline, so surfaces stay
 * flat against the page. The floating tab bar is the one exception — it keeps
 * the `secondary` fill.
 */
export function OutlinedView({ style, ...otherProps }: ViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.background,
          borderColor: theme.secondary,
          borderWidth: StrokeWidth,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}
