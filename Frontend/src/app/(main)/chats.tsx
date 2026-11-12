import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

const DUMMY_CHATS = [
  { id: '1', title: 'Morning check-in', preview: 'How are you feeling today?' },
  { id: '2', title: 'Word practice', preview: 'Let us try three short words.' },
];

export default function ChatsScreen() {
  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <ThemedText type="subtitle">Chats</ThemedText>

        {DUMMY_CHATS.map((chat) => (
          <ThemedView key={chat.id} type="secondary" style={styles.row}>
            <ThemedText type="smallBold">{chat.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {chat.preview}
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
  row: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.half,
  },
});
