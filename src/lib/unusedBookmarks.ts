import type { BookmarkItem } from '../types';
import { ARCHIVE_FOLDER_TITLE } from './archiveBookmark';
import type { ClickMeta } from './clickStats';

export interface UnusedBookmark {
	id: string;
	title: string;
	url: string;
	lastClickedAt: number | null;
}

export function collectUnusedBookmarks(
	tree: BookmarkItem[],
	lastClicks: Map<string, ClickMeta>,
	cutoff: number,
	archiveFolderTitle: string = ARCHIVE_FOLDER_TITLE
): UnusedBookmark[] {
	const unused: UnusedBookmark[] = [];

	function walk(node: BookmarkItem, insideArchive: boolean) {
		const isArchiveFolder = !node.url && node.title === archiveFolderTitle;
		const inArchive = insideArchive || isArchiveFolder;

		if (node.url && !inArchive) {
			const meta = lastClicks.get(node.id);
			const lastClickedAt = meta?.lastClickedAt ?? null;
			if (lastClickedAt === null || lastClickedAt < cutoff) {
				unused.push({
					id: node.id,
					title: node.title,
					url: node.url,
					lastClickedAt
				});
			}
		}

		for (const child of node.children ?? []) {
			walk(child, inArchive);
		}
	}

	for (const node of tree) {
		walk(node, false);
	}

	return unused;
}

export function splitUnused(unused: UnusedBookmark[]): {
	neverClicked: number;
	stale: number;
} {
	let neverClicked = 0;
	let stale = 0;
	for (const item of unused) {
		if (item.lastClickedAt === null) neverClicked += 1;
		else stale += 1;
	}
	return { neverClicked, stale };
}

export interface ArchivePreview {
	bookmarkIds: string[];
	folderIds: string[];
	highlightIds: string[];
}

function isSystemFolder(node: BookmarkItem): boolean {
	return (
		node.folderType === 'bookmarks-bar' ||
		node.folderType === 'other' ||
		node.folderType === 'mobile' ||
		node.folderType === 'archive' ||
		node.id === '0'
	);
}

function descendantIds(node: BookmarkItem): string[] {
	const ids = [node.id];
	for (const child of node.children ?? []) {
		ids.push(...descendantIds(child));
	}
	return ids;
}

function isBookmarkUnused(
	node: BookmarkItem,
	lastClicks: Map<string, ClickMeta>,
	cutoff: number
): boolean {
	const lastClickedAt = lastClicks.get(node.id)?.lastClickedAt;
	return lastClickedAt === undefined || lastClickedAt < cutoff;
}

function analyze(
	node: BookmarkItem,
	lastClicks: Map<string, ClickMeta>,
	cutoff: number,
	archiveFolderTitle: string,
	insideArchive: boolean,
	depth: number
): {
	allUnused: boolean;
	bookmarkIds: string[];
	folderIds: string[];
	highlightIds: string[];
} {
	const isArchiveFolder = !node.url && node.title === archiveFolderTitle;
	if (insideArchive || isArchiveFolder) {
		return { allUnused: true, bookmarkIds: [], folderIds: [], highlightIds: [] };
	}

	if (node.url) {
		const unused = isBookmarkUnused(node, lastClicks, cutoff);
		return {
			allUnused: unused,
			bookmarkIds: unused ? [node.id] : [],
			folderIds: [],
			highlightIds: unused ? [node.id] : []
		};
	}

	let allUnused = true;
	const bookmarkIds: string[] = [];
	const folderIds: string[] = [];
	const highlightIds: string[] = [];

	for (const child of node.children ?? []) {
		const result = analyze(child, lastClicks, cutoff, archiveFolderTitle, false, depth + 1);
		allUnused = allUnused && result.allUnused;
		bookmarkIds.push(...result.bookmarkIds);
		folderIds.push(...result.folderIds);
		highlightIds.push(...result.highlightIds);
	}

	if (depth > 0 && !isSystemFolder(node) && allUnused) {
		return {
			allUnused: true,
			bookmarkIds: [],
			folderIds: [node.id],
			highlightIds: descendantIds(node)
		};
	}

	return { allUnused, bookmarkIds, folderIds, highlightIds };
}

export function collectArchivePreview(
	tree: BookmarkItem[],
	lastClicks: Map<string, ClickMeta>,
	cutoff: number,
	archiveFolderTitle: string = ARCHIVE_FOLDER_TITLE
): ArchivePreview {
	const bookmarkIds: string[] = [];
	const folderIds: string[] = [];
	const highlightIds: string[] = [];

	for (const node of tree) {
		const result = analyze(node, lastClicks, cutoff, archiveFolderTitle, false, 0);
		bookmarkIds.push(...result.bookmarkIds);
		folderIds.push(...result.folderIds);
		highlightIds.push(...result.highlightIds);
	}

	return { bookmarkIds, folderIds, highlightIds };
}

export function archiveTargetIds(preview: ArchivePreview): string[] {
	return [...preview.folderIds, ...preview.bookmarkIds];
}
