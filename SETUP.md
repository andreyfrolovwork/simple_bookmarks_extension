# Инструкция по настройке

## Шаг 1: Установка зависимостей

Перейдите в папку проекта и установите зависимости:

```bash
cd vitejs-vite-jbzr2frp
npm install
```

## Шаг 2: Запуск в режиме разработки

Для тестирования в браузере с тестовыми данными:

```bash
npm run dev
```

Откройте http://localhost:5173 - приложение будет использовать тестовые данные из `src/lib/initBookmarks.ts`.

## Шаг 3: Сборка расширения для Chrome

Для создания production версии расширения:

```bash
npm run build
```

После сборки все файлы будут в папке `dist/`.

## Шаг 4: Установка расширения в Chrome

1. Откройте Chrome
2. Перейдите на страницу `chrome://extensions/`
3. Включите "Режим разработчика" (Developer mode) в правом верхнем углу
4. Нажмите кнопку "Загрузить распакованное расширение" (Load unpacked)
5. Выберите папку `dist/` из проекта
6. Расширение установлено! Кликните на иконку расширения в панели Chrome

## Что перенесено

✅ Все компоненты закладок (Bookmark, BookmarkFolder, BookmarksBar)
✅ Логика загрузки закладок (loadBookmarks.ts)
✅ Типы TypeScript (types.ts, chrome.d.ts)
✅ Манифест расширения (manifest.json)
✅ Background worker (background.js)
✅ Стили Tailwind CSS
✅ Тестовые данные для разработки

## Режимы работы

### Режим разработки (DEV)
- Запускается через `npm run dev`
- Использует тестовые данные из `initBookmarks.ts`
- Hot Module Replacement (HMR) для быстрой разработки

### Production режим
- Собирается через `npm run build`
- Работает как Chrome расширение
- Загружает реальные закладки через Chrome Bookmarks API

