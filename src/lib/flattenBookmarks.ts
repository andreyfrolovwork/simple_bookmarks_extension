import type { BookmarkItem } from '../types';
import type { FlatBookmark } from './searchStore.svelte';

/**
 * Рекурсивно преобразует дерево закладок в плоский массив
 * с добавлением пути к родительским папкам
 */
export function flattenBookmarks(
	bookmarks: BookmarkItem[],
	parentPath: string = ''
): FlatBookmark[] {
	const result: FlatBookmark[] = [];

	for (const bookmark of bookmarks) {
		// Формируем путь для текущего элемента
		const currentPath = parentPath 
			? `${parentPath} > ${bookmark.title}` 
			: bookmark.title;

		// Если это закладка (есть URL), добавляем в результат
		if (bookmark.url) {
			result.push({
				id: bookmark.id,
				title: bookmark.title,
				url: bookmark.url,
				path: parentPath, // Путь без самой закладки
				dateAdded: bookmark.dateAdded
			});
		}

		// Если есть дочерние элементы, рекурсивно обрабатываем их
		if (bookmark.children && bookmark.children.length > 0) {
			const childResults = flattenBookmarks(
				bookmark.children,
				bookmark.url ? parentPath : currentPath // Если это закладка, не добавляем в путь
			);
			result.push(...childResults);
		}
	}

	return result;
}

/**
 * Подготавливает данные закладок для поиска
 * Фильтрует системные папки и оставляет только закладки с URL
 */
export function prepareBookmarksForSearch(bookmarks: BookmarkItem[]): FlatBookmark[] {
	if (!bookmarks || bookmarks.length === 0) {
		return [];
	}

	// Начинаем с корневого элемента (обычно это bookmarks[0])
	const root = bookmarks[0];
	if (!root || !root.children) {
		return [];
	}

	return flattenBookmarks(root.children);
}
