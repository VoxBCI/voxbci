import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SUGGESTIONS = ['Sessions', 'Words', 'Chats', 'Settings'];

export default function DiscoveryScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <ThemedText type="subtitle">Discovery</ThemedText>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search everything"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border },
          ]}
        />

        {SUGGESTIONS.map((item) => (
          <ThemedView key={item} type="secondary" style={styles.row}>
            <ThemedText type="smallBold">{item}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Placeholder — results are still being built.
            </ThemedText>
          </ThemedView>
        ))}
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
  input: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  row: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.half,
  },
});
