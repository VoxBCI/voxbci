# Material Symbols subset

`material-symbols-outlined-subset.woff2` is a 4-glyph subset of
[Material Symbols Outlined](https://fonts.google.com/icons), used by the web tab
bar (`src/components/app-tabs.web.tsx`). The font renders icon names as
ligatures, so the tab bar renders the text `dashboard`, `groups_2`, `mail` and
`face_4` as icons.

It was downloaded from Google Fonts with this request:

```
https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=dashboard,groups_2,mail,face_4
```

To add icons, re-download the subset with the extra names added to `icon_names`
and update the `SYMBOLS` list in `app-tabs.web.tsx`.

Material Symbols is licensed under the
[Apache License 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE).
Copyright Google LLC.
