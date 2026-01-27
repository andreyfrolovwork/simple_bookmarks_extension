import type { BookmarkItem } from '../types';

// Test data for development
const INIT_BOOKMARKS: BookmarkItem[] = [
	{
		id: '0',
		title: 'Root',
		children: [
			{
				id: '1',
				title: 'Bookmarks Bar',
				folderType: 'bookmarks-bar',
				children: [
					{
						id: '2',
						title: 'Example Folder',
						children: [
							{
								id: '3',
								title: 'Google',
								url: 'https://www.google.com',
								dateAdded: Date.now()
							},
							{
								id: '4',
								title: 'GitHub',
								url: 'https://github.com',
								dateAdded: Date.now()
							}
						]
					},
					{
						id: '5',
						title: 'YouTube',
						url: 'https://www.youtube.com',
						dateAdded: Date.now()
					}
				]
			},
			{
				id: '10',
				title: 'Other Bookmarks',
				folderType: 'other',
				children: [
					{
						id: '11',
						title: 'MDN',
						url: 'https://developer.mozilla.org',
						dateAdded: Date.now()
					}
				]
			},
			{
				id: '20',
				title: 'Mobile Bookmarks',
				folderType: 'mobile',
				children: []
			}
		]
	}
];

export default INIT_BOOKMARKS;

