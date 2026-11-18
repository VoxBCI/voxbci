import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FloatingPill, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The CTA is white with black type in both palettes, like the Google button. */
const BUTTON_BACKGROUND = '#FFFFFF';
const BUTTON_TEXT = '#000000';

export default function AuthScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      {/* Lower half of the screen uses the raised-surface colour. */}
      <View
        pointerEvents="none"
        style={[styles.bottomHalf, { backgroundColor: theme.secondary }]}
      />

      <ThemedText type="subtitle">Welcome back</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Sign in placeholder — no backend wired up yet.
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/telemetry')}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: BUTTON_BACKGROUND,
            opacity: pressed ? 0.8 : 1,
          },
        ]}>
        <ThemedText style={[styles.buttonLabel, { color: BUTTON_TEXT }]}>
          Continue with Google
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  subtitle: {
    textAlign: 'center',
  },
  /** 50vh to 100vh: the tinted panel the CTA floats on. */
  bottomHalf: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
  },
  /** Same footprint and position as the floating tab bar. */
  button: {
    position: 'absolute',
    bottom: FloatingPill.inset,
    left: 0,
    right: 0,
    width: FloatingPill.width,
    maxWidth: FloatingPill.maxWidth,
    height: FloatingPill.height,
    marginHorizontal: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  buttonLabel: {
    fontWeight: '600',
  },
});
