type ModalType = 'prompt' | 'confirm' | 'alert';

interface ModalState {
	isOpen: boolean;
	type: ModalType;
	title: string;
	message: string;
	placeholder?: string;
	defaultValue?: string;
	confirmText?: string;
	cancelText?: string;
	resolve?: (value: string | boolean | null) => void;
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
	
	private resolve?: (value: string | boolean | null) => void;

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
			this.resolve = resolve as (value: string | boolean | null) => void;
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
			this.resolve = resolve as (value: string | boolean | null) => void;
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
			this.resolve = resolve as (value: string | boolean | null) => void;
		});
	}

	close(value: string | boolean | null = null) {
		if (this.resolve) {
			this.resolve(value);
		}
		this.isOpen = false;
	}
}

export const modalStore = new ModalStore();
