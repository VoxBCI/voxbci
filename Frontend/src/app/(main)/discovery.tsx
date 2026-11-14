import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import DiscoveryMap from '@/components/discovery-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { PEOPLE, type Person } from '@/data/people';
import { useTheme } from '@/hooks/use-theme';

function matchesQuery(person: Person, needle: string) {
  return `${person.name} ${person.headline}`.toLowerCase().includes(needle);
}

export default function DiscoveryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const matches = useMemo(
    () => (needle ? PEOPLE.filter((person) => matchesQuery(person, needle)) : PEOPLE),
    [needle],
  );

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <ThemedText type="subtitle">Discovery</ThemedText>

        <TextInput
          accessibilityLabel="Search people to chat with"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search people to chat with"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="search"
          value={query}
          style={[
            styles.input,
            { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border },
          ]}
        />

        <ThemedText type="small" themeColor="textSecondary">
          {needle
            ? `${matches.length} of ${PEOPLE.length} people match “${query.trim()}”`
            : `${PEOPLE.length} people you can chat with`}
        </ThemedText>

        <View style={[styles.mapCard, { borderColor: theme.border }]}>
          <DiscoveryMap
            onChat={() => router.push('/chats')}
            people={PEOPLE}
            query={query}
            style={styles.map}
          />
        </View>
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
  mapCard: {
    flex: 1,
    minHeight: 260,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
