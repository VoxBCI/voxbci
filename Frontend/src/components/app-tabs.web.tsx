import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot />
      <TabList style={styles.tabList}>
        <TabTrigger name="home" href="/home" asChild>
          <Pressable>
            <Text>Home</Text>
          </Pressable>
        </TabTrigger>

        <TabTrigger name="chats" href="/chats" asChild>
          <Pressable>
            <Text>Chats</Text>
          </Pressable>
        </TabTrigger>

        <TabTrigger name="settings" href="/settings" asChild>
          <Pressable>
            <Text>Settings</Text>
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
    paddingVertical: 12,
  },
});
