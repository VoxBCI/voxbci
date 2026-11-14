import type { Person } from '@/data/people';

/**
 * Builds the self-contained Leaflet page that is rendered inside a WebView on
 * native (`discovery-map.tsx`) and an iframe on web (`discovery-map.web.tsx`).
 *
 * Why Leaflet + CARTO: `react-native-maps` / `expo-maps` need a Google Maps API
 * key on Android. Leaflet runs entirely inside the page, so the map stays free
 * and key-free. CARTO's basemaps follow the device theme (`light_all` /
 * `dark_all`), and the OpenStreetMap + CARTO attribution stays on screen, which
 * their terms require.
 *
 * The page exposes `window.__voxbciMap` so React can push changes without
 * reloading the map (a reload would reset the viewport):
 *
 *   __voxbciMap.setTheme('dark')
 *   __voxbciMap.setFilter('amara')
 *
 * It posts `{ type: 'ready' }` once mounted, and `{ type: 'chat', id }` when a
 * popup's Chat button is pressed. On web the same JSON is posted to the parent
 * page instead.
 */

export type MapScheme = 'light' | 'dark';

export type BuildMapHtmlOptions = {
  people: Person[];
  scheme: MapScheme;
};

/** Messages the map page posts back to its host. */
export type MapMessage = { type: 'ready' } | { type: 'chat'; id: string };

/** Parses a bridged message, ignoring anything the page did not send. */
export function parseMapMessage(raw: unknown): MapMessage | null {
  let data = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;

  const candidate = data as { type?: unknown; id?: unknown };
  if (candidate.type === 'ready') return { type: 'ready' };
  if (candidate.type === 'chat' && typeof candidate.id === 'string') {
    return { type: 'chat', id: candidate.id };
  }
  return null;
}

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

/** JSON that is safe to inline in a `<script>` and in a JS string literal. */
function inlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildMapHtml({ people, scheme }: BuildMapHtmlOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<title>People you can chat with</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  :root {
    color-scheme: light;
    --bg: #ffffff;
    --surface: #f0f5ff;
    --text: #000000;
    --muted: #4a5a6a;
    --accent: #007bff;
    --border: rgba(0, 0, 0, 0.10);
    --ring: #ffffff;
    --attrib: rgba(255, 255, 255, 0.86);
    --shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
  }
  body[data-scheme='dark'] {
    color-scheme: dark;
    --bg: #00254c;
    --surface: #007bff;
    --text: #ffffff;
    --muted: rgba(255, 255, 255, 0.72);
    --accent: #007bff;
    --border: rgba(255, 255, 255, 0.18);
    --ring: #00254c;
    --attrib: rgba(0, 37, 76, 0.86);
    --shadow: 0 10px 24px rgba(0, 0, 0, 0.5);
  }
  html, body {
    height: 100%;
    margin: 0;
    background: var(--bg);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-text-size-adjust: 100%;
  }
  #map {
    position: absolute;
    inset: 0;
    background: var(--bg);
    outline: none;
  }
  .leaflet-container {
    background: var(--bg);
    font-family: inherit;
    font-size: 14px;
  }
  .pin-shell {
    background: transparent;
    border: 0;
  }
  .pin {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--accent);
    color: #ffffff;
    border: 2px solid var(--ring);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1;
  }
  .leaflet-marker-icon:focus .pin,
  .leaflet-marker-icon:hover .pin {
    transform: scale(1.08);
    transition: transform 120ms ease-out;
  }
  .leaflet-popup-content-wrapper,
  .leaflet-popup-tip {
    background: var(--bg);
    color: var(--text);
    box-shadow: var(--shadow);
  }
  .leaflet-popup-content-wrapper {
    border-radius: 14px;
    border: 1px solid var(--border);
  }
  .leaflet-popup-content {
    margin: 14px 16px;
    line-height: 1.4;
  }
  .leaflet-popup-tip {
    border: 1px solid var(--border);
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 150px;
  }
  .name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
  }
  .headline {
    margin: 0;
    font-size: 12px;
    color: var(--muted);
  }
  .chat {
    margin-top: 8px;
    padding: 9px 14px;
    border: 0;
    border-radius: 999px;
    background: var(--accent);
    color: #ffffff;
    font: 600 13px/1 inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .chat:active {
    opacity: 0.85;
  }
  .leaflet-control-zoom {
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .leaflet-control-zoom a,
  .leaflet-control-zoom a:hover {
    background: var(--bg);
    color: var(--text);
    border-bottom-color: var(--border);
  }
  .leaflet-control-attribution {
    background: var(--attrib) !important;
    color: var(--muted) !important;
    border-radius: 8px 0 0 0;
    padding: 2px 6px;
    font-size: 10px;
  }
  .leaflet-control-attribution a {
    color: var(--muted) !important;
  }
  #notice {
    position: absolute;
    left: 50%;
    top: 14px;
    transform: translateX(-50%);
    z-index: 800;
    max-width: 82%;
    margin: 0;
    padding: 8px 14px;
    border-radius: 999px;
    background: var(--bg);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    color: var(--text);
    font-size: 12px;
    font-weight: 600;
    text-align: center;
  }
  #notice[hidden] {
    display: none;
  }
