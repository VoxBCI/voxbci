import { Asset } from 'expo-asset';
import { useEffect, useState } from 'react';

/**
 * Google Material Symbols glyph names available in the bundled subset.
 *
 * These glyphs come from the newer Material Symbols set
 * (https://fonts.google.com/icons) — the Material Icons font bundled with
 * `@expo/vector-icons` does not include all of them.
 */
export type SymbolName =
  | 'airwave'
  | 'explore_nearby'
  | 'comic_bubble'
  | 'content_copy'
  | 'expand_content'
  | 'toggle_on';

/** CSS family the tab bar glyphs and the toolbar glyph share. */
export const SYMBOL_FONT_FAMILY = 'VoxMaterialSymbols';

const FONT_STYLE_ID = 'vox-material-symbols';
const FONT_ASSET = require('../../assets/fonts/material-symbols-outlined-subset.woff2');

/**
 * Material Symbols draws each icon name as a ligature, so the string
 * "explore_nearby" renders as a single glyph. We bundle a ~2 KB subset holding
 * just the glyphs the app uses instead of pulling the full font from a CDN.
 *
 * Loads the subset once per document and reports when `glyphs` are ready, so
 * callers can hide the glyph until the font has downloaded (avoids flashing the
 * literal icon names).
 */
export function useSymbolFont(glyphs: readonly SymbolName[], fontSize: number) {
  const [ready, setReady] = useState(false);
  const glyphKey = glyphs.join(' ');

  useEffect(() => {
    let active = true;

    // SSR never reaches this effect; on the client it runs on mount.
    if (!document.getElementById(FONT_STYLE_ID)) {
      const asset = Asset.fromModule(FONT_ASSET);
      const style = document.createElement('style');
      style.id = FONT_STYLE_ID;
      style.textContent = `@font-face{font-family:'${SYMBOL_FONT_FAMILY}';src:url("${asset.localUri ?? asset.uri}") format('woff2');font-style:normal;font-weight:normal;font-display:block;}`;
      document.head.appendChild(style);
    }

    document.fonts
      .load(`${fontSize}px "${SYMBOL_FONT_FAMILY}"`, glyphKey)
      .then(() => {
        if (active) setReady(true);
      })
      .catch((error) => console.warn('Material Symbols font failed to load', error));

    return () => {
      active = false;
    };
  }, [fontSize, glyphKey]);

  return ready;
}
