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

Type naturally to search, or use slash commands to switch engines before searching. It supports Google, Baidu, Bing, GitHub, DuckDuckGo, direct URL navigation, custom search engines, English/Chinese automatic language switching, and a clean terminal-style interface.

No accounts. No background scripts. No requested permissions. No remote code.
```

Category: Productivity

Language: English, Chinese (Simplified)

## Privacy Tab

Single purpose:

```text
Replace the new tab page with a minimalist keyboard-first search launcher that supports search commands and custom search engines.
```

Permissions justification:

```text
SimpleSearch does not request any extension permissions or host permissions.
```

Remote code:

```text
No. SimpleSearch does not load or execute remotely hosted code.
```

Data usage:

```text
SimpleSearch does not collect, sell, share, transmit, or upload personal data. Settings and custom search engines are stored locally on the user's device. Search queries are sent only to the selected search engine or custom URL when the user submits a search.
```

Privacy policy URL:

```text
Use the published URL for PRIVACY.md after the repository or website is public.
```

## Test Instructions

```text
Open a new tab. Type a search query and press Enter. Type /help then Space to open help. Type /add then Space to open custom search engine settings. Type /g, /b, /bi, /gh, or /dg followed by Space to switch search engines.
```

## Required Store Assets

- Extension ZIP: `dist/SimpleSearch-1.0.0.zip`
- Extension icon: included in the ZIP at `icons/icon-128.png`
- Screenshot: start with `store-assets/screenshot-new-tab-1280x800.png` and replace with a real Chrome screenshot before final submission if the UI changes.
- Small promotional image: `store-assets/promo-small-440x280.png`
