import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useChats } from '@/hooks/use-chats';

export default function ChatsScreen() {
  const chats = useChats();

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        {chats.map((chat) => (
          <ThemedView key={chat.id} type="secondary" style={styles.row}>
            <Avatar name={chat.name} source={chat.avatar} />

            <View style={styles.rowText}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {chat.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {chat.preview}
              </ThemedText>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
});
