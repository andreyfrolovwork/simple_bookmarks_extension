// Стор для управления состоянием drag and drop
import { writable, get } from 'svelte/store';
import type { BookmarkItem } from '../types';

interface DragState {
	item: BookmarkItem | null;
	parentId: string | null;
}

const dragState = writable<DragState>({
	item: null,
	parentId: null
});

export const dragStore = {
	subscribe: dragState.subscribe,
	get item() {
		return get(dragState).item;
	},
	get parentId() {
		return get(dragState).parentId;
	},
	setDraggedItem(item: BookmarkItem, parentId: string) {
		dragState.set({ item, parentId });
	},
	clear() {
		dragState.set({ item: null, parentId: null });
	}
};

