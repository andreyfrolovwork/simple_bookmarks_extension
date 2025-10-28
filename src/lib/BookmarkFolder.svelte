<script lang="ts">
	import type { BookmarkItem } from '../types';
	import Bookmark from './Bookmark.svelte';
	import Self from './BookmarkFolder.svelte';
	import { deleteBookmark } from './deleteBookmark';

	let { item, level = 0, onDelete }: { item: BookmarkItem; level?: number; onDelete?: () => void } = $props();

	// Проверяем является ли элемент папкой (есть children, но нет url)
	function isFolder(item: BookmarkItem): boolean {
		return Boolean(item.children && item.children.length > 0 && !item.url);
	}

	// Группируем последовательные закладки для корневого уровня
	type GroupItem = { type: 'folder'; item: BookmarkItem } | { type: 'bookmarks'; items: BookmarkItem[] };
	
	const groupedItems = $derived(() => {
		if (level !== 0) return [];
		
		const groups: GroupItem[] = [];
		const children = item.children || [];
		
		for (const child of children) {
			if (isFolder(child)) {
				// Папка идет отдельно
				groups.push({ type: 'folder', item: child });
			} else {
				// Закладка - добавляем к последней группе закладок или создаем новую
				const lastGroup = groups[groups.length - 1];
				if (lastGroup && lastGroup.type === 'bookmarks') {
					lastGroup.items.push(child);
				} else {
					groups.push({ type: 'bookmarks', items: [child] });
				}
			}
		}
		
		return groups;
	});

	// Обработчик удаления папки
	async function handleDeleteFolder(folderId: string, folderTitle: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		if (confirm(`Удалить папку "${folderTitle}" и всё её содержимое?`)) {
			try {
				await deleteBookmark(folderId, true);
				onDelete?.();
			} catch (error) {
				alert('Не удалось удалить папку');
			}
		}
	}
</script>

{#if level === 0}
	<!-- Корневой уровень - горизонтальный список -->
	<div class="flex gap-3 overflow-x-scroll pb-2">
		{#each groupedItems() as group, index (index)}
			{#if group.type === 'folder'}
				<!-- Папка -->
				<div class="group relative flex shrink-0 self-start flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
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
						<h3 class="text-sm font-semibold text-gray-800">{group.item.title}</h3>
					</div>
					<Self item={group.item} level={1} {onDelete} />
					<button
						onclick={(e) => handleDeleteFolder(group.item.id, group.item.title, e)}
						class="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity hover:bg-red-600 group-hover:opacity-100 [.group:not(:hover)_&]:!opacity-0"
						title="Удалить папку"
					>
						<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{:else}
				<!-- Группа закладок -->
				<div class="flex shrink-0 flex-col gap-2">
					{#each group.items as bookmark (bookmark.id)}
						<Bookmark item={bookmark} {onDelete} />
					{/each}
				</div>
			{/if}
		{/each}
	</div>
{:else}
	<!-- Вложенные уровни - вертикальный список -->
	<div class="flex flex-col gap-2">
		{#each item.children || [] as child (child.id)}
			{#if isFolder(child)}
				<div class="group relative flex flex-col gap-2 border-l-2 border-gray-200 pl-3">
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
						<button
							onclick={(e) => handleDeleteFolder(child.id, child.title, e)}
							class="ml-auto flex size-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 [.group:not(:hover)_&]:!opacity-0"
							title="Удалить папку"
						>
							<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<Self item={child} level={level + 1} {onDelete} />
				</div>
			{:else}
				<Bookmark item={child} {onDelete} />
			{/if}
		{/each}
	</div>
{/if}

