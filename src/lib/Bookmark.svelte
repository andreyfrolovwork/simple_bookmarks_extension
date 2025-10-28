<script lang="ts">
	import type { BookmarkItem } from '../types';
	import { deleteBookmark } from './deleteBookmark';
	import { dragStore } from './dragStore';
	import { moveBookmark } from './moveBookmark';

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

	// Получаем фавикон для сайта
	function getFavicon(url: string): string {
		try {
			const urlObj = new URL(url);
			return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
		} catch {
			return '';
		}
	}

	// Обработчик удаления
	async function handleDelete(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		await deleteBookmark(item.id, false);
		onDelete?.();
	}

	// Drag and Drop обработчики
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
			
			// Определяем позицию drop: перед или после элемента
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
			// Получаем дочерние элементы родительской папки
			const parentNode = await chrome.bookmarks.getSubTree(parentId);
			const siblings = parentNode[0]?.children || [];
			let targetIndex = siblings.findIndex((s: chrome.bookmarks.BookmarkTreeNode) => s.id === item.id);

			// Если вставляем "после", увеличиваем индекс
			if (currentDropPosition === 'after') {
				targetIndex++;
			}

			// Если перемещаем в той же папке и вниз, нужно скорректировать индекс
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
			console.error('❌ Ошибка:', error);
			alert('Не удалось переместить закладку');
		}
	}
</script>

<div class="group relative flex max-w-[350px] shrink-0 self-start">
	<!-- Индикатор "вставить перед" -->
	{#if dropPosition === 'before'}
		<div class="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-10"></div>
	{/if}
	<!-- Индикатор "вставить после" -->
	{#if dropPosition === 'after'}
		<div class="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 z-10"></div>
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
		class="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all hover:border-blue-400 hover:shadow-md {isDragging ? 'opacity-50' : ''} {isDropTarget && !dropPosition ? 'border-blue-500 bg-blue-50 border-2' : ''}"
		title={item.title}
	>
		{#if item.url}
			<img
				src={getFavicon(item.url)}
				alt=""
				class="size-4 shrink-0"
				onerror={(e) => {
					if (e.currentTarget instanceof HTMLImageElement) {
						e.currentTarget.style.display = 'none';
					}
				}}
			/>
		{/if}
		<span class="truncate text-sm font-medium text-gray-700">{item.title}</span>
	</a>
	<button
		onclick={handleDelete}
		class="absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full bg-gray-400 text-white opacity-0 transition-opacity hover:bg-gray-600 group-hover:opacity-100 [.group:not(:hover)_&]:!opacity-0"
		title="Удалить"
	>
		<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
		</svg>
	</button>
</div>

