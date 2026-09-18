import { writable } from 'svelte/store';

export const archivePreviewOpen = writable(false);
export const archivePreviewIds = writable<Set<string>>(new Set());

export function setArchivePreviewIds(ids: Iterable<string>) {
	archivePreviewIds.set(new Set(ids));
}

export function openArchivePreview() {
	archivePreviewOpen.set(true);
}

export function clearArchivePreview() {
	archivePreviewOpen.set(false);
	archivePreviewIds.set(new Set());
}
