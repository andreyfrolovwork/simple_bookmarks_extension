# Bookmark Manager

Chrome-расширение для управления закладками с удобной визуализацией. Работает как New Tab страница.

---

## Быстрый старт для нового диалога

**Если ты AI/разработчик и начинаешь работу в новом чате — прочитай этот раздел:**

1. **Стек:** Svelte 5 + TypeScript + Vite + Tailwind CSS + Chrome Extension API
2. **Режимы:** `DEV` (`npm run dev`) — тестовые данные, `PRODUCTION` (расширение) — Chrome Bookmarks API
3. **Архитектура:** App → BookmarksBar → BookmarkFolder → Bookmark (рекурсия папок)
4. **Сторы:** `themeStore`, `modalStore`, `searchStore`, `dragStore`, `archiveModeStore`, `archivePreviewStore` (см. раздел «Архитектура»)
5. **Chrome API:** `loadBookmarks.ts`, `createBookmark.ts`, `updateBookmark.ts`, `deleteBookmark.ts`, `moveBookmark.ts`, `archiveBookmark.ts`
6. **Стиль:** пиксель-арт UI, CSS-переменные для light/dark темы в `app.css`
7. **Архив:** ⌘+click или слайдер unused-archive → папка `archive` (вкладка Archive); клики считаются локально в IndexedDB

---

## Установка и запуск

```bash
npm install
```

### Режим разработки (Web)

```bash
npm run dev
```

Открой http://localhost:5173 — используются тестовые данные из `src/lib/initBookmarks.ts`.

### Режим расширения (рекомендуется для теста Chrome API)

```bash
npm run dev:extension
```

Сборка в `dist/` с watch. Далее:
1. `chrome://extensions/` → Включить «Режим разработчика»
2. «Загрузить распакованное» → выбрать папку `dist/`

### Production-сборка

```bash
npm run build
```

Архив для публикации:
```bash
npm run pack
```
Создаётся `bookmark-manager.zip` из содержимого `dist/`.

---

## Структура проекта

```
src/
├── App.svelte              # Корень: загрузка закладок, theme init, Modal
├── main.ts                 # Точка входа
├── app.css                 # Tailwind + CSS-переменные темы + пиксель-стили
├── types.ts                # BookmarkItem, FolderType
├── chrome.d.ts             # Типы Chrome API
└── lib/
    ├── BookmarksBar.svelte     # Вкладки (Bar/Other/Mobile) + SearchBar + ThemeToggle + empty state
    ├── BookmarkFolder.svelte   # Рекурсивный рендер папок, drag-drop, CRUD
    ├── Bookmark.svelte         # Одна закладка (favicon, edit, delete, drag-drop)
    ├── SearchBar.svelte        # Поле поиска
    ├── SearchResults.svelte    # Overlay результатов поиска
    ├── Modal.svelte            # Универсальные модалки (prompt, confirm, alert, bookmark)
    ├── ThemeToggle.svelte      # Переключатель light/dark/auto
    ├── Icon.svelte             # Иконки (pixelarticons)
    ├── icons.ts               # Mapping имён иконок
    ├── loadBookmarks.ts        # Загрузка: DEV → initBookmarks, PROD → Chrome API
    ├── initBookmarks.ts        # Тестовые данные
    ├── flattenBookmarks.ts     # Дерево → плоский массив для поиска
    ├── createBookmark.ts       # chrome.bookmarks.create
    ├── updateBookmark.ts       # chrome.bookmarks.update
    ├── deleteBookmark.ts       # chrome.bookmarks.remove / removeTree
    ├── moveBookmark.ts         # chrome.bookmarks.move
    ├── archiveBookmark.ts      # перемещение в папку archive (Other Bookmarks), Cmd+click
    ├── archiveModeStore.ts     # состояние ⌘, initArchiveModeStore в App
    ├── dragStore.ts            # Состояние перетаскивания (Svelte store)
    ├── themeStore.svelte.ts    # Svelte 5 store: theme, resolvedTheme, localStorage
    ├── modalStore.svelte.ts    # Svelte 5 store: prompt, confirm, alert, bookmarkPrompt
    └── searchStore.svelte.ts   # Svelte 5 store + Fuse.js поиск по title/url/path

public/
├── manifest.json           # Manifest v3, permissions: bookmarks, chrome_url_overrides newtab
├── background.js           # Service worker: action click, bookmark events (логирование)
├── icon.svg, icon-simple.svg
└── icons/                  # icon16.png, icon48.png, icon128.png (для Chrome Web Store)

docs/
└── privacy.html            # Privacy Policy для Web Store
```

