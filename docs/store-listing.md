# Chrome Web Store Listing Draft

## Listing

Name: SimpleSearch

Short description:

```text
A clean, keyboard-first new tab search launcher with a terminal feel.
```

Detailed description:

```text
SimpleSearch gives your new tab page a clean terminal-style search box. Type a query to search, or type /help and press Space to see all commands. No accounts, no background scripts, no remote code.
```

## Chinese Listing

Name: SimpleSearch

Short description:

```text
终端风格的极简新标签页搜索启动器。
```

Detailed description:

```text
SimpleSearch 让新标签页保持干净、轻量。输入 /help 再按空格，可以查看所有命令和用法。
```

Category: Productivity

Language: English, Chinese (Simplified)

## Privacy Tab

Single purpose:

```text
Replace the new tab page with a clean keyboard-first search launcher that supports search commands and custom search engines.
```

Permissions justification:

```text
SimpleSearch requests the search permission only to submit normal searches through Chrome Search API with the user's configured default search engine. It does not request host permissions.
```

Remote code:

```text
No. SimpleSearch does not load or execute remotely hosted code.
```

Data usage:

```text
SimpleSearch does not collect, sell, share, transmit, or upload personal data. Settings and custom search engines are stored locally on the user's device. Normal searches use Chrome Search API with the browser's configured default search engine. Explicit slash-command searches navigate only to the selected search engine or custom URL when the user submits a search.
```

Privacy policy URL:

```text
Use the published URL for PRIVACY.md after the repository or website is public.
```

## Test Instructions

```text
Open a new tab. Type a search query and press Enter to search with the browser's default search engine. Type /help then Space to open help. Type /add then Space to open custom search engine settings. Type /g, /b, /bi, /gh, or /dg followed by Space to use that engine for the next search only. Commands do not change Chrome's default search engine.
```

## Required Store Assets

- Extension ZIP: `dist/SimpleSearch-1.0.2.zip`
- Extension icon: included in the ZIP at `icons/icon-128.png`
- Screenshot: start with `store-assets/screenshot-new-tab-1280x800.png` and replace with a real Chrome screenshot before final submission if the UI changes.
- Small promotional image: `store-assets/promo-small-440x280.png`
