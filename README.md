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
- Global, per-tab and per-site toggle keyboard shortcuts (defaults `F2`,
  `Ctrl+Alt+D` and `Ctrl+Alt+S`). The per-site shortcut disables/re-enables the
  whole site of the active tab (see *Configuring pages* below).
- **Automatic theme switching** – optionally enable/disable the extension based
  on the browser/system theme: a dark theme turns it on, a light theme turns it
  off. Enable it under Options → *"Automatically enable/disable based on the
  browser/system theme"*.

## Configuring pages

You can override the recoloring method for specific pages, either from the
toolbar popup or under Options → *Configured pages*.

Matching is **not** wildcard/glob based — entries are matched against a
hierarchy of keys derived from the page's URL, from most to least specific.
For `https://foo.bar.example.com/a/b`, the extension checks (in order):

```
foo.bar.example.com/a/b
foo.bar.example.com/a
foo.bar.example.com
bar.example.com
example.com
```

The first configured entry that matches wins. A few consequences worth knowing:

- **No asterisks.** `https://*.example.com` will *not* work — the `*` is treated
  as a literal character and never matches.
- **A registrable domain covers everything under it.** An entry for
  `example.com` applies to every path *and* every subdomain
  (`www.example.com`, `foo.bar.example.com`, …). This is how you configure many
  subdomains at once — no wildcard needed.
- **Be specific to narrow the scope.** Use `sub.example.com` for a single
  subdomain, or `example.com/some/path` to target a path section.
- **No scheme for http/https.** Keys are stored without the scheme
  (`example.com`, not `https://example.com`). Other protocols such as `file://`
  do include it.

| You want | Entry to add |
| -------- | ------------ |
| A whole site + all subdomains + all paths | `example.com` |
| One specific subdomain | `sub.example.com` |
| Just a path section | `example.com/some/path` |

## Building from source

Requirements: [Node.js](https://nodejs.org/) and npm.

```sh
npm install       # install dependencies
npm run build     # produce the unpacked extension in dist/
```

The build output is written to `dist/` (override with the `ADDON_DIST_DIR`
environment variable).

### Loading it temporarily (for development)

1. Run `npm run build`.
2. Open `about:debugging` → *This Firefox* → *Load Temporary Add-on…*.
3. Select `dist/manifest.json`.

Temporary add-ons are removed when Firefox restarts. To install it permanently,
package and sign it as described below.

## Packaging

Build an installable package (a zip of the extension) with:

```sh
npm run package
```

This produces `web-ext-artifacts/dark_background_and_light_text-<version>.zip`.
That archive is a complete add-on package, but **release versions of Firefox
only install signed extensions permanently**, so it must be signed first (see
below) or submitted to [AMO](https://addons.mozilla.org/developers/).

### Installing it permanently (signing)

To use it like any normal add-on, sign it through Mozilla's servers. This
requires a (free) [Firefox Add-ons](https://addons.mozilla.org/) account and
[API credentials](https://addons.mozilla.org/developers/addon/api/key/).

> **Note:** self-signing requires an extension ID that belongs to your own AMO
> account. If signing fails with an ID conflict, change
> `applications.gecko.id` in `manifest.json` to your own unique value (for
> example `dark-light@yourname`).

Then sign for self-distribution (the *unlisted* channel):

```sh
WEB_EXT_API_KEY=<your-jwt-issuer> \
WEB_EXT_API_SECRET=<your-jwt-secret> \
npm run sign
```

On success a signed `.xpi` is written to `web-ext-artifacts/`. Install it in
Firefox via *Menu → Add-ons and themes → gear icon → Install Add-on From
File…* (or by opening the `.xpi` in Firefox). It now stays installed across
restarts.

> **Tip:** if you only use Firefox Developer Edition, Nightly or ESR, you can
> instead set `xpinstall.signatures.required` to `false` in `about:config` and
> install the unsigned `.zip`/`.xpi` from `npm run package` directly.

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
