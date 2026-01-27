# Bookmark Manager

Chrome extension for managing bookmarks with convenient visualization.

## Install Dependencies

```bash
npm install
```

## Development

Run in development mode with test data:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Build Extension

```bash
npm run build
```

The built extension will be in the `dist/` folder.

## Install in Chrome

1. Build the project: `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder

## Project Structure

- `src/` - source code
  - `lib/` - components and logic
    - `Bookmark.svelte` - bookmark component
    - `BookmarkFolder.svelte` - folder with bookmarks component
    - `BookmarksBar.svelte` - main component with tabs
    - `loadBookmarks.ts` - loading bookmarks from Chrome API
    - `initBookmarks.ts` - test data for development
  - `types.ts` - TypeScript types
  - `chrome.d.ts` - Chrome Extension API types
  - `App.svelte` - main application component
  - `main.ts` - entry point

- `public/` - static files
  - `manifest.json` - Chrome extension manifest
  - `background.js` - background service worker

## Features

- Bookmark visualization in a convenient interface
- Nested folder support
- Three tabs: Bookmarks Bar, Other Bookmarks, Mobile Bookmarks
- Display site favicons
- Automatic loading from Chrome Bookmarks API
- Drag and drop to organize bookmarks
- Create and delete bookmarks and folders

## Technologies

- Svelte 5
- TypeScript
- Vite
- Tailwind CSS
- Chrome Extension API
