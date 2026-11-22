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
  whole site of the active tab (see _Configuring pages_ below).
- **Automatic theme switching** – optionally enable/disable the extension based
  on the browser/system theme: a dark theme turns it on, a light theme turns it
  off. Enable it under Options → _"Automatically enable/disable based on the
  browser/system theme"_.

## Configuring pages

You can override the recoloring method for specific pages, either from the
toolbar popup or under Options → _Configured pages_.

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

- **No asterisks.** `https://*.example.com` will _not_ work — the `*` is treated
  as a literal character and never matches.
- **A registrable domain covers everything under it.** An entry for
  `example.com` applies to every path _and_ every subdomain
  (`www.example.com`, `foo.bar.example.com`, …). This is how you configure many
  subdomains at once — no wildcard needed.
- **Be specific to narrow the scope.** Use `sub.example.com` for a single
  subdomain, or `example.com/some/path` to target a path section.
- **No scheme for http/https.** Keys are stored without the scheme
  (`example.com`, not `https://example.com`). Other protocols such as `file://`
  do include it.

| You want                                  | Entry to add            |
| ----------------------------------------- | ----------------------- |
| A whole site + all subdomains + all paths | `example.com`           |
| One specific subdomain                    | `sub.example.com`       |
| Just a path section                       | `example.com/some/path` |

## Building from source

Requirements: [Node.js](https://nodejs.org/) 20.15 or newer and npm. The
extension itself requires Firefox 153 or newer.

```sh
npm install       # install dependencies
npm run build     # produce the extension and an installable .xpi
```

The build writes an unpacked extension to `build-release-<id>/` and a packed,
linted `build-release-<id>.xpi` next to it, where `<id>` identifies the source
it was built from (git describe plus a hash of the sources). Set the
`ADDON_BUILD_OUT` environment variable to write them somewhere else.

### Running it during development

```sh
npm run dev
```

This rebuilds into `build-dev/` on every change and launches Firefox with the
add-on loaded through `web-ext run`, reloading it automatically. Use
`npm run dev:deved` for Firefox Developer Edition or `npm run dev:android` for
Firefox for Android; any other `web-ext run` options can be passed after `--`.

Alternatively, load a build manually: open `about:debugging` → _This Firefox_
→ _Load Temporary Add-on…_ and select `build-release-<id>/manifest.json`.
Temporary add-ons are removed when Firefox restarts. To install it permanently,
sign it as described below.

## Packaging

`npm run build` already produces an installable package,
`build-release-<id>.xpi`. That archive is a complete add-on package, but
**release versions of Firefox only install signed extensions permanently**, so
it must be signed first (see below) or submitted to
[AMO](https://addons.mozilla.org/developers/).

### Installing it permanently (signing)

To use it like any normal add-on, sign it through Mozilla's servers. This
requires a (free) [Firefox Add-ons](https://addons.mozilla.org/) account and
[API credentials](https://addons.mozilla.org/developers/addon/api/key/).

> **Note:** self-signing requires an extension ID that belongs to your own AMO
> account. If signing fails with an ID conflict, change
> `browser_specific_settings.gecko.id` in `manifest.json` to your own unique
> value (for example `dark-light@yourname`).

Then build and sign for self-distribution (the _unlisted_ channel):

```sh
WEB_EXT_API_KEY=<your-jwt-issuer> \
WEB_EXT_API_SECRET=<your-jwt-secret> \
npm run sign
```

On success a signed `.xpi` is written to `web-ext-artifacts/`. Install it in
Firefox via _Menu → Add-ons and themes → gear icon → Install Add-on From
File…_ (or by opening the `.xpi` in Firefox). It now stays installed across
restarts.

> **Tip:** if you only use Firefox Developer Edition, Nightly or ESR, you can
> instead set `xpinstall.signatures.required` to `false` in `about:config` and
> install the unsigned `build-release-<id>.xpi` from `npm run build` directly.

## Development

Run the test suite (unit tests with coverage):

```sh
npm test
```

Lint and type-check the sources:

```sh
npx eslint .
npx svelte-check
```

### Project layout

| Path                  | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `src/background/`     | Background page: prefs, content-script injection, etc. |
| `src/content/`        | Content script injected into every page.               |
| `src/browser-action/` | Toolbar popup ("configure for current tab", Svelte).   |
| `src/preferences/`    | Options page (Svelte).                                 |
| `src/methods/`        | Recoloring methods and their stylesheets.              |
| `src/common/`         | Shared preferences, types and utilities.               |
| `tools/`              | Build, dev-loop and signing scripts.                   |
| `test/`               | Mocha test suite.                                      |

## License

Licensed under the [Mozilla Public License 2.0](LICENSE).
