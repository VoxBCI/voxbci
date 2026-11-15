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

export default function CommunityScreen() {
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
      <DiscoveryMap
        onChat={() => router.push('/chats')}
        people={PEOPLE}
        query={query}
        style={styles.map}
      />

      <View pointerEvents="box-none" style={styles.overlay}>
        <View pointerEvents="box-none" style={styles.overlayContent}>
          <ThemedText type="subtitle">Community</ThemedText>

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
              {
                backgroundColor: theme.secondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
          />

          <ThemedText type="small" themeColor="textSecondary">
            {needle
              ? `${matches.length} of ${PEOPLE.length} people match “${query.trim()}”`
              : `${PEOPLE.length} people you can chat with`}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: Spacing.four,
  },
  overlayContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
});
