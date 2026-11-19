# Material Symbols subset

`material-symbols-outlined-subset.woff2` is a subset of
[Material Symbols Outlined](https://fonts.google.com/icons), used by the web
tab bar, telemetry actions, and toolbar controls (`src/components/app-tabs.web.tsx`,
`src/app/(main)/telemetry.tsx`, `src/components/app-toolbar.web.tsx`). The font
renders icon names as ligatures, so the UI renders the text `airwave`,
`explore_nearby`, `comic_bubble`, `content_copy` and `toggle_on` as icons.

It was downloaded from Google Fonts with this request:

```
https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=airwave,explore_nearby,comic_bubble,content_copy,toggle_on
```

Send a Chrome user agent to get the `woff2` variant of the CSS, then download
the single `fonts.gstatic.com` URL it returns.

To add icons, re-download the subset with the extra names added to `icon_names`
and add the names to `SymbolName` in `src/hooks/use-symbol-font.web.ts`.

Material Symbols is licensed under the
[Apache License 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE).
Copyright Google LLC.
