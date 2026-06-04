# SimpleSearch

SimpleSearch is a minimalist desktop search launcher. It keeps the page quiet: type, press Enter, and move on.

It can also run as a Chrome/Edge new tab extension.

![SimpleSearch preview](docs/assets/simplesearch-preview.png)

## Features

- Plain searches use the browser's default search engine through Chrome Search API.
- Slash commands can run one-off searches with Google, Baidu, Bing, GitHub, DuckDuckGo, or custom engines.
- Automatic English/Chinese UI based on the browser language.
- Direct URL, domain, IP, and localhost navigation.
- `Shift+Enter` to force search when an IP or domain should be searched instead of opened.
- System, light, and dark themes.
- Built-in `/help` panel.
- Built-in `/add` panel for custom search engines.
- Custom search engines with `%s` URL templates, editing, and deletion.

## Commands

Type a command and press Space to use that engine once, or type a command and search text together.

| Command | Action |
| --- | --- |
| `/g` | Google |
| `/b` | Baidu |
| `/bi` | Bing |
| `/gh` | GitHub |
| `/dg` | DuckDuckGo |
| `/dark` | Dark theme |
| `/light` | Light theme |
| `/help` | Open help |
| `/add` | Add custom search engines |

Slash text is still searchable. For example, `/b` + Enter searches `/b`; only `/b` + Space runs the command. Commands do not change or save the browser's default search engine.

## Custom Search Engines

Open `/add`, then add a command, name, and URL template. Use `%s` where the typed search text should go. If the protocol is omitted, SimpleSearch saves it with `https://`.

```text
Command: mdn
Name: MDN
URL: https://developer.mozilla.org/search?q=%s
```

Then use it like:

```text
/mdn array map
```

You can also type `/mdn`, press Space, then enter the search text. Use the edit button in settings to update a custom engine's name, URL, or flash color. Delete removes it from the local configuration.

## Browser Extension

SimpleSearch ships as a Manifest V3 new tab extension with the `search` permission so normal searches can use the browser's configured default search engine.
The extension uses Chrome's built-in `_locales` system, so Chrome/Edge will choose English or Simplified Chinese automatically from the browser language.

To load it in Chrome or Edge:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable developer mode.
3. Choose `Load unpacked`.
4. Select this project folder.

After loading, opening a new tab will show SimpleSearch.

To create a Chrome Web Store upload ZIP:

```powershell
npm run verify
npm run package:extension
```

Then upload:

```text
dist/SimpleSearch-1.0.2.zip
```

Store listing copy and privacy answers are in `docs/store-listing.md`. The privacy policy draft is in `PRIVACY.md`.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| Shift+Enter | Force search the current input |

## Project Structure

```text
SimpleSearch/
|-- .github/
|-- .editorconfig
|-- .gitignore
|-- LICENSE
|-- PRIVACY.md
|-- README.md
|-- index.html
|-- manifest.json
|-- package.json
|-- _locales/
|-- docs/
|-- styles.css
|-- favicon.svg
|-- icons/
|-- scripts/
|-- src/
|   |-- app.js
|   |-- commands.js
|   |-- config.js
|   |-- custom-engines.js
|   |-- i18n.js
|   |-- search.js
|   |-- storage.js
|   `-- url.js
`-- test/
    |-- commands.test.mjs
    |-- custom-engines.test.mjs
    |-- extension.test.mjs
    |-- i18n.test.mjs
    |-- search.test.mjs
    |-- source-text.test.mjs
    `-- url.test.mjs
```

## Development

The app is static and has no runtime dependencies. Because it uses ES modules, serve it through a local static server instead of opening `index.html` directly from disk.

```powershell
npx http-server . -p 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

Run tests:

```powershell
npm test
```

## License

SimpleSearch is licensed under the GNU General Public License v3.0 only. See `LICENSE` for details.
