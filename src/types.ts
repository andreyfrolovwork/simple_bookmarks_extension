export interface BookmarkItem {
	id: string;
	title: string;
	url?: string;
	children?: BookmarkItem[];
	dateAdded?: number;
	dateGroupModified?: number;
	dateLastUsed?: number;
	index?: number;
	parentId?: string;
	syncing?: boolean;
	folderType?: 'bookmarks-bar' | 'other' | 'mobile';
}

export type FolderType = 'bookmarks-bar' | 'other' | 'mobile';

