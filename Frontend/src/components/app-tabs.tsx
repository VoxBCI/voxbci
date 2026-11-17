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
      <NativeTabs.Trigger name="telemetry">
        <NativeTabs.Trigger.Icon sf="waveform" md="airwave" />
        <NativeTabs.Trigger.Label hidden>Telemetry</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="community">
        <NativeTabs.Trigger.Icon sf="safari" md="explore_nearby" />
        <NativeTabs.Trigger.Label hidden>Community</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chats">
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" md="comic_bubble" />
        <NativeTabs.Trigger.Label hidden>Chats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          src={require('../../assets/images/avatar-identicon.png')}
        />
        <NativeTabs.Trigger.Label hidden>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
