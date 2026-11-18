import { Image, StyleSheet, View } from 'react-native';

import { OutlinedView } from '@/components/outlined-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardLayout, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <Image
            source={require('../../../assets/images/avatar-identicon.png')}
            style={styles.avatar}
            accessibilityLabel="Profile picture"
          />
          <ThemedText themeColor="textSecondary" style={styles.username}>
            @username
          </ThemedText>
        </View>

        <OutlinedView style={styles.card}>
          <ThemedText type="smallBold">Account settings</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Manage your account details.
          </ThemedText>
        </OutlinedView>

        <OutlinedView style={styles.card}>
          <ThemedText type="smallBold">Device settings</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Manage your headset and connection.
          </ThemedText>
        </OutlinedView>
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
    paddingTop: CardLayout.gutter,
    paddingHorizontal: CardLayout.gutter,
    paddingBottom: CardLayout.bottomInset,
    gap: CardLayout.gap,
  },
  profileHeader: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.four,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  username: {
    textAlign: 'center',
  },
  card: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.half,
  },
});
