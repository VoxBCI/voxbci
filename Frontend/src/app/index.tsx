import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { VoxLogo } from '@/components/vox-logo';

const SPLASH_DURATION_MS = 3000;
const LOGO_SIZE = 120;

export default function SplashRoute() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/auth');
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <VoxLogo size={LOGO_SIZE} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
