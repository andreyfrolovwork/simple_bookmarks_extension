// Утилита для архивирования закладок — перемещение в папку archive (Other Bookmarks)

import { moveBookmark } from './moveBookmark';

const ARCHIVE_FOLDER_TITLE = 'archive';

/**
 * Находит или создаёт папку archive в Other Bookmarks.
 * Other Bookmarks — второй ребёнок корня (индекс 1) по спецификации Chrome.
 */
async function getOrCreateArchiveFolder(): Promise<string | null> {
	if (typeof chrome === 'undefined' || !chrome.bookmarks) {
		return null;
	}

	const tree = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve) => {
		chrome.bookmarks.getTree((results) => resolve(results));
	});

	const root = tree[0];
	if (!root?.children || root.children.length < 2) {
		return null;
	}

	// Other Bookmarks — индекс 1 (0=Bookmarks Bar, 1=Other Bookmarks, 2=Mobile Bookmarks)
	const otherBookmarks = root.children[1];
	if (!otherBookmarks?.id || otherBookmarks.url) {
		return null;
	}

	// Подгружаем children, т.к. getTree может не включать их для вложенных папок
	const otherSubTree = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve) => {
		chrome.bookmarks.getSubTree(otherBookmarks.id, (results) => resolve(results));
	});

	const children = otherSubTree[0]?.children || [];
	const existingArchive = children.find(
		(c) => c.title === ARCHIVE_FOLDER_TITLE && !c.url
	);

	if (existingArchive) {
		return existingArchive.id;
	}

	const newFolder = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
		chrome.bookmarks.create(
			{ parentId: otherBookmarks.id, title: ARCHIVE_FOLDER_TITLE },
			(result) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError?.message));
				} else {
					resolve(result);
				}
			}
		);
	});

	return newFolder.id;
}

/**
 * Перемещает закладку или папку в archive (Other Bookmarks).
 */
export async function archiveBookmark(itemId: string): Promise<void> {
	const archiveId = await getOrCreateArchiveFolder();
	if (!archiveId) {
		throw new Error('Failed to get or create archive folder');
	}

	await moveBookmark(itemId, { parentId: archiveId, index: 0 });
}
