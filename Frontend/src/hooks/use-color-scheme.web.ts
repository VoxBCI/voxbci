import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web version of `useColorScheme`.
 *
 * The HTML that Expo Router renders on the server cannot know the visitor's
 * theme, so it always ships the light palette. If the client then rendered
 * dark on its very first pass, React would report a hydration mismatch.
 *
 * `useSyncExternalStore` solves this without a `setState` inside `useEffect`:
 * the server snapshot is `false` (light) and the client snapshot is `true`, so
 * the real device theme is applied immediately after hydration.
 */

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const hasHydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  return hasHydrated ? (colorScheme ?? 'light') : 'light';
}
