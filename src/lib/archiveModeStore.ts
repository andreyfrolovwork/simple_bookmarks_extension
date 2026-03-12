import { writable } from 'svelte/store';

/**
 * true — когда зажат Command (⌘), показываем иконку архива и Cmd+клик архивирует
 */
export const archiveModeStore = writable(false);

export function initArchiveModeStore(): () => void {
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Meta') {
			archiveModeStore.set(true);
		}
	};

	const handleKeyUp = (e: KeyboardEvent) => {
		if (e.key === 'Meta') {
			archiveModeStore.set(false);
		}
	};

	window.addEventListener('keydown', handleKeyDown);
	window.addEventListener('keyup', handleKeyUp);

	return () => {
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('keyup', handleKeyUp);
	};
}
