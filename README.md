# Менеджер закладок

Chrome расширение для управления закладками с удобной визуализацией.

## Установка зависимостей

```bash
npm install
```

## Разработка

Запуск в режиме разработки с тестовыми данными:

```bash
npm run dev
```

Откройте http://localhost:5173 в браузере.

## Сборка расширения

```bash
npm run build
```

Собранное расширение будет в папке `dist/`.

## Установка в Chrome

1. Соберите проект: `npm run build`
2. Откройте Chrome и перейдите на `chrome://extensions/`
3. Включите "Режим разработчика" (Developer mode)
4. Нажмите "Загрузить распакованное расширение" (Load unpacked)
5. Выберите папку `dist/`

## Структура проекта

- `src/` - исходный код
  - `lib/` - компоненты и логика
    - `Bookmark.svelte` - компонент закладки
    - `BookmarkFolder.svelte` - компонент папки с закладками
    - `BookmarksBar.svelte` - главный компонент с вкладками
    - `loadBookmarks.ts` - загрузка закладок из Chrome API
    - `initBookmarks.ts` - тестовые данные для разработки
  - `types.ts` - типы TypeScript
  - `chrome.d.ts` - типы Chrome Extension API
  - `App.svelte` - главный компонент приложения
  - `main.ts` - точка входа

- `public/` - статические файлы
  - `manifest.json` - манифест Chrome расширения
  - `background.js` - background service worker

## Возможности

- Визуализация закладок в удобном интерфейсе
- Поддержка вложенных папок
- Три вкладки: Панель закладок, Другие закладки, Мобильные закладки
- Отображение фавиконов сайтов
- Автоматическая загрузка из Chrome Bookmarks API

## Технологии

- Svelte 5
- TypeScript
- Vite
- Tailwind CSS
- Chrome Extension API
