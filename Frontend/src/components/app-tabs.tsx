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
        <NativeTabs.Trigger.Icon sf="speedometer" md="dashboard" />
        <NativeTabs.Trigger.Label hidden>Telemetry</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="community">
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person_pin_circle" />
        <NativeTabs.Trigger.Label hidden>Community</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chats">
        <NativeTabs.Trigger.Icon sf="envelope" md="mail" />
        <NativeTabs.Trigger.Label hidden>Chats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          src={require('../../assets/images/avatar-identicon.png')}
        />
        <NativeTabs.Trigger.Label hidden>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
