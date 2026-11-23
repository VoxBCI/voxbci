import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/http';
import { signInWithDevEmail } from '@/api/session';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FloatingPill, Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';

/** The CTA is white with black type in both palettes, like the Google button. */
const BUTTON_BACKGROUND = '#FFFFFF';
const BUTTON_TEXT = '#000000';

/** Development account until Google sign-in lands (`POST /auth/dev-login`). */
const DEV_EMAIL = process.env.EXPO_PUBLIC_DEV_EMAIL ?? 'demo@voxbci.app';

export default function AuthScreen() {
  const theme = useTheme();
  const session = useSession();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A stored session skips the CTA entirely.
  useEffect(() => {
    if (session.status === 'authenticated') router.replace('/telemetry');
  }, [session.status]);

  const onContinue = async () => {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      await signInWithDevEmail(DEV_EMAIL);
      router.replace('/telemetry');
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.isOffline
            ? 'Cannot reach the local API. Run `npm run dev` in Backend/.'
            : cause.message
          : 'Sign-in failed. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Lower half of the screen uses the raised-surface colour. */}
      <View
        pointerEvents="none"
        style={[styles.bottomHalf, { backgroundColor: theme.secondary }]}
      />

      {/* Footnote + CTA share the tab bar's footprint at the bottom edge. */}
      <View style={styles.bottomArea}>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {error ?? 'No headset detected'}
        </ThemedText>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy }}
          disabled={busy}
          onPress={onContinue}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: BUTTON_BACKGROUND,
              opacity: pressed || busy ? 0.8 : 1,
            },
          ]}>
          <ThemedText style={[styles.buttonLabel, { color: BUTTON_TEXT }]}>
            {busy ? 'Signing in…' : 'Continue'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  /** Same width and bottom inset as the floating tab bar. */
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: FloatingPill.width,
    maxWidth: FloatingPill.maxWidth,
    marginHorizontal: 'auto',
    paddingBottom: FloatingPill.inset,
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    width: '100%',
    height: FloatingPill.height,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  buttonLabel: {
    fontWeight: '600',
  },
});
