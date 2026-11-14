import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import {
  WebView as NativeWebView,
  type WebViewMessageEvent,
  type WebViewProps,
} from 'react-native-webview';

import { buildMapHtml, parseMapMessage } from '@/components/map-html';
import type { Person } from '@/data/people';
import { useThemeScheme } from '@/hooks/use-theme';

/**
 * `react-native-webview` declares `class WebView<P = undefined>`, which under
 * React 19 types makes its JSX props `WebViewProps & undefined` (= never).
 * Re-type the call site so the component is usable without changing the package.
 */
const WebView = NativeWebView as unknown as ComponentType<
  WebViewProps & { ref?: Ref<NativeWebView> }
>;

export type DiscoveryMapProps = {
  people: Person[];
  /** Live search text — the map hides anyone who does not match. */
  query: string;
  /** Called when the popup's Chat button is pressed. */
  onChat: (person: Person) => void;
  style?: StyleProp<ViewStyle>;
};

function jsString(value: string): string {
  return JSON.stringify(value).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/**
 * Native map: a Leaflet page inside a WebView, so no Google Maps API key is
 * needed (see `map-html.ts`). The web build lives in `discovery-map.web.tsx`.
 */
export default function DiscoveryMap({ people, query, onChat, style }: DiscoveryMapProps) {
  const scheme = useThemeScheme();
  const webViewRef = useRef<NativeWebView | null>(null);
  const [ready, setReady] = useState(false);

  // Frozen at mount: the page is generated once, then theme/filter changes are
  // injected so the map keeps its viewport and does not reload per keystroke.
  const initialScheme = useRef(scheme);
  const initialPeople = useRef(people);

  const html = useMemo(
    () => buildMapHtml({ people: initialPeople.current, scheme: initialScheme.current }),
    [],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseMapMessage(event.nativeEvent.data);
      if (!message) return;

      if (message.type === 'ready') {
        setReady(true);
        return;
      }

      const person = people.find((candidate) => candidate.id === message.id);
      if (person) onChat(person);
    },
    [onChat, people],
  );

  useEffect(() => {
    if (!ready) return;
    webViewRef.current?.injectJavaScript(
      `window.__voxbciMap.setTheme(${jsString(scheme)}); true;`,
    );
  }, [ready, scheme]);

  useEffect(() => {
    if (!ready) return;
    webViewRef.current?.injectJavaScript(
      `window.__voxbciMap.setFilter(${jsString(query)}); true;`,
    );
  }, [ready, query]);

  return (
    <WebView
      ref={webViewRef}
      androidLayerType="hardware"
      bounces={false}
      domStorageEnabled
      javaScriptEnabled
      onMessage={handleMessage}
      originWhitelist={['*']}
      overScrollMode="never"
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      source={{ html }}
      style={[styles.webview, style]}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
