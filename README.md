# Bookmark Manager

Chrome extension for managing bookmarks with convenient visualization.

## Install Dependencies

```bash
npm install
```

## Development

### Option 1: Web Development Mode
Run in development mode with test data and hot reload:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Option 2: Extension Development Mode (Recommended)
Auto-rebuild to `dist/` folder on file changes:

```bash
npm run dev:extension
```

This will watch for changes and automatically rebuild the extension in the `dist/` folder. Then:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist/` folder
4. The extension will auto-update when files change (you may need to click the reload button in Chrome)

### Option 3: Manual Build Watch
```bash
npm run build:watch
```

Same as `dev:extension` but without development optimizations.

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
