// Утилита для архивирования закладок — перемещение в папку archive (Other Bookmarks)

import { moveBookmark } from './moveBookmark';
import type { BookmarkItem } from '../types';

export const ARCHIVE_FOLDER_TITLE = 'archive';

/**
 * Находит папку archive в дереве (Other Bookmarks → archive).
 */
export function findArchiveFolder(tree: BookmarkItem[]): BookmarkItem | undefined {
	const root = tree[0];
	const other = root?.children?.find((folder) => folder.folderType === 'other')
		?? root?.children?.[1];
	return other?.children?.find(
		(child) => child.title === ARCHIVE_FOLDER_TITLE && !child.url
	);
}

/**
 * Other Bookmarks без папки archive — она показывается отдельной вкладкой.
 */
export function withoutArchiveFolder(folder: BookmarkItem | undefined): BookmarkItem | undefined {
	if (!folder) return folder;
	return {
		...folder,
		children: (folder.children ?? []).filter(
			(child) => child.title !== ARCHIVE_FOLDER_TITLE || Boolean(child.url)
		)
	};
}

/**
 * Находит или создаёт папку archive в Other Bookmarks.
 * Other Bookmarks — второй ребёнок корня (индекс 1) по спецификации Chrome.
 */
export async function getOrCreateArchiveFolder(): Promise<string | null> {
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

/**
 * Перемещает несколько закладок в archive, создавая папку при необходимости.
 */
export async function archiveMany(itemIds: string[]): Promise<{ archived: number; failed: number }> {
	if (itemIds.length === 0) return { archived: 0, failed: 0 };

	const archiveId = await getOrCreateArchiveFolder();
	if (!archiveId) {
		throw new Error('Failed to get or create archive folder');
	}

	let archived = 0;
	let failed = 0;

	for (const id of itemIds) {
		if (id === archiveId) continue;
		try {
			await moveBookmark(id, { parentId: archiveId, index: 0 });
			archived += 1;
		} catch (error) {
			console.error('❌ Failed to archive', id, error);
			failed += 1;
		}
	}

	return { archived, failed };
}
