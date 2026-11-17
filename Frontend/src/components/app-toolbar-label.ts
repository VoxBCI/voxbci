/** Display names for the four main tabs, keyed by their URL segment. */
const TAB_LABELS: Record<string, string> = {
  telemetry: 'Telemetry',
  community: 'Community',
  chats: 'Chats',
  settings: 'Profile',
};

/** Turns a router pathname (`/chats`, `/chats/`) into the tab's display name. */
export function currentTabLabel(pathname: string) {
  const segment = pathname.replace(/^\/+|\/+$/g, '').split('/')[0] ?? '';
  return TAB_LABELS[segment] ?? 'Telemetry';
}