</style>
</head>
<body data-scheme="${scheme}">
<div id="map" role="application" aria-label="Map of people you can chat with"></div>
<p id="notice" hidden></p>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  'use strict';

  var PEOPLE = ${inlineJson(people)};
  var INITIAL_SCHEME = ${inlineJson(scheme)};
  var ATTRIBUTION = ${inlineJson(ATTRIBUTION)};

  var TILES = {
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
  };

  // Leaflet only paints layers once the map has a view, so seed one from the
  // people themselves; fitAll() tightens it to the exact bounds afterwards.
  var peopleBounds = L.latLngBounds(
    PEOPLE.map(function (person) {
      return [person.lat, person.lng];
    })
  );

  var map = L.map('map', {
    center: peopleBounds.isValid() ? peopleBounds.getCenter() : [51.5074, -0.1278],
    zoom: 12,
    zoomControl: true,
    zoomSnap: 0.5,
    worldCopyJump: true
  });

  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution(ATTRIBUTION);

  var tiles = null;

  function applyTiles(scheme) {
    if (tiles) {
      map.removeLayer(tiles);
    }
    tiles = L.tileLayer(TILES[scheme] || TILES.light, {
      attribution: ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 20
    });
    tiles.addTo(map);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function initials(name) {
    var parts = String(name).trim().split(/\\s+/);
    var out = '';
    for (var i = 0; i < parts.length && out.length < 2; i += 1) {
      out += parts[i].charAt(0).toUpperCase();
    }
    return out;
  }

  function send(payload) {
    var message = JSON.stringify(payload);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(message);
      return;
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
  }

  var peopleById = {};
  var markers = {};
  var layers = L.featureGroup().addTo(map);

  PEOPLE.forEach(function (person) {
    var marker = L.marker([person.lat, person.lng], {
      icon: L.divIcon({
        className: 'pin-shell',
        html: '<span class="pin">' + escapeHtml(initials(person.name)) + '</span>',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      }),
      title: person.name,
      alt: person.name,
      riseOnHover: true,
      keyboard: true
    });

    marker.bindPopup(
      '<div class="card">' +
        '<span class="name">' + escapeHtml(person.name) + '</span>' +
        '<p class="headline">' + escapeHtml(person.headline) + '</p>' +
        '<button type="button" class="chat" data-person="' + escapeHtml(person.id) + '">Chat</button>' +
      '</div>',
      { closeButton: false, autoPanPadding: [24, 24], maxWidth: 240 }
    );

    marker.addTo(layers);
    markers[person.id] = marker;
    peopleById[person.id] = person;
  });

  map.on('popupopen', function (event) {
    var root = event.popup.getElement();
    if (!root) {
      return;
    }
    var button = root.querySelector('button.chat');
    if (!button) {
      return;
    }
    button.addEventListener('click', function () {
      send({ type: 'chat', id: button.getAttribute('data-person') });
      map.closePopup();
    });
  });

  var allBounds = layers.getBounds();

  function fitAll(animate) {
    if (!allBounds.isValid()) {
      return;
    }
    map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 14, animate: animate });
  }

  function setFilter(query) {
    var raw = String(query == null ? '' : query).trim();
    var needle = raw.toLowerCase();
    var bounds = L.latLngBounds([]);
    var visible = 0;

    Object.keys(markers).forEach(function (id) {
      var person = peopleById[id];
      var marker = markers[id];
      var haystack = (person.name + ' ' + person.headline).toLowerCase();

      if (!needle || haystack.indexOf(needle) !== -1) {
        if (!layers.hasLayer(marker)) {
          layers.addLayer(marker);
        }
        bounds.extend(marker.getLatLng());
        visible += 1;
      } else if (layers.hasLayer(marker)) {
        layers.removeLayer(marker);
      }
    });

    var notice = document.getElementById('notice');
    if (visible === 0) {
      notice.textContent = needle
        ? 'No one matches "' + raw + '"'
        : 'No people to show yet';
      notice.hidden = false;
      return;
    }

    notice.hidden = true;
    if (needle) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: true, duration: 0.4 });
    } else {
      fitAll(true);
    }
  }

  function setTheme(scheme) {
    var next = scheme === 'dark' ? 'dark' : 'light';
    document.body.setAttribute('data-scheme', next);
    document.documentElement.setAttribute('data-scheme', next);
    applyTiles(next);
  }

  // Control channel used by the web build: parent page → iframe.
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        return;
      }
    }
    if (!data || data.__voxbciMap !== true) {
      return;
    }
    if (data.type === 'theme') {
      setTheme(data.scheme);
    }
    if (data.type === 'filter') {
      setFilter(data.query);
    }
  });

  window.__voxbciMap = {
    setTheme: setTheme,
    setFilter: setFilter
  };

  setTheme(INITIAL_SCHEME);
  map.whenReady(function () {
    map.invalidateSize();
    fitAll(false);
  });
  // The host can finish laying the container out a moment after load. Only
  // resize here — re-fitting would undo a filter the user already typed.
  setTimeout(function () {
    map.invalidateSize();
  }, 250);
  window.addEventListener('resize', function () {
    map.invalidateSize();
  });

  send({ type: 'ready' });
})();
</script>
</body>
</html>`;
}
