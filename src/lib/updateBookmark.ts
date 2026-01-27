// Утилита для обновления закладок и папок через Chrome API

export async function updateBookmark(
	id: string,
	changes: { title?: string; url?: string }
): Promise<void> {
	if (!chrome.bookmarks) {
		throw new Error('Chrome Bookmarks API недоступен');
	}

	return new Promise((resolve, reject) => {
		chrome.bookmarks.update(id, changes, (result) => {
			if (chrome.runtime.lastError) {
				console.error('❌ Update API:', chrome.runtime.lastError);
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				console.log(`✅ Обновлено: ${changes.title || changes.url}`);
				resolve();
			}
		});
	});
}
