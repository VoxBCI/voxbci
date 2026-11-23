import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { signOut } from '@/api/session';
import { OutlinedView } from '@/components/outlined-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardLayout, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';

export default function ProfileScreen() {
  const { user } = useSession();

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <Image
            source={
              user?.avatarUrl
                ? { uri: user.avatarUrl }
                : require('../../../assets/images/avatar-identicon.png')
            }
            style={styles.avatar}
            accessibilityLabel="Profile picture"
          />

          {user ? (
            <ThemedText type="smallBold">{user.displayName}</ThemedText>
          ) : null}

          <ThemedText themeColor="textSecondary" style={styles.username}>
            {user ? `@${user.username}` : '@username'}
          </ThemedText>
        </View>

        <OutlinedView style={styles.card}>
          <ThemedText type="smallBold">Account settings</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user?.email ?? 'Manage your account details.'}
          </ThemedText>
        </OutlinedView>

        <OutlinedView style={styles.card}>
          <ThemedText type="smallBold">Device settings</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Manage your headset and connection.
          </ThemedText>
        </OutlinedView>

        {user ? (
          <OutlinedView style={styles.card}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void signOut().finally(() => router.replace('/auth'));
              }}
              style={({ pressed }) => [styles.signOut, { opacity: pressed ? 0.6 : 1 }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Sign out
              </ThemedText>
            </Pressable>
          </OutlinedView>
        ) : null}
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
  signOut: {
    alignItems: 'center',
    paddingVertical: Spacing.half,
  },
});
