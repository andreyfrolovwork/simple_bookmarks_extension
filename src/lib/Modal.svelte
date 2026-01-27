<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { modalStore } from './modalStore.svelte';

	let inputValue = $state('');
	let bookmarkUrl = $state('');
	let bookmarkTitle = $state('');
	let inputElement: HTMLInputElement | undefined = $state();
	let urlInputElement: HTMLInputElement | undefined = $state();
	let urlTouched = $state(false);

	// Validate URL
	function validateUrl(url: string): boolean {
		if (!url || url.trim() === '') {
			return false; // URL is required
		}
		
		const trimmedUrl = url.trim();
		
		// Extract hostname part before adding protocol
		let hostnamePart = trimmedUrl;
		if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
			// Remove protocol to get hostname
			hostnamePart = trimmedUrl.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
		} else {
			// No protocol, extract hostname (before first / or :)
			hostnamePart = trimmedUrl.split('/')[0].split(':')[0];
		}
		
		// Reject pure numbers (like "123") - they're not valid domains
		if (/^\d+$/.test(hostnamePart)) {
			return false;
		}
		
		let urlToValidate = trimmedUrl;
		// Add https:// if no protocol specified
		if (!urlToValidate.startsWith('http://') && !urlToValidate.startsWith('https://')) {
			urlToValidate = `https://${urlToValidate}`;
		}
		
		try {
			const urlObj = new URL(urlToValidate);
			const hostname = urlObj.hostname;
			
			// Reject URLs without valid hostname
			if (!hostname || hostname === '') {
				return false;
			}
			
			// Accept valid IP addresses (IPv4)
			if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
				const parts = hostname.split('.');
				const isValidIP = parts.every(part => {
					const num = parseInt(part, 10);
					return num >= 0 && num <= 255;
				});
				if (isValidIP) {
					return true;
				}
			}
			
			// Accept domain names (must contain at least one dot or be localhost)
			if (hostname.includes('.') || hostname === 'localhost') {
				return true;
			}
			
			// Reject everything else
			return false;
		} catch {
			return false;
		}
	}

	// Реактивная валидация URL
	const isUrlValid: boolean = $derived.by(() => {
		if (modalStore.type !== 'bookmark') return true;
		if (!bookmarkUrl || bookmarkUrl.trim() === '') return false;
		return validateUrl(bookmarkUrl);
	});

	const urlError: string = $derived.by(() => {
		if (modalStore.type !== 'bookmark') return '';
		if (!bookmarkUrl || bookmarkUrl.trim() === '') {
			return urlTouched ? 'URL is required' : '';
		}
		return isUrlValid ? '' : 'Invalid URL format';
	});

	$effect(() => {
		if (modalStore.isOpen && modalStore.type === 'prompt') {
			inputValue = modalStore.defaultValue || '';
			// Focus input after it's rendered
			setTimeout(() => {
				inputElement?.focus();
			}, 100);
		} else if (modalStore.isOpen && modalStore.type === 'bookmark') {
			bookmarkUrl = '';
			bookmarkTitle = '';
			urlTouched = false;
			// Focus URL input after it's rendered
			setTimeout(() => {
				urlInputElement?.focus();
			}, 100);
		}
	});

	function handleConfirm() {
		if (modalStore.type === 'prompt') {
			modalStore.close(inputValue);
		} else if (modalStore.type === 'bookmark') {
			if (bookmarkTitle && bookmarkUrl && isUrlValid) {
				// Normalize URL - add https:// if no protocol specified
				let normalizedUrl = bookmarkUrl.trim();
				if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
					normalizedUrl = `https://${normalizedUrl}`;
				}
				modalStore.close({ url: normalizedUrl, title: bookmarkTitle });
			}
		} else {
			modalStore.close(true);
		}
	}

	function handleCancel() {
		if (modalStore.type === 'prompt') {
			modalStore.close(null);
		} else if (modalStore.type === 'bookmark') {
			modalStore.close(null);
		} else {
			modalStore.close(false);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleCancel();
		} else if (e.key === 'Enter' && modalStore.type !== 'prompt') {
			// Для bookmark типа проверяем валидность перед подтверждением
			if (modalStore.type === 'bookmark') {
				if (bookmarkTitle && bookmarkUrl && isUrlValid) {
					handleConfirm();
				}
			} else {
				handleConfirm();
			}
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if modalStore.isOpen}
	<div
		class="pixel-modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		transition:fade={{ duration: 200 }}
	>
		<div 
			class="pixel-modal-dialog"
			transition:scale={{ duration: 200, start: 0.95 }}
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="pixel-modal-header">
				<h3 class="modal-title">{modalStore.title}</h3>
			</div>

			<!-- Content -->
			<div class="pixel-modal-content">
				{#if modalStore.message}
					<p class="modal-message">{modalStore.message}</p>
				{/if}

				{#if modalStore.type === 'prompt'}
					<input
						bind:this={inputElement}
						type="text"
						bind:value={inputValue}
						placeholder={modalStore.placeholder}
						class="pixel-input"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								handleConfirm();
							}
						}}
					/>
				{:else if modalStore.type === 'bookmark'}
					<div class="modal-form">
						<div class="form-field">
							<label for="bookmark-url" class="form-label">
								URL
							</label>
							<input
								bind:this={urlInputElement}
								id="bookmark-url"
								type="text"
								bind:value={bookmarkUrl}
								placeholder="https://example.com"
								class="pixel-input"
								class:error={!isUrlValid && urlTouched}
								oninput={() => { urlTouched = true; }}
								onblur={() => { urlTouched = true; }}
								onkeydown={(e) => {
									if (e.key === 'Enter' && bookmarkTitle && bookmarkUrl && isUrlValid) {
										handleConfirm();
									}
								}}
							/>
							{#if urlError}
								<p class="form-error">{urlError}</p>
							{/if}
						</div>
						<div class="form-field">
							<label for="bookmark-title" class="form-label">
								Name
							</label>
							<input
								id="bookmark-title"
								type="text"
								bind:value={bookmarkTitle}
								placeholder="My Bookmark"
								class="pixel-input"
								onkeydown={(e) => {
									if (e.key === 'Enter' && bookmarkTitle && bookmarkUrl && isUrlValid) {
										handleConfirm();
									}
								}}
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="pixel-modal-footer">
				{#if modalStore.cancelText}
					<button
						onclick={handleCancel}
						class="pixel-modal-btn pixel-modal-btn-cancel"
					>
						{modalStore.cancelText}
					</button>
				{/if}
				<button
					onclick={handleConfirm}
					disabled={modalStore.type === 'bookmark' && (!bookmarkTitle || !bookmarkUrl || !isUrlValid)}
					class="pixel-modal-btn pixel-modal-btn-confirm"
				>
					{modalStore.confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.pixel-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.75);
		padding: 16px;
	}

	.pixel-modal-dialog {
		width: 100%;
		max-width: 500px;
		background-color: var(--bg-surface);
		border: 6px solid var(--border);
		box-shadow: 8px 8px 0px var(--shadow);
	}

	.pixel-modal-header {
		padding: 16px;
		background-color: var(--bg-secondary);
		border-bottom: 4px solid var(--border);
	}

	.modal-title {
		font-size: 12px;
		font-weight: bold;
		color: var(--text-primary);
		text-transform: uppercase;
		margin: 0;
	}

	.pixel-modal-content {
		padding: 20px 16px;
		background-color: var(--bg-surface);
	}

	.modal-message {
		font-size: 10px;
		color: var(--text-primary);
		line-height: 1.6;
		margin-bottom: 16px;
	}

	.pixel-input {
		width: 100%;
		padding: 8px 12px;
		background-color: var(--bg-primary);
		border: 4px solid var(--border);
		color: var(--text-primary);
		font-size: 10px;
		font-family: 'Press Start 2P', monospace;
		transition: all 0.1s;
		box-shadow: inset 2px 2px 0px var(--shadow);
		margin-top: 12px;
	}

	/* URL input uses IBM Plex Mono */
	#bookmark-url {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 13px;
	}

	.pixel-input::placeholder {
		color: var(--text-secondary);
	}

	.pixel-input:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.pixel-input.error {
		border-color: #ff6b6b;
	}

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-field {
		display: flex;
		flex-direction: column;
	}

	.form-label {
		font-size: 8px;
		font-weight: bold;
		color: var(--text-primary);
		margin-bottom: 4px;
		text-transform: uppercase;
	}

	.form-error {
		font-size: 7px;
		color: #ff6b6b;
		margin-top: 4px;
	}

	.pixel-modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 16px;
		background-color: var(--bg-secondary);
		border-top: 4px solid var(--border);
	}

	.pixel-modal-btn {
		padding: 8px 16px;
		background-color: var(--bg-surface);
		border: 4px solid var(--border);
		color: var(--text-primary);
		font-size: 8px;
		font-family: 'Press Start 2P', monospace;
		text-transform: uppercase;
		cursor: pointer;
		transition: all 0.1s;
		box-shadow: 2px 2px 0px var(--shadow);
	}

	.pixel-modal-btn:hover:not(:disabled) {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0px var(--shadow);
	}

	.pixel-modal-btn:active:not(:disabled) {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0px var(--shadow);
	}

	.pixel-modal-btn-confirm {
		background-color: var(--accent-primary);
	}

	.pixel-modal-btn-cancel:hover {
		background-color: var(--accent-secondary);
	}

	.pixel-modal-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
