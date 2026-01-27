<script lang="ts">
	import type { BookmarkItem, FolderType } from '../types';
	import BookmarkFolder from './BookmarkFolder.svelte';
	import SearchBar from './SearchBar.svelte';
	import SearchResults from './SearchResults.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import Icon from './Icon.svelte';
	import { createBookmark } from './createBookmark';
	import { modalStore } from './modalStore.svelte';
	import { searchStore } from './searchStore.svelte';
	import { prepareBookmarksForSearch } from './flattenBookmarks';
	import { onMount } from 'svelte';

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

	// Инициализация данных для поиска
	onMount(() => {
		const flatBookmarks = prepareBookmarksForSearch(bookmarks);
		searchStore.setBookmarks(flatBookmarks);
	});

	// Обновление данных поиска при изменении закладок
	$effect(() => {
		if (bookmarks.length > 0) {
			const flatBookmarks = prepareBookmarksForSearch(bookmarks);
			searchStore.setBookmarks(flatBookmarks);
		}
	});

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
		if (!data || !data.url) return;

		try {
			await createBookmark(activeBookmarks?.id || '1', data.title, data.url);
			onMove?.();
		} catch (error) {
			console.error('❌ Error creating bookmark:', error);
			await modalStore.alert('Failed to create bookmark', 'Error');
		}
	}
</script>

<div class="flex h-screen flex-col" style="background-color: var(--bg-primary);">
	<!-- Вкладки и поиск -->
	<div style="
		background-color: var(--bg-surface);
		border-bottom: 4px solid var(--border);
		box-shadow: 0 4px 0px var(--shadow);
	">
		<div class="flex items-center gap-2 px-4 py-2">
			<!-- Вкладки слева -->
			<div class="flex gap-2 {searchStore.isActive ? 'hidden' : ''}">
				{#each Object.keys(tabNames) as tab}
					<button
						onclick={() => (activeTab = tab as FolderType)}
						class="pixel-tab"
						class:active={activeTab === tab}
					>
						{tabNames[tab as FolderType]}
					</button>
				{/each}
			</div>

			<!-- Поиск и тема справа -->
			<div class="ml-auto flex items-center gap-2">
				<ThemeToggle />
				<SearchBar />
			</div>
		</div>
	</div>

	<!-- Bookmark content -->
	<div class="flex flex-1 overflow-hidden" style="background-color: var(--bg-primary);">
		{#if !searchStore.isActive}
			{#if activeBookmarks && activeBookmarks.children && activeBookmarks.children.length > 0}
				<BookmarkFolder item={activeBookmarks} level={0} {onDelete} {onMove} />
			{:else}
				<div class="flex h-full w-full flex-col items-center justify-center gap-6" style="color: var(--text-secondary);">
					<div class="text-center">
						<div style="margin-bottom: 16px;">
							<Icon name="folder" size={48} />
						</div>
						<p style="font-size: 14px; margin-bottom: 8px; color: var(--text-primary);">No bookmarks yet</p>
						<p style="font-size: 10px;">Create your first bookmark or folder to get started</p>
					</div>
					
					<div class="flex gap-3">
						<button
							onclick={handleCreateFolder}
							class="pixel-button pixel-button-primary"
						>
							<Icon name="folder" size={16} />
							<span>Create Folder</span>
						</button>
						
						<button
							onclick={handleCreateBookmark}
							class="pixel-button"
						>
							<Icon name="bookmark" size={16} />
							<span>Create Bookmark</span>
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Результаты поиска (overlay) -->
	<SearchResults />
</div>

<style>
	.pixel-tab {
		padding: 8px 16px;
		background-color: var(--bg-secondary);
		border: 4px solid var(--border);
		color: var(--text-primary);
		font-size: 10px;
		cursor: pointer;
		transition: transform 0.1s steps(2), box-shadow 0.1s;
		box-shadow: 2px 2px 0px var(--shadow);
		text-transform: uppercase;
	}

	.pixel-tab:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0px var(--shadow);
		background-color: var(--accent-secondary);
	}

	.pixel-tab.active {
		background-color: var(--accent-primary);
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0px var(--shadow);
	}

	.pixel-button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background-color: var(--bg-surface);
		border: 4px solid var(--border);
		color: var(--text-primary);
		font-size: 10px;
		cursor: pointer;
		transition: transform 0.1s steps(2), box-shadow 0.1s;
		box-shadow: 4px 4px 0px var(--shadow);
		text-transform: uppercase;
	}

	.pixel-button:hover {
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0px var(--shadow);
	}

	.pixel-button:active {
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0px var(--shadow);
	}

	.pixel-button-primary {
		background-color: var(--accent-primary);
	}
</style>

