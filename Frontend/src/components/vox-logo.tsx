import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { useThemeScheme } from '@/hooks/use-theme';

/** Solid blue V speech bubble, used on the light palette. */
const LOGO_LIGHT = require('../../assets/images/vox-logo-light.png');
/** Pale outline V speech bubble, used on the dark palette. */
const LOGO_DARK = require('../../assets/images/vox-logo-dark.png');

type VoxLogoProps = {
  /** Square edge length in points. */
  size: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * The VoxBCI mark: a "V" inside a chat bubble. The solid blue artwork is for
 * light surfaces and the pale outline artwork for dark ones, so the mark keeps
 * its contrast without tinting a bitmap.
 */
export function VoxLogo({ size, style }: VoxLogoProps) {
  const scheme = useThemeScheme();

  return (
    <Image
      accessibilityElementsHidden
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      resizeMode="contain"
      source={scheme === 'dark' ? LOGO_DARK : LOGO_LIGHT}
      style={[{ width: size, height: size }, style]}
    />
  );
}
