<script lang="ts">
	import { onMount } from 'svelte';
	import BookmarksBar from './lib/BookmarksBar.svelte';
	import { loadBookmarks } from './lib/loadBookmarks';
	import type { BookmarkItem } from './types';

	let bookmarks = $state<BookmarkItem[]>([]);
	let loading = $state(true);

	async function reloadBookmarks() {
		bookmarks = await loadBookmarks();
	}

	onMount(async () => {
		await reloadBookmarks();
		loading = false;
	});
</script>

<svelte:head>
	<title>Менеджер закладок</title>
	<meta name="description" content="Менеджер закладок браузера" />
</svelte:head>

{#if loading}
	<div class="flex h-screen items-center justify-center">
		<p class="text-gray-500">Загрузка закладок...</p>
	</div>
{:else}
	<BookmarksBar {bookmarks} onDelete={reloadBookmarks} />
{/if}
