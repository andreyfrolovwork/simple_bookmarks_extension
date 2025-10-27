<script lang="ts">
	import type { BookmarkItem } from '../types';
	import Bookmark from './Bookmark.svelte';
	import Self from './BookmarkFolder.svelte';

	let { item, level = 0 }: { item: BookmarkItem; level?: number } = $props();

	// Проверяем является ли элемент папкой (есть children, но нет url)
	function isFolder(item: BookmarkItem): boolean {
		return Boolean(item.children && item.children.length > 0 && !item.url);
	}
</script>

{#if level === 0}
	<!-- Корневой уровень - горизонтальный список -->
	<div class="flex gap-3 overflow-x-auto pb-2">
		{#each item.children || [] as child (child.id)}
			{#if isFolder(child)}
				<div class="flex shrink-0 self-start flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
					<div class="flex items-center gap-2">
						<svg
							class="size-4 shrink-0 text-gray-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
						<h3 class="text-sm font-semibold text-gray-800">{child.title}</h3>
					</div>
					<Self item={child} level={1} />
				</div>
			{:else}
				<Bookmark item={child} />
			{/if}
		{/each}
	</div>
{:else}
	<!-- Вложенные уровни - вертикальный список -->
	<div class="flex flex-col gap-2">
		{#each item.children || [] as child (child.id)}
			{#if isFolder(child)}
				<div class="flex flex-col gap-2 border-l-2 border-gray-200 pl-3">
					<div class="flex items-center gap-2">
						<svg
							class="size-4 shrink-0 text-gray-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
						<h3 class="text-sm font-semibold text-gray-800">{child.title}</h3>
					</div>
					<Self item={child} level={level + 1} />
				</div>
			{:else}
				<Bookmark item={child} />
			{/if}
		{/each}
	</div>
{/if}

