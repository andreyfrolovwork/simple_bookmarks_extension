// Типы для Chrome Extension API
export {};

declare global {
	interface Window {
		chrome?: typeof chrome;
	}

	const chrome: {
		bookmarks: {
			getTree(callback: (results: chrome.bookmarks.BookmarkTreeNode[]) => void): void;
			get(
				idOrIdList: string | string[],
				callback: (results: chrome.bookmarks.BookmarkTreeNode[]) => void
			): void;
			get(idOrIdList: string | string[]): Promise<chrome.bookmarks.BookmarkTreeNode[]>;
			getSubTree(
				id: string,
				callback: (results: chrome.bookmarks.BookmarkTreeNode[]) => void
			): void;
			getSubTree(id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]>;
			create(
				bookmark: chrome.bookmarks.CreateDetails,
				callback?: (result: chrome.bookmarks.BookmarkTreeNode) => void
			): void;
			move(
				id: string,
				destination: chrome.bookmarks.MoveDetails,
				callback?: (result: chrome.bookmarks.BookmarkTreeNode) => void
			): void;
			remove(id: string, callback?: () => void): void;
			removeTree(id: string, callback?: () => void): void;
			update(
				id: string,
				changes: chrome.bookmarks.UpdateDetails,
				callback?: (result: chrome.bookmarks.BookmarkTreeNode) => void
			): void;
			onCreated: chrome.bookmarks.BookmarkCreatedEvent;
			onRemoved: chrome.bookmarks.BookmarkRemovedEvent;
			onChanged: chrome.bookmarks.BookmarkChangedEvent;
			onMoved: chrome.bookmarks.BookmarkMovedEvent;
		};
		runtime: {
			getURL(path: string): string;
			lastError?: {
				message?: string;
			};
		};
		tabs: {
			create(createProperties: { url: string }, callback?: (tab: any) => void): void;
		};
		action: {
			onClicked: {
				addListener(callback: () => void): void;
			};
		};
		storage: {
			local: {
				get(
					keys: string | string[] | { [key: string]: any } | null,
					callback: (items: { [key: string]: any }) => void
				): void;
				set(items: { [key: string]: any }, callback?: () => void): void;
			};
		};
	};

	namespace chrome.bookmarks {
		interface BookmarkTreeNode {
			id: string;
			parentId?: string;
			index?: number;
			url?: string;
			title: string;
			dateAdded?: number;
			dateGroupModified?: number;
			children?: BookmarkTreeNode[];
		}

		interface CreateDetails {
			parentId?: string;
			index?: number;
			title?: string;
			url?: string;
		}

		interface MoveDetails {
			parentId?: string;
			index?: number;
		}

		interface UpdateDetails {
			title?: string;
			url?: string;
		}

		interface BookmarkCreatedEvent {
			addListener(callback: (id: string, bookmark: BookmarkTreeNode) => void): void;
		}

		interface BookmarkRemovedEvent {
			addListener(callback: (id: string, removeInfo: any) => void): void;
		}

		interface BookmarkChangedEvent {
			addListener(callback: (id: string, changeInfo: any) => void): void;
		}

		interface BookmarkMovedEvent {
			addListener(callback: (id: string, moveInfo: any) => void): void;
		}
	}
}

