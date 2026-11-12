import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const SPLASH_DURATION_MS = 3000;

export default function SplashRoute() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/auth');
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText themeColor="accent" style={styles.logo}>
        VOX
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="small">
        Brain-to-voice
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
});
