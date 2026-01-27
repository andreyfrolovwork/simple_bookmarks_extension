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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		transition:fade={{ duration: 200 }}
	>
		<div 
			class="w-full max-w-md rounded-lg bg-white shadow-xl"
			transition:scale={{ duration: 200, start: 0.95 }}
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-semibold text-gray-900">{modalStore.title}</h3>
			</div>

			<!-- Content -->
			<div class="px-6 py-4">
				{#if modalStore.message}
					<p class="text-sm text-gray-700">{modalStore.message}</p>
				{/if}

				{#if modalStore.type === 'prompt'}
					<input
						bind:this={inputElement}
						type="text"
						bind:value={inputValue}
						placeholder={modalStore.placeholder}
						class="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								handleConfirm();
							}
						}}
					/>
				{:else if modalStore.type === 'bookmark'}
					<div class="space-y-3">
						<div>
							<label for="bookmark-url" class="block text-sm font-medium text-gray-700 mb-1">
								URL
							</label>
							<input
								bind:this={urlInputElement}
								id="bookmark-url"
								type="text"
								bind:value={bookmarkUrl}
								placeholder="https://example.com"
								class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 {isUrlValid || !urlTouched ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500' : 'border-red-500 focus:border-red-500 focus:ring-red-500'}"
								oninput={() => { urlTouched = true; }}
								onblur={() => { urlTouched = true; }}
								onkeydown={(e) => {
									if (e.key === 'Enter' && bookmarkTitle && bookmarkUrl && isUrlValid) {
										handleConfirm();
									}
								}}
							/>
							{#if urlError}
								<p class="mt-1 text-xs text-red-500">{urlError}</p>
							{/if}
						</div>
						<div>
							<label for="bookmark-title" class="block text-sm font-medium text-gray-700 mb-1">
								Name
							</label>
							<input
								id="bookmark-title"
								type="text"
								bind:value={bookmarkTitle}
								placeholder="My Bookmark"
								class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
			<div class="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
				{#if modalStore.cancelText}
					<button
						onclick={handleCancel}
						class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						{modalStore.cancelText}
					</button>
				{/if}
				<button
					onclick={handleConfirm}
					disabled={modalStore.type === 'bookmark' && (!bookmarkTitle || !bookmarkUrl || !isUrlValid)}
					class="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{modalStore.confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
