<script lang="ts">
	import { onMount } from 'svelte';
	import BookmarksBar from './lib/BookmarksBar.svelte';
	import Modal from './lib/Modal.svelte';
	import { loadBookmarks } from './lib/loadBookmarks';
	import type { BookmarkItem } from './types';

	let bookmarks = $state<BookmarkItem[]>([]);
	let loading = $state(true);

	async function reloadBookmarks() {
		console.log('🔄 Reloading bookmarks');
		bookmarks = await loadBookmarks();
	}

	onMount(async () => {
		await reloadBookmarks();
		loading = false;
	});
</script>

<svelte:head>
	<title>Bookmark Manager</title>
	<meta name="description" content="Browser bookmark manager" />
</svelte:head>

{#if loading}
	<div class="flex h-screen items-center justify-center">
		<p class="text-gray-500">Loading bookmarks...</p>
	</div>
{:else}
	<BookmarksBar {bookmarks} onDelete={reloadBookmarks} onMove={reloadBookmarks} />
{/if}

<Modal />