---

## Архитектура

### Поток данных

1. **App.svelte** — `onMount` вызывает `loadBookmarks()` и `themeStore.init()`.
2. **loadBookmarks.ts** — `import.meta.env.DEV`: возвращает `INIT_BOOKMARKS`, иначе `chrome.bookmarks.getTree()` (fallback на initBookmarks при ошибке).
3. **BookmarksBar** — получает `bookmarks`, `onDelete`, `onMove`; перезагрузка через `reloadBookmarks()` в App.
4. **Поиск** — `flattenBookmarks` → `FlatBookmark[]` → `searchStore.setBookmarks`; Fuse.js ищет по title, url, path.

### Сторы

| Store        | Тип            | Назначение                                              |
|--------------|----------------|---------------------------------------------------------|
| themeStore   | Svelte 5 class | light/dark/auto, localStorage, `document.documentElement.classList` |
| modalStore   | Svelte 5 class | prompt, confirm, alert, bookmarkPrompt, bookmarkEditPrompt |
| searchStore  | Svelte 5 class | query, results, isActive, Fuse.js                       |
| dragStore    | writable       | item, parentId для drag-and-drop                        |
| archiveModeStore | writable    | true при зажатом ⌘ — показ иконки архива, Cmd+click архивирует |

### Chrome API

- `bookmarks` — единственный permission в manifest.
- Все вызовы обёрнуты в `createBookmark`, `updateBookmark`, `deleteBookmark`, `moveBookmark`.
- В DEV-режиме Chrome API недоступен — используется `initBookmarks.ts`.

### Темы

- CSS-переменные в `:root` (light) и `.dark` в `app.css`.
- `themeStore` переключает класс `dark` на `document.documentElement`.

---

## Типы

```ts
// src/types.ts
interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkItem[];
  dateAdded?: number;
  dateGroupModified?: number;
  dateLastUsed?: number;
  index?: number;
  parentId?: string;
  syncing?: boolean;
  folderType?: 'bookmarks-bar' | 'other' | 'mobile';
}

type FolderType = 'bookmarks-bar' | 'other' | 'mobile';
```

---

## Манифест расширения

- **manifest_version:** 3
- **permissions:** `bookmarks`
- **chrome_url_overrides:** `newtab` → `index.html`
- **action:** открывает `index.html` в новой вкладке (через `background.js`)

---

## Конфигурация

- **Vite** (`vite.config.ts`): build в `dist/`, watch `src/**` и `public/**`, в dev — без minify, с sourcemap.
- **Tailwind** (`tailwind.config.js`): `darkMode: 'class'`, pixel-шрифты и тени.
- **Svelte** (`svelte.config.js`): `vitePreprocess()`.

---

## Чек-лист для новой фичи

1. Определи, затрагивает ли фича Chrome API — если да, учти ограничения в DEV.
2. Следуй существующему стилю: пиксель-UI, CSS-переменные, ранние return.
3. Используй `modalStore` для ввода пользователя (prompt, confirm, bookmark).
4. При изменении закладок вызывай `onDelete`/`onMove` для перезагрузки дерева.
5. Для поиска — обновляй `searchStore` при изменении `bookmarks` (уже в `$effect` в BookmarksBar).
6. Проверь `npm run check` и линтер.

---

## Cursor-команды (если есть)

- `groom` — планирование, декомпозиция задач, без кода
- `implement` — реализация по плану, одна задача за раз
- `release-branch` — ветка релиза
- `axioms` — аксиомы проекта

---

## Публикация в Chrome Web Store

Версия **1.1.0**. Тексты для Dev Console — в `docs/cws-listing.md`.

Privacy policy: https://andreyfrolovwork.github.io/simple_bookmarks_extension/privacy.html

```bash
npm run store:pack
```

Создаётся gitignored `bookmark-manager.zip`. Загрузить в [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), вставить What's new из `docs/cws-listing.md`, отправить на review.

Assets: `screenshot-1-dark.jpg`, `screenshot-2-light.jpg` (1280×800), `promo-440x280.png`.

---

## Зависимости

- **runtime:** `fuse.js` (поиск), `pixelarticons` (иконки)
- **dev:** Svelte 5, Vite 7, Tailwind, TypeScript, svelte-check

---

## Связанные документы

- `QUICKSTART.md` — краткая установка
- `SETUP.md` — детальная настройка
- `MIGRATION_COMPLETE.md` — что перенесено с SvelteKit
