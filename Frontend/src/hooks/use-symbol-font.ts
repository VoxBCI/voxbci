/**
 * Google Material Symbols glyph names available in the bundled subset.
 *
 * The web implementation loads a subset woff2 font; native falls back to
 * platform glyphs/text where needed.
 */
export type SymbolName =
  | 'airwave'
  | 'collapse_content'
  | 'explore_nearby'
  | 'comic_bubble'
  | 'content_copy'
  | 'expand_content'
  | 'toggle_on';

/** CSS family the web glyphs use. */
export const SYMBOL_FONT_FAMILY = 'VoxMaterialSymbols';

/** Native no-op: the subset font is only loaded on web. */
export function useSymbolFont(_glyphs: readonly SymbolName[], _fontSize: number) {
  return true;
}
