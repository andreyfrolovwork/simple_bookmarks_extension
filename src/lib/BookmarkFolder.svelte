<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import type { BookmarkItem } from '../types';
	import Bookmark from './Bookmark.svelte';
	import Self from './BookmarkFolder.svelte';
	import Icon from './Icon.svelte';
	import { deleteBookmark } from './deleteBookmark';
	import { dragStore } from './dragStore';
	import { moveBookmark } from './moveBookmark';
	import { createBookmark } from './createBookmark';
	import { updateBookmark } from './updateBookmark';
	import { modalStore } from './modalStore.svelte';

	let { 
		item, 
		level = 0, 
		onDelete,
		onMove 
	}: { 
		item: BookmarkItem; 
		level?: number; 
		onDelete?: () => void;
		onMove?: () => void;
	} = $props();

	let isDraggingFolder = $state(false);
	let dropTargetFolderId = $state<string | null>(null);
	let dropMode: 'into' | 'before' | 'after' | null = $state(null);
	let isRootDropZone = $state(false);
	let editingFolderId = $state<string | null>(null);
	let editingFolderTitle = $state('');

	function isFolder(item: BookmarkItem): boolean {
		return Boolean(item.children !== undefined && !item.url);
	}

	type GroupItem = { type: 'folder'; item: BookmarkItem } | { type: 'bookmarks'; items: BookmarkItem[] };
	
	const groupedItems = $derived(() => {
		if (level !== 0) return [];
		
		const groups: GroupItem[] = [];
		const children = item.children || [];
		
		for (const child of children) {
			if (isFolder(child)) {
				groups.push({ type: 'folder', item: child });
			} else {
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

	async function handleDeleteFolder(folderId: string, folderTitle: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const confirmed = await modalStore.confirm(
			`Are you sure you want to delete "${folderTitle}" and all its contents?`,
			'Delete Folder'
		);
		
		if (confirmed) {
			try {
				await deleteBookmark(folderId, true);
				onDelete?.();
			} catch (error) {
				await modalStore.alert('Failed to delete folder', 'Error');
			}
		}
	}

	async function getNextFolderName(parentFolderId: string): Promise<string> {
		try {
			const parentNode = await chrome.bookmarks.getSubTree(parentFolderId);
			const children = parentNode[0]?.children || [];
			const folders = children.filter((child: chrome.bookmarks.BookmarkTreeNode) => !child.url);
			const folderNames = folders.map((f: chrome.bookmarks.BookmarkTreeNode) => f.title);
			
			let counter = 1;
			let folderName = `folder${counter}`;
			while (folderNames.includes(folderName)) {
				counter++;
				folderName = `folder${counter}`;
			}
			return folderName;
		} catch (error) {
			console.error('❌ Error getting folder name:', error);
			return 'folder1';
		}
	}

	async function handleCreateFolder(parentFolderId: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const folderName = await getNextFolderName(parentFolderId);

		try {
			const result = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
				chrome.bookmarks.create({
					parentId: parentFolderId,
					title: folderName
				}, (bookmark) => {
					if (chrome.runtime.lastError) {
						reject(new Error(chrome.runtime.lastError.message));
					} else {
						resolve(bookmark);
					}
				});
			});
			
			editingFolderId = result.id;
			editingFolderTitle = folderName;
			onMove?.();
			
			setTimeout(() => {
				const input = document.querySelector(`[data-folder-edit="${result.id}"]`) as HTMLInputElement;
				if (input) {
					input.focus();
					input.select();
				}
			}, 100);
		} catch (error) {
			console.error('❌ Error creating folder:', error);
			await modalStore.alert('Failed to create folder', 'Error');
		}
	}

	function handleStartEditFolder(folderId: string, currentTitle: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		editingFolderId = folderId;
		editingFolderTitle = currentTitle;
		
		setTimeout(() => {
			const input = document.querySelector(`[data-folder-edit="${folderId}"]`) as HTMLInputElement;
			if (input) {
				input.focus();
				input.select();
			}
		}, 100);
	}

	async function handleSaveFolder(folderId: string, e?: Event) {
		if (e) {
			e.preventDefault();
			if ('stopPropagation' in e) {
				e.stopPropagation();
			}
		}
		
		if (!editingFolderTitle.trim()) {
			await modalStore.alert('Folder name cannot be empty', 'Error');
			return;
		}

		try {
			await updateBookmark(folderId, { title: editingFolderTitle.trim() });
			editingFolderId = null;
			editingFolderTitle = '';
			onMove?.();
		} catch (error) {
			console.error('❌ Error updating folder:', error);
			await modalStore.alert('Failed to update folder', 'Error');
		}
	}

	function handleCancelEdit(e?: Event) {
		if (e) {
			e.preventDefault();
			if ('stopPropagation' in e) {
				e.stopPropagation();
			}
		}
		editingFolderId = null;
		editingFolderTitle = '';
	}

	async function handleCreateBookmark(parentFolderId: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const data = await modalStore.bookmarkPrompt();
		if (!data || !data.url) return;

		try {
			await createBookmark(parentFolderId, data.title, data.url);
			onMove?.();
		} catch (error) {
			console.error('❌ Error creating bookmark:', error);
			await modalStore.alert('Failed to create bookmark', 'Error');
		}
	}

	function handleFolderDragStart(folderItem: BookmarkItem, e: DragEvent) {
		e.stopPropagation();
		isDraggingFolder = true;
		dragStore.setDraggedItem(folderItem, item.id);
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', folderItem.id);
		}
	}

	function handleFolderDragEnd() {
		isDraggingFolder = false;
		dragStore.clear();
	}

	function handleFolderDragOver(folderItem: BookmarkItem, e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const draggedItem = dragStore.item;
		
		if (draggedItem && draggedItem.id !== folderItem.id) {
			dropTargetFolderId = folderItem.id;
			
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const y = e.clientY - rect.top;
			const height = rect.height;
			
			if (y < height * 0.25) {
				dropMode = 'before';
			} else if (y > height * 0.75) {
				dropMode = 'after';
			} else {
				dropMode = 'into';
			}
			
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = 'move';
			}
		}
	}

	function handleFolderDragLeave() {
		dropTargetFolderId = null;
		dropMode = null;
	}

	function handleRootDragOver(e: DragEvent) {
		e.preventDefault();
		const draggedItem = dragStore.item;
		if (draggedItem && level === 0) {
			isRootDropZone = true;
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = 'move';
			}
		}
	}

	function handleRootDragLeave() {
		isRootDropZone = false;
	}

	async function handleRootDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isRootDropZone = false;

		const draggedItem = dragStore.item;
		if (!draggedItem) return;

		try {
			const children = item.children || [];
			await moveBookmark(draggedItem.id, {
				parentId: item.id,
				index: children.length
			});

			setTimeout(() => {
				onMove?.();
			}, 100);
		} catch (error) {
			console.error('❌ Error:', error);
			await modalStore.alert('Failed to move item', 'Error');
		}
	}

	async function handleFolderDrop(targetFolder: BookmarkItem, e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const currentDropMode = dropMode;
		dropTargetFolderId = null;
		dropMode = null;

		const draggedItem = dragStore.item;
		const draggedFromParentId = dragStore.parentId;
		
		if (!draggedItem || draggedItem.id === targetFolder.id) {
			return;
		}

		if (currentDropMode === 'into' && isFolder(draggedItem)) {
			if (draggedItem.id === targetFolder.id || draggedItem.id === targetFolder.parentId) {
				await modalStore.alert('Cannot move folder into itself', 'Invalid Operation');
				return;
			}
			try {
				const draggedTree = await chrome.bookmarks.getSubTree(draggedItem.id);
				const checkDescendant = (node: chrome.bookmarks.BookmarkTreeNode): boolean => {
					if (node.id === targetFolder.id) return true;
					if (node.children) {
						return node.children.some(checkDescendant);
					}
					return false;
				};
				if (checkDescendant(draggedTree[0])) {
					await modalStore.alert('Cannot move folder into its subfolder', 'Invalid Operation');
					return;
				}
			} catch (error) {
				console.error('❌ Error checking recursion:', error);
			}
		}

		try {
			let destination: { parentId: string; index: number };

			if (currentDropMode === 'into') {
				destination = {
					parentId: targetFolder.id,
					index: 0
				};
			} else {
				const targetFolderInfo = await chrome.bookmarks.get(targetFolder.id);
				const targetParentId = targetFolderInfo[0]?.parentId;
				
				if (!targetParentId) {
					throw new Error('Failed to determine parent folder');
				}

				const parentNode = await chrome.bookmarks.getSubTree(targetParentId);
				const siblings = parentNode[0]?.children || [];
				let targetIndex = siblings.findIndex((s: chrome.bookmarks.BookmarkTreeNode) => s.id === targetFolder.id);

				if (currentDropMode === 'after') {
					targetIndex++;
				}

				if (draggedFromParentId === targetParentId) {
					const draggedIndex = siblings.findIndex((s: chrome.bookmarks.BookmarkTreeNode) => s.id === draggedItem.id);
					if (draggedIndex !== -1 && draggedIndex < targetIndex) {
						targetIndex--;
					}
				}

				destination = {
					parentId: targetParentId,
					index: targetIndex
				};
			}

			await moveBookmark(draggedItem.id, destination);
			
			setTimeout(() => {
				onMove?.();
			}, 100);
		} catch (error) {
			console.error('❌ Move error:', error);
			await modalStore.alert('Failed to move item', 'Error');
		}
	}
