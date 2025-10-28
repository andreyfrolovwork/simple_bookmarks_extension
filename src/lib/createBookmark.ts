// Утилита для создания закладок и папок через Chrome API

export async function createBookmark(
	parentId: string,
	title: string,
	url?: string,
	index?: number
): Promise<void> {
	if (!chrome.bookmarks) {
		throw new Error('Chrome Bookmarks API недоступен');
	}

	return new Promise((resolve, reject) => {
		const details: chrome.bookmarks.CreateDetails = {
			parentId,
			title,
			index
		};

		// Если есть URL, это закладка, иначе папка
		if (url) {
			details.url = url;
		}

		chrome.bookmarks.create(details, (result) => {
			if (chrome.runtime.lastError) {
				console.error('❌ Create API:', chrome.runtime.lastError);
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				console.log(`✅ Создано: ${title}`);
				resolve();
			}
		});
	});
}

