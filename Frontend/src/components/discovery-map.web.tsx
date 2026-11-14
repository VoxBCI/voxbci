import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import type { DiscoveryMapProps } from '@/components/discovery-map';
import { buildMapHtml, parseMapMessage } from '@/components/map-html';
import { useThemeScheme } from '@/hooks/use-theme';

/**
 * Web map: the same Leaflet page as native, sandboxed into an iframe.
 *
 * `react-native-webview` has no web implementation, and Leaflet's script cannot
 * run through `dangerouslySetInnerHTML` (injected scripts are inert), so an
 * iframe is both the simplest and the safest host. The page talks to this file
 * over `postMessage`, mirroring the WebView bridge on native.
 */
export default function DiscoveryMap({ people, query, onChat, style }: DiscoveryMapProps) {
  const scheme = useThemeScheme();
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  // Frozen at mount; later changes are posted into the frame so the map keeps
  // its viewport instead of reloading on each keystroke or theme switch.
  const initialScheme = useRef(scheme);
  const initialPeople = useRef(people);

  const html = useMemo(
    () => buildMapHtml({ people: initialPeople.current, scheme: initialScheme.current }),
    [],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;

      const message = parseMapMessage(event.data);
      if (!message) return;

      if (message.type === 'ready') {
        setReady(true);
        return;
      }

      const person = people.find((candidate) => candidate.id === message.id);
      if (person) onChat(person);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onChat, people]);

  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage(
      { __voxbciMap: true, type: 'theme', scheme },
      '*',
    );
  }, [ready, scheme]);

  useEffect(() => {
    if (!ready) return;
    frameRef.current?.contentWindow?.postMessage(
      { __voxbciMap: true, type: 'filter', query },
      '*',
    );
  }, [ready, query]);

  return (
    <View style={style}>
      {createElement('iframe', {
        ref: frameRef,
        title: 'Map of people you can chat with',
        srcDoc: html,
        sandbox: 'allow-scripts',
        onLoad: () => setReady(true),
        style: {
          display: 'block',
          width: '100%',
          height: '100%',
          border: 0,
          backgroundColor: 'transparent',
        },
      })}
    </View>
  );
}
