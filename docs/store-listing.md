# Chrome Web Store Listing Draft

## Listing

Name: SimpleSearch

Short description:

```text
A minimalist terminal-style search launcher for your new tab page.
```

Detailed description:

```text
SimpleSearch replaces your new tab page with a fast, keyboard-first search launcher.

Type naturally to search with the default search provider selected in Chrome, or use slash prefixes for one-off searches in Google, Baidu, Bing, GitHub, DuckDuckGo, and custom search engines. SimpleSearch also supports direct URL navigation, English/Chinese automatic language switching, and a clean terminal-style interface.

No accounts. No background scripts. No host permissions. No remote code.
```

Category: Productivity

Language: English, Chinese (Simplified)

## Privacy Tab

Single purpose:

```text
Replace the new tab page with a minimalist keyboard-first search launcher that uses Chrome's default search provider for normal searches and supports explicit slash-prefix searches.
```

Permissions justification:

```text
The `search` permission is used to run normal new-tab searches through Chrome's default search provider via the Chrome Search API. SimpleSearch does not request host permissions.
```

Remote code:

```text
No. SimpleSearch does not load or execute remotely hosted code.
```

Data usage:

```text
SimpleSearch does not collect, sell, share, transmit, or upload personal data. Settings and custom search engines are stored locally on the user's device. Normal searches use the user's Chrome default search provider through the Chrome Search API. Explicit slash-prefix searches are sent only to the selected search engine or custom URL when the user submits a search.
```

Privacy policy URL:

```text
Use the published URL for PRIVACY.md after the repository or website is public.
```

## Test Instructions

```text
Open a new tab. Type a search query and press Enter to search with Chrome's default search provider. Type /help then Space to open help. Type /add then Space to open custom search engine settings. Type /g cats, /b cats, /bi cats, /gh cats, or /dg cats and press Enter to run a one-off engine search.
```

## Required Store Assets

- Extension ZIP: `dist/SimpleSearch-1.0.2.zip`
- Extension icon: included in the ZIP at `icons/icon-128.png`
- Screenshot: start with `store-assets/screenshot-new-tab-1280x800.png` and replace with a real Chrome screenshot before final submission if the UI changes.
- Small promotional image: `store-assets/promo-small-440x280.png`
