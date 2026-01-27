<script lang="ts">
	import { modalStore } from './modalStore.svelte';

	let inputValue = $state('');
	let inputElement: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (modalStore.isOpen && modalStore.type === 'prompt') {
			inputValue = modalStore.defaultValue || '';
			// Focus input after it's rendered
			setTimeout(() => {
				inputElement?.focus();
			}, 0);
		}
	});

	function handleConfirm() {
		if (modalStore.type === 'prompt') {
			modalStore.close(inputValue);
		} else {
			modalStore.close(true);
		}
	}

	function handleCancel() {
		modalStore.close(modalStore.type === 'prompt' ? null : false);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleCancel();
		} else if (e.key === 'Enter' && modalStore.type !== 'prompt') {
			handleConfirm();
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
	>
		<div class="w-full max-w-md rounded-lg bg-white shadow-xl">
			<!-- Header -->
			<div class="border-b border-gray-200 px-6 py-4">
				<h3 class="text-lg font-semibold text-gray-900">{modalStore.title}</h3>
			</div>

			<!-- Content -->
			<div class="px-6 py-4">
				<p class="text-sm text-gray-700">{modalStore.message}</p>

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
					class="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					{modalStore.confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
