# Dark Background and Light Text

A Firefox WebExtension that recolors every web page to have light text on a
dark background. Colors are fully customizable, and you can pick a different
recoloring strategy globally or per-site.

**Install from AMO:**
https://addons.mozilla.org/firefox/addon/dark-background-light-text/

## Features

- Turns every page into light-on-dark, with customizable default foreground,
  background, link, visited-link, active-link and selection colors.
- Multiple recoloring **methods** you can choose globally or per page:
  - **Stylesheet processor** – analyzes and rewrites page stylesheets
    (best results, default).
  - **Simple CSS** – applies a lightweight set of override rules.
  - **Invert** – inverts the whole page, including images and iframes.
  - **Disabled** – leaves a page untouched.
- Per-tab and per-URL configuration from the toolbar popup.
- Global and per-tab toggle keyboard shortcuts (default `F2` and
  `Ctrl+Alt+D`).
- **Automatic theme switching** – optionally enable/disable the extension based
  on the browser/system theme: a dark theme turns it on, a light theme turns it
  off. Enable it under Options → *"Automatically enable/disable based on the
  browser/system theme"*.

## Building from source

Requirements: [Node.js](https://nodejs.org/) and npm.

```sh
npm install       # install dependencies
npm run build     # produce the unpacked extension in dist/
```

The build output is written to `dist/` (override with the `ADDON_DIST_DIR`
environment variable).

### Loading it in Firefox

1. Run `npm run build`.
2. Open `about:debugging` → *This Firefox* → *Load Temporary Add-on…*.
3. Select `dist/manifest.json`.

## Development

Run the test suite (unit tests with coverage):

```sh
npm test
```

Lint the sources:

```sh
npx eslint src
```

### Project layout

| Path                | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `src/background/`   | Background page: prefs, content-script injection, etc.  |
| `src/content/`      | Content script injected into every page.                |
| `src/browser-action/` | Toolbar popup ("configure for current tab").          |
| `src/preferences/`  | Options page (Svelte).                                   |
| `src/methods/`      | Recoloring methods and their stylesheets.               |
| `src/common/`       | Shared preferences, types and utilities.                |
| `test/`             | Mocha test suite.                                       |

## License

Licensed under the [Mozilla Public License 2.0](LICENSE).
