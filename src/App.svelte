<script lang="ts">
	import { onMount } from 'svelte';
	import BookmarksBar from './lib/BookmarksBar.svelte';
	import Modal from './lib/Modal.svelte';
	import { loadBookmarks } from './lib/loadBookmarks';
	import { themeStore } from './lib/themeStore.svelte';
	import type { BookmarkItem } from './types';

	let bookmarks = $state<BookmarkItem[]>([]);
	let loading = $state(true);

	async function reloadBookmarks() {
		console.log('🔄 Reloading bookmarks');
		bookmarks = await loadBookmarks();
	}

	onMount(async () => {
		// Инициализация темы
		themeStore.init();
		
		await reloadBookmarks();
		loading = false;
	});
</script>

<svelte:head>
	<title>Bookmark Manager</title>
	<meta name="description" content="Browser bookmark manager" />
</svelte:head>

{#if loading}
	<div class="flex h-screen items-center justify-center" style="background-color: var(--bg-primary);">
		<div style="
			padding: 24px;
			background-color: var(--bg-surface);
			border: 4px solid var(--border);
			box-shadow: 4px 4px 0px var(--shadow);
			color: var(--text-primary);
		">
			<p>Loading...</p>
		</div>
	</div>
{:else}
	<BookmarksBar {bookmarks} onDelete={reloadBookmarks} onMove={reloadBookmarks} />
{/if}

<Modal />
