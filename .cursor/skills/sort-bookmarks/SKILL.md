---
name: sort-bookmarks
description: >-
  Sorts Chrome bookmarks into a folder by a user query (URL/title substring),
  skipping the archive folder. Use when the user asks to разобрать / отсортировать /
  разложить закладки, сложить ссылки в папку, или mentioned Grafana, GitLab,
  domain, or similar bookmark-organization requests.
---

# Разбор закладок по запросу

Не меняй `src/`, `public/`, `manifest.json`. Хелпер живёт только в этом скилле, в `dist/` копируется на один запуск и сразу удаляется.

## Запрос пользователя → параметры

| Что сказал пользователь | `match` | `folder` | `parent` |
|---|---|---|---|
| ссылки на grafana не в архиве → папка grafana | `grafana` | `grafana` | bar (`1`) |
| gitlab / git.cointocoin.io → GitLab | домен или `gitlab` | как попросил | bar, если не сказал иное |
| сложить в Other Bookmarks | — | — | `other` (`2`) |

По умолчанию: только **ссылки** (не папки), пропускать дерево папки **`archive`**, целевая папка на **панели закладок**.

Уточняй папку и match, только если из фразы неясно. Не спрашивай лишнего.

## Запуск

1. Скопируй хелперы в распакованное расширение:

```bash
cp .cursor/skills/sort-bookmarks/scripts/sort-bookmarks.html dist/
cp .cursor/skills/sort-bookmarks/scripts/sort-bookmarks.js dist/
```

Vite watch может стереть лишние файлы в `dist/`. Копируй и сразу открывай вкладку.

2. ID распакованного Bookmark Manager: `lpjibmjfehcjbhommbgemhlmclcicldo` (если сменился — смотри `chrome://extensions`, Developer mode). Страница:

`chrome-extension://<ID>/sort-bookmarks.html?match=<q>&folder=<name>`

Опции: `&parent=other`, `&skipArchive=0`, `&dry=1` (только посчитать).

3. Открой в **Google Chrome** (не Cursor browser):

```bash
osascript <<'APPLESCRIPT'
tell application "Google Chrome"
  activate
  tell front window
    make new tab with properties {URL:"chrome-extension://lpjibmjfehcjbhommbgemhlmclcicldo/sort-bookmarks.html?match=QUERY&folder=FOLDER"}
  end tell
end tell
APPLESCRIPT
```

4. Полли заголовок вкладки (2–15 с), пока не будет:
   - `Bookmarks sorted <moved> <skipped> <junk>`
   - или `Bookmarks sort failed: …`

AppleScript `execute javascript` в Chrome выключен — не используй. Заголовок `chrome-extension://…` как title = страница не загрузилась (часто 404 после wipe `dist/`). Скопируй файлы ещё раз и обнови URL (`?t=`).

5. Сразу удали хелперы:

```bash
rm -f dist/sort-bookmarks.html dist/sort-bookmarks.js
```

Не оставляй `sort-*.html/js` в `dist/`, `public/`, git. `npm run pack:all` для этого не нужен.

## Правила разбора

- Match: подстрока в `title + url`, без учёта регистра.
- Не трогать потомков папки с title `archive`.
- Найти существующую папку с нужным title вне архива; иначе `create({ parentId: '1', title })`.
- Уже лежащие в целевой папке — `skipped`.
- Удалять служебный мусор прошлых прогонов: title `__grafana_sort_result__` / `__bookmarks_sort_result__`, URL `grafana.local/sort-result`.
- Не создавать закладки-отчёты.

## Ответ пользователю

По-русски, коротко: сколько перенесено, сколько уже было в папке, что пропущено (архив). Без рекапа скилла и без предложения закоммитить хелперы.
