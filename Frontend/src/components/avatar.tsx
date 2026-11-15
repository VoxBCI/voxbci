import { useState } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type AvatarProps = {
  /** Display name — drives the initials fallback and the a11y label. */
  name: string;
  /** Bundled image (dummy data) or a URL string from the backend. */
  source?: string | ImageSourcePropType | null;
  /** Diameter in px. */
  size?: number;
};

/** First letter of the first and last word: "Amara Okafor" → "AO". */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';

  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';

  return (first + last).toUpperCase();
}

/**
 * Circular profile picture with an initials placeholder.
 *
 * Pass either a bundled asset or a URL; a failed load falls back to initials so
 * the list never shows a broken image.
 */
export function Avatar({ name, source, size = 44 }: AvatarProps) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);

  const shape = { width: size, height: size, borderRadius: size / 2 };
  const uri = typeof source === 'string' ? { uri: source } : source;

  if (uri && !failed) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={`${name} profile picture`}
        onError={() => setFailed(true)}
        source={uri}
        style={[styles.image, shape]}
      />
    );
  }

  return (
    <View style={[styles.placeholder, shape, { backgroundColor: theme.secondary }]}>
      <ThemedText
        style={[
          styles.initials,
          { fontSize: Math.round(size * 0.36), lineHeight: size, width: size },
        ]}>
        {initials(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
  placeholder: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
