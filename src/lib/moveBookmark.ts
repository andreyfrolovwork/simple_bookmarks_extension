// Утилита для перемещения закладок через Chrome API

export async function moveBookmark(
	bookmarkId: string,
	destination: { parentId?: string; index?: number }
): Promise<void> {
	if (!chrome.bookmarks) {
		throw new Error('Chrome Bookmarks API недоступен');
	}

	return new Promise((resolve, reject) => {
		chrome.bookmarks.move(bookmarkId, destination, (result) => {
			if (chrome.runtime.lastError) {
				console.error('❌ Move API:', chrome.runtime.lastError);
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				resolve();
			}
		});
	});
}