</script>

{#if level === 0}
	<!-- Root level - horizontal list -->
	<div 
		class="pixel-root-container"
		role="region"
		ondragover={handleRootDragOver}
		ondragleave={handleRootDragLeave}
		ondrop={handleRootDrop}
	>
		{#each groupedItems() as group, index (index)}
			{#if group.type === 'folder'}
				<!-- Folder -->
				<div 
					class="pixel-folder"
					class:dragging={isDraggingFolder && dragStore.item?.id === group.item.id}
					class:drop-into={dropTargetFolderId === group.item.id && dropMode === 'into'}
					draggable="true"
					role="button"
					tabindex="0"
					ondragstart={(e) => handleFolderDragStart(group.item, e)}
					ondragend={handleFolderDragEnd}
					ondragover={(e) => handleFolderDragOver(group.item, e)}
					ondragleave={handleFolderDragLeave}
					ondrop={(e) => handleFolderDrop(group.item, e)}
					title={group.item.title}
				>
					{#if dropTargetFolderId === group.item.id && dropMode === 'before'}
						<div class="drop-indicator-before" transition:scale={{ duration: 200 }}></div>
					{/if}
					{#if dropTargetFolderId === group.item.id && dropMode === 'after'}
						<div class="drop-indicator-after" transition:scale={{ duration: 200 }}></div>
					{/if}
					
					<div class="folder-header">
						<span class="folder-icon">
							<Icon name="folder" size={16} />
						</span>
						{#if editingFolderId === group.item.id}
							<input
								data-folder-edit={group.item.id}
								type="text"
								bind:value={editingFolderTitle}
								class="folder-input"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										handleSaveFolder(group.item.id, e);
									} else if (e.key === 'Escape') {
										handleCancelEdit(e);
									}
								}}
								onclick={(e) => e.stopPropagation()}
							/>
						{:else}
							<h3 class="folder-title">{group.item.title}</h3>
						{/if}
					</div>
					
					<div class="folder-content">
						{#if group.item.children?.length}
							<Self item={group.item} level={1} {onDelete} {onMove} />
						{:else}
							<div class="folder-empty">Empty</div>
						{/if}
					</div>
					
					<div class="folder-actions">
						{#if editingFolderId === group.item.id}
							<button
								onclick={(e) => handleSaveFolder(group.item.id, e)}
								class="pixel-action-btn"
								title="Save"
							>
								<Icon name="check" size={12} />
							</button>
						{:else}
							<button
								onclick={(e) => handleCreateBookmark(group.item.id, e)}
								class="pixel-action-btn"
								title="Add bookmark"
							>
								<Icon name="add" size={12} />
							</button>
							<button
								onclick={(e) => handleCreateFolder(group.item.id, e)}
								class="pixel-action-btn"
								title="Add folder"
							>
								<Icon name="folder" size={12} />
							</button>
							<button
								onclick={(e) => handleStartEditFolder(group.item.id, group.item.title, e)}
								class="pixel-action-btn"
								title="Edit"
							>
								<Icon name="edit" size={12} />
							</button>
							<button
								onclick={(e) => handleDeleteFolder(group.item.id, group.item.title, e)}
								class="pixel-action-btn pixel-action-danger"
								title="Delete"
							>
								<Icon name="trash" size={12} />
							</button>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Bookmark group -->
				<div class="pixel-bookmark-group">
					{#each group.items as bookmark (bookmark.id)}
						<div transition:fly={{ y: 10, duration: 300 }}>
							<Bookmark item={bookmark} parentId={item.id} {onDelete} {onMove} />
						</div>
					{/each}
					<button
						onclick={(e) => {
							e.preventDefault();
							handleCreateBookmark(item.id, e);
						}}
						class="pixel-add-btn"
						title="Add bookmark"
					>
						<Icon name="add" size={20} />
					</button>
				</div>
			{/if}
		{/each}
		
		<div class="pixel-create-buttons">
			<button
				onclick={(e) => {
					e.preventDefault();
					handleCreateBookmark(item.id, e);
				}}
				class="pixel-button"
			>
				<Icon name="bookmark" size={16} />
				<span>Create Bookmark</span>
			</button>
			<button
				onclick={(e) => {
					e.preventDefault();
					handleCreateFolder(item.id, e);
				}}
				class="pixel-button pixel-button-primary"
			>
				<Icon name="folder" size={16} />
				<span>Create Folder</span>
			</button>
		</div>
		
		{#if isRootDropZone}
			<div class="pixel-drop-zone" transition:scale={{ duration: 200 }}>
				Move here
			</div>
		{/if}
	</div>
{:else}
	<!-- Nested levels - vertical list -->
	<div class="pixel-nested-container">
		{#each item.children || [] as child (child.id)}
			{#if isFolder(child)}
				<div 
					class="pixel-nested-folder"
					class:dragging={isDraggingFolder && dragStore.item?.id === child.id}
					class:drop-into={dropTargetFolderId === child.id && dropMode === 'into'}
					draggable="true"
					role="button"
					tabindex="0"
					ondragstart={(e) => handleFolderDragStart(child, e)}
					ondragend={handleFolderDragEnd}
					ondragover={(e) => handleFolderDragOver(child, e)}
					ondragleave={handleFolderDragLeave}
					ondrop={(e) => handleFolderDrop(child, e)}
					title={child.title}
				>
					{#if dropTargetFolderId === child.id && dropMode === 'before'}
						<div class="drop-indicator-before" transition:scale={{ duration: 200 }}></div>
					{/if}
					{#if dropTargetFolderId === child.id && dropMode === 'after'}
						<div class="drop-indicator-after" transition:scale={{ duration: 200 }}></div>
					{/if}
					
					<div class="nested-folder-header">
						<span class="folder-icon">
							<Icon name="folder" size={14} />
						</span>
						{#if editingFolderId === child.id}
							<input
								data-folder-edit={child.id}
								type="text"
								bind:value={editingFolderTitle}
								class="folder-input"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										handleSaveFolder(child.id, e);
									} else if (e.key === 'Escape') {
										handleCancelEdit(e);
									}
								}}
								onclick={(e) => e.stopPropagation()}
							/>
						{:else}
							<h3 class="folder-title">{child.title}</h3>
						{/if}
						
						<div class="nested-folder-actions">
							{#if editingFolderId === child.id}
								<button
									onclick={(e) => handleSaveFolder(child.id, e)}
									class="pixel-action-btn-small"
									title="Save"
								>
									<Icon name="check" size={10} />
								</button>
							{:else}
								<button
									onclick={(e) => handleCreateBookmark(child.id, e)}
									class="pixel-action-btn-small"
									title="Add bookmark"
								>
									<Icon name="add" size={10} />
								</button>
								<button
									onclick={(e) => handleCreateFolder(child.id, e)}
									class="pixel-action-btn-small"
									title="Add folder"
								>
									<Icon name="folder" size={10} />
								</button>
								<button
									onclick={(e) => handleStartEditFolder(child.id, child.title, e)}
									class="pixel-action-btn-small"
									title="Edit"
								>
									<Icon name="edit" size={10} />
								</button>
								<button
									onclick={(e) => handleDeleteFolder(child.id, child.title, e)}
									class="pixel-action-btn-small pixel-action-danger"
									title="Delete"
								>
									<Icon name="trash" size={10} />
								</button>
							{/if}
						</div>
					</div>
					
					<div class="nested-folder-content">
						{#if child.children?.length}
							<Self item={child} level={level + 1} {onDelete} {onMove} />
							<div class="nested-add-bookmark">
								<button
									onclick={(e) => {
										e.stopPropagation();
										handleCreateBookmark(child.id, e);
									}}
									class="pixel-add-btn-small"
									title="Add bookmark"
								>
									<Icon name="add" size={14} />
								</button>
							</div>
						{:else}
							<div class="folder-empty-nested">Empty</div>
						{/if}
					</div>
				</div>
			{:else}
				<div transition:fly={{ y: 10, duration: 300 }}>
					<Bookmark item={child} parentId={item.id} {onDelete} {onMove} />
				</div>
			{/if}
		{/each}
	</div>
{/if}

<style>
	/* Root container */
	.pixel-root-container {
		display: flex;
		height: 100%;
		width: 100%;
		gap: 12px;
		overflow-x: scroll;
		padding: 16px;
		background-color: var(--bg-primary);
	}

	/* Folder styles */
	.pixel-folder {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex-shrink: 0;
		align-self: flex-start;
		padding: 12px;
		background-color: var(--bg-surface);
		border: 1px solid transparent;
		box-shadow: 4px 4px 0px var(--shadow);
		transition: transform 0.1s steps(2), box-shadow 0.1s, opacity 0.2s, border-color 0.1s;
		min-width: 200px;
	}

	.pixel-folder:hover {
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0px var(--shadow);
		border-color: var(--border-folder);
	}

	.pixel-folder.dragging {
		opacity: 0.3;
		transform: scale(0.95);
	}

	.pixel-folder.drop-into {
		background-color: var(--accent-primary);
		border-color: var(--accent-primary);
		transform: scale(1.05);
		box-shadow: 6px 6px 0px var(--shadow);
	}

	/* Folder header */
	.folder-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.folder-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		color: var(--text-primary);
	}

	.folder-title {
		font-size: 10px;
		font-weight: bold;
		color: var(--text-primary);
		margin: 0;
	}

	.folder-input {
		flex: 1;
		background-color: var(--bg-surface);
		border: 2px solid var(--accent-primary);
		color: var(--text-primary);
		padding: 4px 8px;
		font-size: 10px;
		font-family: 'Press Start 2P', monospace;
	}

	.folder-input:focus {
		outline: none;
		box-shadow: inset 2px 2px 0px var(--shadow);
	}

	/* Folder content */
	.folder-content {
		position: relative;
	}

	.folder-empty {
		padding: 8px;
		text-align: center;
		font-size: 8px;
		color: var(--text-secondary);
	}

	/* Folder actions */
	.folder-actions {
		position: absolute;
		top: -8px;
		right: 8px;
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.pixel-folder:hover .folder-actions {
		opacity: 1;
	}

	.pixel-action-btn {
		width: 24px;
		height: 24px;
		background-color: var(--bg-secondary);
		border: 2px solid var(--border);
		color: var(--text-primary);
		font-size: 12px;
		cursor: pointer;
		transition: transform 0.1s steps(2), box-shadow 0.1s;
		box-shadow: 2px 2px 0px var(--shadow);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pixel-action-btn:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0px var(--shadow);
		background-color: var(--accent-secondary);
	}

	.pixel-action-btn:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0px var(--shadow);
	}

	.pixel-action-danger:hover {
		background-color: #ff6b6b;
	}

	/* Bookmark group */
	.pixel-bookmark-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex-shrink: 0;
	}

	.pixel-add-btn {
		width: 40px;
		height: 40px;
		background-color: var(--bg-surface);
		border: 4px dashed var(--border);
		color: var(--text-secondary);
		font-size: 20px;
		cursor: pointer;
		transition: all 0.1s;
		align-self: flex-start;
	}

	.pixel-add-btn:hover {
		background-color: var(--accent-secondary);
		border-color: var(--accent-primary);
		border-style: solid;
		color: var(--text-primary);
	}

	/* Create buttons */
	.pixel-create-buttons {
		display: flex;
		flex-direction: column;
		gap: 12px;
		flex-shrink: 0;
		align-self: flex-start;
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
		white-space: nowrap;
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

	/* Drop zone */
	.pixel-drop-zone {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 100px;
		height: 100%;
		flex-shrink: 0;
		border: 4px dashed var(--accent-primary);
		background-color: var(--bg-secondary);
		padding: 16px;
		font-size: 10px;
		color: var(--accent-primary);
		text-transform: uppercase;
	}

	/* Drop indicators */
	.drop-indicator-before,
	.drop-indicator-after {
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background-color: var(--accent-primary);
		z-index: 20;
		box-shadow: 0 0 4px var(--accent-primary);
	}

	.drop-indicator-before {
		top: -2px;
	}

	.drop-indicator-after {
		bottom: -2px;
	}

	/* Nested styles */
	.pixel-nested-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.pixel-nested-folder {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 8px;
		border-left: 1px solid transparent;
		padding-left: 12px;
		transition: all 0.1s;
	}

	.pixel-nested-folder:hover {
		border-left-color: var(--border-folder);
	}

	.pixel-nested-folder.dragging {
		opacity: 0.3;
		transform: scale(0.95);
	}

	.pixel-nested-folder.drop-into {
		background-color: var(--bg-secondary);
		border-color: var(--accent-primary);
		transform: scale(1.05);
	}

	.nested-folder-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.nested-folder-actions {
		display: flex;
		gap: 4px;
		margin-left: auto;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.pixel-nested-folder:hover .nested-folder-actions {
		opacity: 1;
	}

	.pixel-action-btn-small {
		width: 16px;
		height: 16px;
		background-color: var(--bg-secondary);
		border: 2px solid var(--border);
		color: var(--text-primary);
		font-size: 10px;
		cursor: pointer;
		transition: all 0.1s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pixel-action-btn-small:hover {
		background-color: var(--accent-secondary);
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0px var(--shadow);
	}

	.nested-folder-content {
		position: relative;
	}

	.folder-empty-nested {
		padding: 4px 8px;
		font-size: 8px;
		color: var(--text-secondary);
	}

	.nested-add-bookmark {
		margin-top: 4px;
		display: flex;
	}

	.pixel-add-btn-small {
		width: 24px;
		height: 24px;
		background-color: var(--bg-surface);
		border: 2px dashed var(--border);
		color: var(--text-secondary);
		font-size: 14px;
		cursor: pointer;
		transition: all 0.1s;
	}

	.pixel-add-btn-small:hover {
		background-color: var(--accent-secondary);
		border-style: solid;
		border-color: var(--accent-primary);
		color: var(--text-primary);
	}
</style>
