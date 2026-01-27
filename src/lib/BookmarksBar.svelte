<script lang="ts">
	import type { BookmarkItem, FolderType } from '../types';
	import BookmarkFolder from './BookmarkFolder.svelte';
	import { createBookmark } from './createBookmark';
	import { modalStore } from './modalStore.svelte';

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

	// Get all folders from root
	const rootFolders = $derived(bookmarks[0]?.children || []);

	// Get bookmarks for active tab
	const activeBookmarks = $derived(
		rootFolders.find((item) => item.folderType === activeTab)
	);

	// Create new folder in empty state
	async function handleCreateFolder(e: MouseEvent) {
		e.preventDefault();
		
		const title = await modalStore.prompt('Enter folder name:');
		if (!title) return;

		try {
			await createBookmark(activeBookmarks?.id || '1', title);
			onMove?.();
		} catch (error) {
			console.error('❌ Error creating folder:', error);
			await modalStore.alert('Failed to create folder', 'Error');
		}
	}

	// Create new bookmark in empty state
	async function handleCreateBookmark(e: MouseEvent) {
		e.preventDefault();
		
		const data = await modalStore.bookmarkPrompt();
		if (!data) return;

		try {
			await createBookmark(activeBookmarks?.id || '1', data.title, data.url || '');
			onMove?.();
		} catch (error) {
			console.error('❌ Error creating bookmark:', error);
			await modalStore.alert('Failed to create bookmark', 'Error');
		}
	}
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

	<!-- Bookmark content -->
	<div class="flex flex-1 overflow-hidden bg-gray-50">
		{#if activeBookmarks && activeBookmarks.children && activeBookmarks.children.length > 0}
			<BookmarkFolder item={activeBookmarks} level={0} {onDelete} {onMove} />
		{:else}
			<div class="flex h-full w-full flex-col items-center justify-center gap-6 text-gray-500">
				<div class="text-center">
					<svg class="mx-auto mb-4 size-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
					</svg>
					<p class="text-lg font-medium">No bookmarks yet</p>
					<p class="mt-1 text-sm text-gray-400">Create your first bookmark or folder to get started</p>
				</div>
				
				<div class="flex gap-3">
					<button
						onclick={handleCreateFolder}
						class="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
					>
						<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
						Create Folder
					</button>
					
					<button
						onclick={handleCreateBookmark}
						class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
					>
						<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
						Create Bookmark
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

