import { describe, expect, it } from 'vitest';
import type { BookmarkItem } from '../types';
import { findArchiveFolder, withoutArchiveFolder } from './archiveBookmark';

const tree: BookmarkItem[] = [
	{
		id: '0',
		title: 'Root',
		children: [
			{ id: '1', title: 'Bookmarks Bar', folderType: 'bookmarks-bar', children: [] },
			{
				id: '10',
				title: 'Other Bookmarks',
				folderType: 'other',
				children: [
					{ id: '11', title: 'MDN', url: 'https://developer.mozilla.org' },
					{
						id: '12',
						title: 'archive',
						children: [{ id: '99', title: 'Old', url: 'https://old.example' }]
					}
				]
			}
		]
	}
];

describe('archive tab helpers', () => {
	it('finds the archive folder under Other Bookmarks', () => {
		const archive = findArchiveFolder(tree);
		expect(archive?.id).toBe('12');
		expect(archive?.children?.[0]?.id).toBe('99');
	});

	it('hides the archive folder from Other Bookmarks', () => {
		const other = withoutArchiveFolder(tree[0].children?.[1]);
		expect(other?.children?.map((c) => c.id)).toEqual(['11']);
	});
});
