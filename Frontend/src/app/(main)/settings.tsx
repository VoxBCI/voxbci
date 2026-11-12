import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <ThemedText type="subtitle">Settings</ThemedText>

        <ThemedView type="secondary" style={styles.card}>
          <ThemedText type="smallBold">Appearance</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Follows your device theme.
          </ThemedText>
        </ThemedView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.half,
  },
});
