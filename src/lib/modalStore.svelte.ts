type ModalType = 'prompt' | 'confirm' | 'alert' | 'bookmark';

export interface BookmarkData {
	url?: string;
	title: string;
}

interface ModalState {
	isOpen: boolean;
	type: ModalType;
	title: string;
	message: string;
	placeholder?: string;
	defaultValue?: string;
	confirmText?: string;
	cancelText?: string;
	resolve?: (value: string | boolean | null | BookmarkData) => void;
}

export interface BookmarkEditInitial {
	url: string;
	title: string;
}

class ModalStore {
	isOpen = $state(false);
	type = $state<ModalType>('alert');
	title = $state('');
	message = $state('');
	placeholder = $state('');
	defaultValue = $state('');
	confirmText = $state('OK');
	cancelText = $state('Cancel');
	
	private resolve?: (value: string | boolean | null | BookmarkData) => void;

	prompt(message: string, defaultValue: string = ''): Promise<string | null> {
		return new Promise((resolve) => {
			this.isOpen = true;
			this.type = 'prompt';
			this.title = 'Input';
			this.message = message;
			this.defaultValue = defaultValue;
			this.placeholder = '';
			this.confirmText = 'OK';
			this.cancelText = 'Cancel';
			this.resolve = resolve as (value: string | boolean | null | BookmarkData) => void;
		});
	}

	confirm(message: string, title: string = 'Confirm'): Promise<boolean> {
		return new Promise((resolve) => {
			this.isOpen = true;
			this.type = 'confirm';
			this.title = title;
			this.message = message;
			this.confirmText = 'Confirm';
			this.cancelText = 'Cancel';
			this.resolve = ((value: string | boolean | null | BookmarkData) => {
				resolve(value === true);
			}) as (value: string | boolean | null | BookmarkData) => void;
		});
	}

	alert(message: string, title: string = 'Alert'): Promise<boolean> {
		return new Promise((resolve) => {
			this.isOpen = true;
			this.type = 'alert';
			this.title = title;
			this.message = message;
			this.confirmText = 'OK';
			this.cancelText = '';
			this.resolve = resolve as (value: string | boolean | null | BookmarkData) => void;
		});
	}

	private bookmarkInitial: BookmarkEditInitial | null = null;

	bookmarkPrompt(): Promise<BookmarkData | null> {
		return new Promise((resolve) => {
			this.bookmarkInitial = null;
			this.isOpen = true;
			this.type = 'bookmark';
			this.title = 'Create Bookmark';
			this.message = '';
			this.confirmText = 'Create';
			this.cancelText = 'Cancel';
			this.resolve = resolve as (value: string | boolean | null | BookmarkData) => void;
		});
	}

	bookmarkEditPrompt(initialUrl: string, initialTitle: string): Promise<BookmarkData | null> {
		return new Promise((resolve) => {
			this.bookmarkInitial = { url: initialUrl, title: initialTitle };
			this.isOpen = true;
			this.type = 'bookmark';
			this.title = 'Edit Bookmark';
			this.message = '';
			this.confirmText = 'Save';
			this.cancelText = 'Cancel';
			this.resolve = resolve as (value: string | boolean | null | BookmarkData) => void;
		});
	}

	getBookmarkInitial(): BookmarkEditInitial | null {
		return this.bookmarkInitial;
	}

	close(value: string | boolean | null | BookmarkData = null) {
		if (this.resolve) {
			this.resolve(value);
		}
		this.isOpen = false;
	}
}

export const modalStore = new ModalStore();
