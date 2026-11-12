import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AuthScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Welcome back</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Sign in placeholder — no backend wired up yet.
      </ThemedText>

      <Pressable
        onPress={() => router.replace('/home')}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.secondary, opacity: pressed ? 0.8 : 1 },
        ]}>
        <ThemedText style={styles.buttonLabel}>Continue</ThemedText>
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
  button: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.pill,
  },
  buttonLabel: {
    fontWeight: '600',
  },
});
