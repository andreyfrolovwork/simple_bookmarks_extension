export async function deleteBookmark(id: string, isFolder: boolean = false): Promise<void> {
	try {
		if (isFolder) {
			// Для папок используем removeTree (удаляет папку и всё содержимое)
			await chrome.bookmarks.removeTree(id);
		} else {
			// Для отдельных закладок используем remove
			await chrome.bookmarks.remove(id);
		}
	} catch (error) {
		console.error('Ошибка при удалении закладки:', error);
		throw error;
	}
}

