<script lang="ts">
	import type { BookmarkItem, FolderType } from '../types';
	import BookmarkFolder from './BookmarkFolder.svelte';

	let { 
		bookmarks, 
		onDelete,
		onMove 
	}: { 
		bookmarks: BookmarkItem[]; 
		onDelete?: () => void;
		onMove?: () => void;
	} = $props();

	let activeTab = $state<FolderType>('bookmarks-bar');

	// Tab names
	const tabNames: Record<FolderType, string> = {
		'bookmarks-bar': 'Bookmarks Bar',
		other: 'Other Bookmarks',
		mobile: 'Mobile Bookmarks'
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
	<div class="flex flex-1 overflow-hidden bg-gray-50">
		{#if activeBookmarks}
			<BookmarkFolder item={activeBookmarks} level={0} {onDelete} {onMove} />
		{:else}
			<div class="flex h-full w-full items-center justify-center text-gray-500">
				<p>No bookmarks found</p>
			</div>
		{/if}
	</div>
</div>

