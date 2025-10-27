<script lang="ts">
	import type { BookmarkItem, FolderType } from '../types';
	import BookmarkFolder from './BookmarkFolder.svelte';

	let { bookmarks }: { bookmarks: BookmarkItem[] } = $props();

	let activeTab = $state<FolderType>('bookmarks-bar');

	// Названия вкладок
	const tabNames: Record<FolderType, string> = {
		'bookmarks-bar': 'Панель закладок',
		other: 'Другие закладки',
		mobile: 'Мобильные закладки'
	};

	// Получаем все папки из корня
	const rootFolders = $derived(bookmarks[0]?.children || []);

	// Получаем закладки для активной вкладки
	const activeBookmarks = $derived(
		rootFolders.find((item) => item.folderType === activeTab)
	);
</script>

<div class="flex h-screen flex-col">
	<!-- Вкладки -->
	<div class="border-b border-gray-200 bg-white shadow-sm">
		<div class="flex gap-1 px-4">
			{#each Object.keys(tabNames) as tab}
				<button
					onclick={() => (activeTab = tab as FolderType)}
					class="px-4 py-3 text-sm font-medium transition-colors {activeTab === tab
						? 'border-b-2 border-blue-500 text-blue-600'
						: 'text-gray-600 hover:text-gray-900'}"
				>
					{tabNames[tab as FolderType]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Содержимое закладок -->
	<div class="flex-1 overflow-auto bg-gray-50 p-4">
		{#if activeBookmarks}
			<BookmarkFolder item={activeBookmarks} level={0} />
		{:else}
			<div class="flex h-full items-center justify-center text-gray-500">
				<p>Закладки не найдены</p>
			</div>
		{/if}
	</div>
</div>

