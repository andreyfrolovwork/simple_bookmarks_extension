import type { BookmarkItem } from '../types';
import INIT_BOOKMARKS from './initBookmarks';

// Флаг режима разработки
const DEV_MODE = import.meta.env.DEV;

/**
 * Загружает закладки из браузера через Chrome API
 */
async function getBookmarksFromBrowser(): Promise<BookmarkItem[]> {
	if (typeof chrome === 'undefined' || !chrome.bookmarks) {
		console.warn('Chrome bookmarks API недоступен');
		return [];
	}

	return new Promise((resolve) => {
		chrome.bookmarks.getTree((tree) => {
			console.log('Закладки загружены из браузера:', tree);
			resolve(tree as BookmarkItem[]);
		});
	});
}

/**
 * Главная функция загрузки закладок
 * В dev режиме - из initBookmarks.ts
 * В production - из браузера через Chrome API
 */
export async function loadBookmarks(): Promise<BookmarkItem[]> {
	console.log('Режим загрузки закладок:', DEV_MODE ? 'DEV (initBookmarks)' : 'PRODUCTION (Chrome API)');

	if (DEV_MODE) {
		// Dev режим - загружаем тестовые данные
		console.log('Загрузка закладок из initBookmarks');
		return INIT_BOOKMARKS;
	} else {
		// Production режим - загружаем из браузера
		console.log('Загрузка закладок из Chrome API');
		try {
			const bookmarks = await getBookmarksFromBrowser();
			if (bookmarks.length === 0) {
				console.warn('Закладки из браузера пусты, используем fallback');
				return INIT_BOOKMARKS;
			}
			return bookmarks;
		} catch (error) {
			console.error('Ошибка загрузки закладок из браузера:', error);
			console.log('Используем fallback на initBookmarks');
			return INIT_BOOKMARKS;
		}
	}
}

/**
 * Проверяет доступность Chrome API
 */
export function isChromeExtensionContext(): boolean {
	return typeof chrome !== 'undefined' && !!chrome.bookmarks;
}

