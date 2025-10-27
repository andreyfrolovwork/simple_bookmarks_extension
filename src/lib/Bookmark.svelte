<script lang="ts">
	import type { BookmarkItem } from '../types';

	let { item }: { item: BookmarkItem } = $props();

	// Получаем фавикон для сайта
	function getFavicon(url: string): string {
		try {
			const urlObj = new URL(url);
			return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
		} catch {
			return '';
		}
	}
</script>

<a
	href={item.url}
	target="_blank"
	rel="noopener noreferrer"
	class="flex max-w-[350px] shrink-0 self-start items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
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

