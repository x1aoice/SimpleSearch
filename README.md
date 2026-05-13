# SimpleSearch

SimpleSearch is a minimalist desktop search launcher. It keeps the page quiet: type, press Enter, and move on.

## Features

- Multi-engine search with slash commands.
- Direct URL, domain, IP, and localhost navigation.
- `Shift+Enter` to force search when an IP or domain should be searched instead of opened.
- Inline calculator for simple arithmetic.
- System, light, and dark themes.
- Built-in `/help` panel.
- Built-in `/settings` panel for default engine and theme.
- Custom search engines with `%s` URL templates, editing, and deletion.

## Commands

Type a command and press Space.

| Command | Action |
| --- | --- |
| `/g` | Google |
| `/b` | Baidu |
| `/bi` | Bing |
| `/gh` | GitHub |
| `/v` | Bilibili |
| `/z` | Zhihu |
| `/y` | YouTube |
| `/dark` | Dark theme |
| `/light` | Light theme |
| `/help` | Open help |
| `/settings` | Open settings |
| `/set` | Open settings |

Slash text is still searchable. For example, `/b` + Enter searches `/b`; only `/b` + Space runs the command.

## Custom Search Engines

Open `/settings`, then add a command, name, and URL template. The URL must include `%s`. If the protocol is omitted, SimpleSearch saves it with `https://`.

```text
Command: mdn
Name: MDN
URL: https://developer.mozilla.org/search?q=%s
```

Then use it like:

```text
/mdn array map
```

Use the edit button in settings to update a custom engine's name or URL. Delete removes it from the local configuration.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| Enter | Search or open a detected URL/IP |
| Shift+Enter | Force search the current input |
| Tab | Accept a calculator result |
| Esc | Clear input or close help |

## Project Structure

```text
SimpleSearch/
├─ index.html
├─ styles.css
├─ favicon.svg
├─ src/
│  ├─ app.js
│  ├─ calculator.js
│  ├─ commands.js
│  ├─ config.js
│  ├─ storage.js
│  └─ url.js
└─ test/
   ├─ calculator.test.mjs
   ├─ commands.test.mjs
   ├─ custom-engines.test.mjs
   └─ url.test.mjs
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
