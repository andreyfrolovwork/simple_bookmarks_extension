<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import type { BookmarkItem } from '../types';
	import Icon from './Icon.svelte';
	import { deleteBookmark } from './deleteBookmark';
	import { dragStore } from './dragStore';
	import { moveBookmark } from './moveBookmark';
	import { modalStore } from './modalStore.svelte';

	let { 
		item, 
		parentId,
		onDelete,
		onMove 
	}: { 
		item: BookmarkItem; 
		parentId: string;
		onDelete?: () => void;
		onMove?: () => void;
	} = $props();

	let isDragging = $state(false);
	let isDropTarget = $state(false);
	let dropPosition: 'before' | 'after' | null = $state(null);
	let faviconError = $state(false);

	// Get favicon for site
	function getFavicon(url: string): string {
		try {
			const urlObj = new URL(url);
			return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
		} catch {
			return '';
		}
	}

	// Delete handler
	async function handleDelete(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		await deleteBookmark(item.id, false);
		onDelete?.();
	}

	// Drag and Drop handlers
	function handleDragStart(e: DragEvent) {
		e.stopPropagation();
		
		console.log(`🔖 Drag: ${item.title}`);
		isDragging = true;
		dragStore.setDraggedItem(item, parentId);
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', item.id);
		}
	}

	function handleDragEnd() {
		isDragging = false;
		dragStore.clear();
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		const draggedItem = dragStore.item;
		if (draggedItem && draggedItem.id !== item.id) {
			isDropTarget = true;
			
			// Determine drop position: before or after element
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const midY = rect.top + rect.height / 2;
			dropPosition = e.clientY < midY ? 'before' : 'after';
			
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = 'move';
			}
		}
	}

	function handleDragLeave() {
		isDropTarget = false;
		dropPosition = null;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const currentDropPosition = dropPosition;
		isDropTarget = false;
		dropPosition = null;

		const draggedItem = dragStore.item;
		const draggedFromParentId = dragStore.parentId;
		
		if (!draggedItem || draggedItem.id === item.id) return;

		try {
			// Get children of parent folder
			const parentNode = await chrome.bookmarks.getSubTree(parentId);
			const siblings = parentNode[0]?.children || [];
			let targetIndex = siblings.findIndex((s: chrome.bookmarks.BookmarkTreeNode) => s.id === item.id);

			// If inserting "after", increase index
			if (currentDropPosition === 'after') {
				targetIndex++;
			}

			// If moving within same folder and down, need to adjust index
			if (draggedFromParentId === parentId) {
				const draggedIndex = siblings.findIndex((s: chrome.bookmarks.BookmarkTreeNode) => s.id === draggedItem.id);
				if (draggedIndex !== -1 && draggedIndex < targetIndex) {
					targetIndex--;
				}
			}

			console.log(`✅ Drop: ${draggedItem.title} → ${item.title} (${currentDropPosition})`);

			await moveBookmark(draggedItem.id, {
				parentId: parentId,
				index: targetIndex
			});
			
			setTimeout(() => {
				onMove?.();
			}, 100);
		} catch (error) {
			console.error('❌ Error:', error);
			await modalStore.alert('Failed to move bookmark', 'Error');
		}
	}
</script>

<div class="group relative flex max-w-[350px] shrink-0 self-start">
	<!-- "Insert before" indicator -->
	{#if dropPosition === 'before'}
		<div 
			class="absolute -top-1 left-0 right-0 h-1 z-10"
			style="background-color: var(--accent-primary);"
			transition:scale={{ duration: 200 }}
		></div>
	{/if}
	<!-- "Insert after" indicator -->
	{#if dropPosition === 'after'}
		<div 
			class="absolute -bottom-1 left-0 right-0 h-1 z-10"
			style="background-color: var(--accent-primary);"
			transition:scale={{ duration: 200 }}
		></div>
	{/if}
	
	<a
		href={item.url}
		target="_blank"
		rel="noopener noreferrer"
		draggable="true"
		ondragstart={handleDragStart}
		ondragend={handleDragEnd}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		class="pixel-bookmark"
		class:dragging={isDragging}
		class:drop-target={isDropTarget && !dropPosition}
		title={item.title}
	>
		<span class="bookmark-icon">
			{#if item.url && !faviconError}
				<img
					src={getFavicon(item.url)}
					alt=""
					class="favicon-img"
					onerror={() => { faviconError = true; }}
				/>
			{:else}
				<Icon name="bookmark" size={14} />
			{/if}
		</span>
		<span class="bookmark-title">{item.title}</span>
	</a>
	<button
		onclick={handleDelete}
		class="pixel-delete-btn"
		title="Delete"
	>
		<Icon name="close" size={12} />
	</button>
</div>

<style>
	.bookmark-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		color: var(--text-primary);
		width: 16px;
		height: 16px;
	}

	.favicon-img {
		width: 16px;
		height: 16px;
		image-rendering: pixelated;
	}

	.bookmark-title {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 13px;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pixel-bookmark {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background-color: var(--bg-surface);
		border: 4px solid var(--border);
		color: var(--text-primary);
		text-decoration: none;
		cursor: pointer;
		transition: transform 0.1s steps(2), box-shadow 0.1s;
		box-shadow: 4px 4px 0px var(--shadow);
	}

	.pixel-bookmark:hover {
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0px var(--shadow);
		background-color: var(--accent-secondary);
	}

	.pixel-bookmark.dragging {
		opacity: 0.3;
		transform: scale(0.95);
	}

	.pixel-bookmark.drop-target {
		background-color: var(--accent-primary);
		border-color: var(--accent-primary);
		transform: scale(1.05);
		box-shadow: 6px 6px 0px var(--shadow);
	}

	.pixel-delete-btn {
		position: absolute;
		left: -8px;
		top: -8px;
		width: 24px;
		height: 24px;
		background-color: var(--bg-secondary);
		border: 2px solid var(--border);
		color: var(--text-primary);
		font-size: 12px;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.2s, transform 0.1s steps(2), box-shadow 0.1s;
		box-shadow: 2px 2px 0px var(--shadow);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.group:hover .pixel-delete-btn {
		opacity: 1;
	}

	.pixel-delete-btn:hover {
		background-color: var(--accent-primary);
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0px var(--shadow);
	}

	.pixel-delete-btn:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0px var(--shadow);
	}
</style>

