import { describe, expect, it } from 'vitest';
import type { BookmarkItem } from '../types';
import { collectUnusedBookmarks, collectArchivePreview, splitUnused } from './unusedBookmarks';
import type { ClickMeta } from './clickStats';

function meta(bookmarkId: string, lastClickedAt: number): ClickMeta {
	return {
		bookmarkId,
		url: `https://${bookmarkId}.example`,
		title: bookmarkId,
		lastClickedAt,
		totalClicks: 1
	};
}

const tree: BookmarkItem[] = [
	{
		id: '0',
		title: 'Root',
		children: [
			{
				id: '1',
				title: 'Bookmarks Bar',
				folderType: 'bookmarks-bar',
				children: [
					{ id: 'fresh', title: 'Fresh', url: 'https://fresh.example' },
					{ id: 'stale', title: 'Stale', url: 'https://stale.example' },
					{ id: 'never', title: 'Never', url: 'https://never.example' },
					{
						id: 'folder',
						title: 'Work',
						children: [{ id: 'nested', title: 'Nested', url: 'https://nested.example' }]
					}
				]
			},
			{
				id: '10',
				title: 'Other Bookmarks',
				folderType: 'other',
				children: [
					{
						id: 'arch',
						title: 'archive',
						children: [{ id: 'already', title: 'Already archived', url: 'https://arch.example' }]
					}
				]
			}
		]
	}
];

describe('collectUnusedBookmarks', () => {
	const cutoff = 1_000;

	it('treats missing and old clicks as unused, keeps recent clicks', () => {
		const lastClicks = new Map([
			['fresh', meta('fresh', 2_000)],
			['stale', meta('stale', 500)],
			['nested', meta('nested', 100)]
		]);

		const unused = collectUnusedBookmarks(tree, lastClicks, cutoff);
		const ids = unused.map((item) => item.id).sort();

		expect(ids).toEqual(['nested', 'never', 'stale']);
		expect(unused.find((item) => item.id === 'never')?.lastClickedAt).toBeNull();
	});

	it('skips bookmarks already inside the archive folder', () => {
		const unused = collectUnusedBookmarks(tree, new Map(), cutoff);
		expect(unused.some((item) => item.id === 'already')).toBe(false);
	});

	it('does not treat folders as unused bookmarks', () => {
		const unused = collectUnusedBookmarks(tree, new Map(), cutoff);
		expect(unused.some((item) => item.id === 'folder')).toBe(false);
	});

	it('splits never-clicked vs stale', () => {
		const unused = collectUnusedBookmarks(
			tree,
			new Map([['stale', meta('stale', 1)]]),
			cutoff
		);
		expect(splitUnused(unused)).toEqual({ neverClicked: 3, stale: 1 });
	});
});

describe('collectArchivePreview', () => {
	const cutoff = 1_000;

	it('archives a fully unused folder as a folder, leftover bookmarks separately', () => {
		const lastClicks = new Map([
			['fresh', meta('fresh', 2_000)],
			['stale', meta('stale', 500)],
			['nested', meta('nested', 100)]
		]);

		const preview = collectArchivePreview(tree, lastClicks, cutoff);
		expect(preview.folderIds).toEqual(['folder']);
		expect(preview.bookmarkIds.sort()).toEqual(['never', 'stale']);
		expect(preview.highlightIds.sort()).toEqual(['folder', 'nested', 'never', 'stale']);
		expect(preview.folderIds).not.toContain('1');
	});

	it('does not archive a folder if any bookmark inside was clicked', () => {
		const lastClicks = new Map([['nested', meta('nested', 2_000)]]);
		const preview = collectArchivePreview(tree, lastClicks, cutoff);
		expect(preview.folderIds).toEqual([]);
		expect(preview.bookmarkIds.sort()).toEqual(['fresh', 'never', 'stale']);
	});

	it('skips the archive folder', () => {
		const preview = collectArchivePreview(tree, new Map(), cutoff);
		expect(preview.highlightIds).not.toContain('already');
		expect(preview.folderIds).not.toContain('arch');
	});
});
