import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={[
          styles.tabList,
          { backgroundColor: theme.background, borderTopColor: theme.border },
        ]}>
        <TabTrigger name="home" href="/home" asChild>
          <Pressable>
            <ThemedText type="small">Home</ThemedText>
          </Pressable>
        </TabTrigger>

        <TabTrigger name="chats" href="/chats" asChild>
          <Pressable>
            <ThemedText type="small">Chats</ThemedText>
          </Pressable>
        </TabTrigger>

        <TabTrigger name="settings" href="/settings" asChild>
          <Pressable>
            <ThemedText type="small">Settings</ThemedText>
          </Pressable>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
