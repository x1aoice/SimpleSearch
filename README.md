# SimpleSearch

SimpleSearch is a minimalist desktop search launcher. It keeps the page quiet: type, press Enter, and move on.

## Features

- Multi-engine search with slash commands.
- Direct URL, domain, IP, and localhost navigation.
- `Shift+Enter` to force search when an IP or domain should be searched instead of opened.
- Inline calculator for simple arithmetic.
- Persistent local search history with Up / Down navigation.
- Light and dark themes.
- Built-in `/help` panel.

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
| `/clear` | Clear local search history |

Slash text is still searchable. For example, `/b` + Enter searches `/b`; only `/b` + Space runs the command.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| Enter | Search or open a detected URL/IP |
| Shift+Enter | Force search the current input |
| Tab | Accept a calculator result |
| Up / Down | Browse local search history |
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
│  ├─ history.js
│  ├─ storage.js
│  └─ url.js
└─ test/
   ├─ calculator.test.mjs
   ├─ commands.test.mjs
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
