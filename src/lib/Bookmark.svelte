<script lang="ts">
	import type { BookmarkItem } from '../types';
	import { deleteBookmark } from './deleteBookmark';

	let { item, onDelete }: { item: BookmarkItem; onDelete?: () => void } = $props();

	// Получаем фавикон для сайта
	function getFavicon(url: string): string {
		try {
			const urlObj = new URL(url);
			return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
		} catch {
			return '';
		}
	}

	// Обработчик удаления
	async function handleDelete(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		if (confirm(`Удалить закладку "${item.title}"?`)) {
			try {
				await deleteBookmark(item.id, false);
				onDelete?.();
			} catch (error) {
				alert('Не удалось удалить закладку');
			}
		}
	}
</script>

<div class="group relative flex max-w-[350px] shrink-0 self-start">
	<a
		href={item.url}
		target="_blank"
		rel="noopener noreferrer"
		class="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
		title={item.title}
	>
		{#if item.url}
			<img
				src={getFavicon(item.url)}
				alt=""
				class="size-4 shrink-0"
				onerror={(e) => {
					if (e.currentTarget instanceof HTMLImageElement) {
						e.currentTarget.style.display = 'none';
					}
				}}
			/>
		{/if}
		<span class="truncate text-sm font-medium text-gray-700">{item.title}</span>
	</a>
	<button
		onclick={handleDelete}
		class="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity hover:bg-red-600 group-hover:opacity-100"
		title="Удалить"
	>
		<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
		</svg>
	</button>
</div>

