import { NativeTabs } from 'expo-router/native-tabs';

/**
 * Icon-only tab bar. Labels stay in the tree (hidden) so screen readers and
 * deep links still resolve a name for each tab.
 *
 * `sf` = Apple SF Symbols (iOS), `md` = Google Material Symbols (Android).
 * Icons: https://icons.expo.fyi
 */
export default function AppTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf="house" md="home" />
        <NativeTabs.Trigger.Label hidden>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discovery">
        <NativeTabs.Trigger.Icon sf="map" md="map" />
        <NativeTabs.Trigger.Label hidden>Discovery</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chats">
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" md="chat_bubble" />
        <NativeTabs.Trigger.Label hidden>Chats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
        <NativeTabs.Trigger.Label hidden>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
