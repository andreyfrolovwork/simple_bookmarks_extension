<script lang="ts">
	import { searchStore } from './searchStore.svelte';

	let inputRef: HTMLInputElement;

	// Обработка ввода текста
	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchStore.search(target.value);
	}

	// Очистка поиска
	function handleClear() {
		searchStore.clear();
		if (inputRef) {
			inputRef.focus();
		}
	}

	// Обработка нажатия Escape
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClear();
		}
	}
</script>

<div 
	class="search-bar-container transition-all duration-300 ease-in-out {searchStore.isActive ? 'w-full' : 'w-64'}"
>
	<div class="relative flex items-center">
		<!-- Иконка поиска -->
		<div class="pointer-events-none absolute left-3 flex items-center">
			<svg 
				class="size-5 text-gray-400" 
				fill="none" 
				stroke="currentColor" 
				viewBox="0 0 24 24"
			>
				<path 
					stroke-linecap="round" 
					stroke-linejoin="round" 
					stroke-width="2" 
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
				/>
			</svg>
		</div>

		<!-- Инпут -->
		<input
			bind:this={inputRef}
			type="text"
			bind:value={searchStore.query}
			oninput={handleInput}
			onkeydown={handleKeydown}
			placeholder="Поиск закладок..."
			class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>

		<!-- Кнопка очистки -->
		{#if searchStore.query}
			<button
				onclick={handleClear}
				class="absolute right-2 flex size-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
				title="Очистить"
			>
				<svg 
					class="size-4" 
					fill="none" 
					stroke="currentColor" 
					viewBox="0 0 24 24"
				>
					<path 
						stroke-linecap="round" 
						stroke-linejoin="round" 
						stroke-width="2" 
						d="M6 18L18 6M6 6l12 12" 
					/>
				</svg>
			</button>
		{/if}
	</div>
</div>

<style>
	.search-bar-container {
		min-width: 16rem;
	}
</style>
