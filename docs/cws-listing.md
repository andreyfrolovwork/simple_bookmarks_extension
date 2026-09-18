# Chrome Web Store listing — Bookmark Manager 1.1.0

Paste these fields into [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Privacy policy URL:

https://andreyfrolovwork.github.io/simple_bookmarks_extension/privacy.html

Package: `bookmark-manager.zip` (created by `npm run store:pack`, gitignored).

## Item

| Field | Value |
|---|---|
| Name | Bookmark Manager |
| Version | 1.1.0 |
| Category | Productivity |
| Language | English |
| Homepage | https://github.com/andreyfrolovwork/simple_bookmarks_extension |

## Short description (≤132 characters)

Visual new tab for bookmarks: folders, search, local click stats, and archive unused links.

## Detailed description

Bookmark Manager replaces the New Tab page with a visual board for your Chrome bookmarks.

Create, edit, move, and search bookmarks and folders without leaving the tab. Drag and drop items between folders. Switch light, dark, or auto theme.

Click stats stay on your computer. The extension records which bookmarks you open from this page and stores that history locally in IndexedDB. Use it to see what you actually use, then preview and archive unused bookmarks into an Archive folder.

Nothing is uploaded. Bookmark data never leaves Chrome. There is no account and no tracking of browsing history.

Features:

- New Tab board for Bookmarks Bar, Other Bookmarks, Mobile Bookmarks, and Archive
- Search across titles, URLs, and folder paths
- Drag-and-drop organization
- Local click statistics by period
- Slider to highlight unused bookmarks before you archive them
- Cmd/Ctrl+click to archive a bookmark or folder

## What's new in 1.1.0

- Local click stats for bookmarks opened from this manager
- Unused-archive slider on the top bar: preview highlighted items, then archive them
- Dedicated Archive tab (folder under Other Bookmarks)
- Privacy policy updated for local IndexedDB click history

## Single purpose

This extension is a bookmark manager. It displays and organizes the user's bookmarks on the New Tab page.

## Permission justification

**bookmarks** — Required to read and update the user's bookmark tree: show folders, create and edit items, move them, search them, and archive unused bookmarks. The extension does not send bookmark data off the device.

No other permissions. Click history uses IndexedDB in the extension page and does not need the `storage` permission or access to Chrome browsing history.

## Host permission justification

None. The extension has no host permissions and does not make network requests.

## Remote code

None. All scripts ship inside the package.

## Data use / privacy practices

- Bookmarks: accessed locally via Chrome Bookmarks API; not collected by the developer
- Click events (bookmark id, title, URL, timestamp): stored only in IndexedDB on the device
- Theme preference: localStorage
- No personal data sold, no analytics, no third-party servers

## Assets already in the repo

- `screenshot-1-dark.jpg` — 1280×800
- `screenshot-2-light.jpg` — 1280×800
- `promo-440x280.png` — small promo tile
- `public/icons/icon128.png` — store icon

Optional before submit: replace screenshots with 1280×800 shots of the Archive tab, unused-archive slider, and click-stats panel.

## Submit checklist

Automated (after GitHub secrets, see `docs/cws-automation.md`):

```bash
git tag v1.1.0
git push origin v1.1.0
```

That uploads a draft. Then in Dev Console confirm listing text, privacy URL, and screenshots, and submit if the Action did not run with **publish**.

Manual fallback:

1. `npm run store:pack`
2. Dashboard → Bookmark Manager → Upload new package → `bookmark-manager.zip`
3. Paste short / detailed / what's new text above
4. Confirm privacy URL is live
5. Confirm permission justification still matches `bookmarks` only
6. Submit for review
