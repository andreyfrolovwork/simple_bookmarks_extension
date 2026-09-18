import type { ClickMeta } from './clickStats';
import type { ArchivePreview } from './unusedBookmarks';

export const unusedArchiveUi = $state({
	days: 0,
	loaded: false,
	lastClicks: new Map<string, ClickMeta>(),
	preview: {
		bookmarkIds: [],
		folderIds: [],
		highlightIds: []
	} as ArchivePreview
});
