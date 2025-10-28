<script lang="ts">
	import type { BookmarkItem } from '../types';
	import Bookmark from './Bookmark.svelte';
	import Self from './BookmarkFolder.svelte';
	import { deleteBookmark } from './deleteBookmark';
	import { dragStore } from './dragStore';
	import { moveBookmark } from './moveBookmark';
	import { createBookmark } from './createBookmark';

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

	// Проверяем является ли элемент папкой (есть children, но нет url)
	function isFolder(item: BookmarkItem): boolean {
		return Boolean(item.children && item.children.length > 0 && !item.url);
	}

	// Группируем последовательные закладки для корневого уровня
	type GroupItem = { type: 'folder'; item: BookmarkItem } | { type: 'bookmarks'; items: BookmarkItem[] };
	
	const groupedItems = $derived(() => {
		if (level !== 0) return [];
		
		const groups: GroupItem[] = [];
		const children = item.children || [];
		
		for (const child of children) {
			if (isFolder(child)) {
				// Папка идет отдельно
				groups.push({ type: 'folder', item: child });
			} else {
				// Закладка - добавляем к последней группе закладок или создаем новую
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

	// Обработчик удаления папки
	async function handleDeleteFolder(folderId: string, folderTitle: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		if (confirm(`Удалить папку "${folderTitle}" и всё её содержимое?`)) {
			try {
				await deleteBookmark(folderId, true);
				onDelete?.();
			} catch (error) {
				alert('Не удалось удалить папку');
			}
		}
	}

	// Создание новой папки
	async function handleCreateFolder(parentFolderId: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const title = prompt('Название новой папки:');
		if (!title) return;

		try {
			await createBookmark(parentFolderId, title);
			onMove?.();
		} catch (error) {
			console.error('❌ Ошибка создания папки:', error);
			alert('Не удалось создать папку');
		}
	}

	// Создание новой закладки
	async function handleCreateBookmark(parentFolderId: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const url = prompt('URL закладки:');
		if (!url) return;

		const title = prompt('Название закладки:', url);
		if (!title) return;

		try {
			await createBookmark(parentFolderId, title, url);
			onMove?.();
		} catch (error) {
			console.error('❌ Ошибка создания закладки:', error);
			alert('Не удалось создать закладку');
		}
	}

	// Drag and Drop для папок
	function handleFolderDragStart(folderItem: BookmarkItem, e: DragEvent) {
		// Останавливаем всплытие, чтобы родительские папки не перехватили событие
		e.stopPropagation();
		
		console.log(`📁 Drag: ${folderItem.title}`);
		isDraggingFolder = true;
		dragStore.setDraggedItem(folderItem, item.id);
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', folderItem.id);
		}
	}

	function handleFolderDragEnd() {
		console.log('🏁 DragEnd');
		isDraggingFolder = false;
		dragStore.clear();
	}

	let lastLoggedFolder = '';
	let logCount = 0;

	function handleFolderDragOver(folderItem: BookmarkItem, e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const draggedItem = dragStore.item;
		
		if (draggedItem && draggedItem.id !== folderItem.id) {
			dropTargetFolderId = folderItem.id;
			
			// Определяем режим drop: перед, внутрь или после
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const y = e.clientY - rect.top;
			const height = rect.height;
			
			// Верхняя четверть - "before", нижняя четверть - "after", середина - "into"
			if (y < height * 0.25) {
				dropMode = 'before';
			} else if (y > height * 0.75) {
				dropMode = 'after';
			} else {
				dropMode = 'into';
			}

			// Логируем только раз в 10 вызовов или при смене папки/режима
			const currentKey = `${folderItem.id}-${dropMode}`;
			if (lastLoggedFolder !== currentKey) {
				console.log(`📍 Over: ${folderItem.title} (${dropMode})`);
				lastLoggedFolder = currentKey;
				logCount = 0;
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

	// Обработчики для корневой drop зоны (перемещение в конец)
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
			console.log(`✅ Drop: ${draggedItem.title} → конец списка`);

			await moveBookmark(draggedItem.id, {
				parentId: item.id,
				index: children.length
			});

			setTimeout(() => {
				onMove?.();
			}, 100);
		} catch (error) {
			console.error('❌ Ошибка:', error);
			alert('Не удалось переместить элемент');
		}
	}

	// Проверка на рекурсию - нельзя переместить папку в саму себя или в свою дочернюю папку
	function isDescendant(parentId: string, childId: string, allItems: BookmarkItem[]): boolean {
		const findItem = (id: string): BookmarkItem | null => {
			for (const i of allItems) {
				if (i.id === id) return i;
				if (i.children) {
					const found = findInChildren(i.children, id);
					if (found) return found;
				}
			}
			return null;
		};
		
		const findInChildren = (children: BookmarkItem[], id: string): BookmarkItem | null => {
			for (const child of children) {
				if (child.id === id) return child;
				if (child.children) {
					const found = findInChildren(child.children, id);
					if (found) return found;
				}
			}
			return null;
		};
		
		let current = findItem(childId);
		while (current && current.parentId) {
			if (current.parentId === parentId) return true;
			current = findItem(current.parentId);
		}
		return false;
	}

	async function handleFolderDrop(targetFolder: BookmarkItem, e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		const currentDropMode = dropMode;
		dropTargetFolderId = null;
		dropMode = null;

		const draggedItem = dragStore.item;
		const draggedFromParentId = dragStore.parentId;
		
		console.log(`🎯 Drop начат: ${draggedItem?.title} → ${targetFolder.title} (${currentDropMode})`);
		
		if (!draggedItem || draggedItem.id === targetFolder.id) {
			console.log('⚠️ Отменено: тот же элемент');
			return;
		}

		// Защита от рекурсии для папок
		if (currentDropMode === 'into' && isFolder(draggedItem)) {
			if (draggedItem.id === targetFolder.id || draggedItem.id === targetFolder.parentId) {
				alert('Нельзя переместить папку в саму себя');
				return;
			}
			// Дополнительная проверка через API
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
					alert('Нельзя переместить папку в её дочернюю папку');
					return;
				}
			} catch (error) {
				console.error('❌ Ошибка проверки рекурсии:', error);
			}
		}

		try {
			let destination: { parentId: string; index: number };

			if (currentDropMode === 'into') {
				// Вставляем внутрь папки
				destination = {
					parentId: targetFolder.id,
					index: 0
				};
			} else {
				// Вставляем перед или после папки - нужно найти её родителя
				// Получаем информацию о целевой папке
				const targetFolderInfo = await chrome.bookmarks.get(targetFolder.id);
				const targetParentId = targetFolderInfo[0]?.parentId;
				
				if (!targetParentId) {
					throw new Error('Не удалось определить родительскую папку');
				}

				// Получаем siblings из родительской папки целевой папки
				const parentNode = await chrome.bookmarks.getSubTree(targetParentId);
				const siblings = parentNode[0]?.children || [];
				let targetIndex = siblings.findIndex((s: chrome.bookmarks.BookmarkTreeNode) => s.id === targetFolder.id);

				if (currentDropMode === 'after') {
					targetIndex++;
				}

				// Корректировка если перемещаем в той же папке
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

			console.log(`✅ Drop: ${draggedItem.title} → ${targetFolder.title} (${currentDropMode})`);
			await moveBookmark(draggedItem.id, destination);
			
			setTimeout(() => {
				onMove?.();
			}, 100);
		} catch (error) {
			console.error('❌ Ошибка перемещения:', error);
			alert('Не удалось переместить элемент');
		}
	}
</script>

{#if level === 0}
	<!-- Корневой уровень - горизонтальный список -->
	<div 
		class="flex h-full w-full gap-3 overflow-x-scroll p-4"
		role="region"
		ondragover={handleRootDragOver}
		ondragleave={handleRootDragLeave}
		ondrop={handleRootDrop}
	>
		{#each groupedItems() as group, index (index)}
			{#if group.type === 'folder'}
				<!-- Папка -->
				<div 
					class="group relative flex shrink-0 self-start flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all {dropTargetFolderId === group.item.id && dropMode === 'into' ? 'border-blue-500 bg-blue-50 border-2' : ''}"
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
					<!-- Индикатор "вставить перед" -->
					{#if dropTargetFolderId === group.item.id && dropMode === 'before'}
						<div class="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-20"></div>
					{/if}
					<!-- Индикатор "вставить после" -->
					{#if dropTargetFolderId === group.item.id && dropMode === 'after'}
						<div class="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 z-20"></div>
					{/if}
					<div 
						class="flex items-center gap-2"
						role="region"
						ondragover={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleFolderDragOver(group.item, e);
						}}
						ondrop={(e) => handleFolderDrop(group.item, e)}
					>
						<svg
							class="size-4 shrink-0 text-gray-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
						<h3 class="text-sm font-semibold text-gray-800">{group.item.title}</h3>
					</div>
					<div 
						role="region"
						ondragover={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleFolderDragOver(group.item, e);
						}}
						ondrop={(e) => handleFolderDrop(group.item, e)}
					>
						<Self item={group.item} level={1} {onDelete} {onMove} />
					</div>
					<!-- Кнопки управления папкой -->
					<div class="absolute -top-1 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						<button
							onclick={(e) => handleCreateBookmark(group.item.id, e)}
							class="flex size-5 items-center justify-center rounded-full bg-gray-400 text-white transition-colors hover:bg-gray-600"
							title="Добавить закладку"
						>
							<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
							</svg>
						</button>
						<button
							onclick={(e) => handleCreateFolder(group.item.id, e)}
							class="flex size-5 items-center justify-center rounded-full bg-gray-400 text-white transition-colors hover:bg-gray-600"
							title="Добавить папку"
						>
							<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6" />
							</svg>
						</button>
						<button
							onclick={(e) => handleDeleteFolder(group.item.id, group.item.title, e)}
							class="flex size-5 items-center justify-center rounded-full bg-gray-400 text-white transition-colors hover:bg-gray-600"
							title="Удалить папку"
						>
							<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{:else}
				<!-- Группа закладок -->
				<div class="flex shrink-0 flex-col gap-2">
					{#each group.items as bookmark (bookmark.id)}
						<Bookmark item={bookmark} parentId={item.id} {onDelete} {onMove} />
					{/each}
				</div>
			{/if}
		{/each}
		
		<!-- Drop зона для перемещения в конец корневого уровня -->
		{#if isRootDropZone}
			<div class="flex h-full min-w-[100px] shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-blue-500 bg-blue-50 px-4">
				<span class="text-sm text-blue-600">Переместить сюда</span>
			</div>
		{/if}
	</div>
{:else}
	<!-- Вложенные уровни - вертикальный список -->
	<div class="flex flex-col gap-2">
		{#each item.children || [] as child (child.id)}
			{#if isFolder(child)}
				<div 
					class="group relative flex flex-col gap-2 border-l-2 pl-3 transition-all {dropTargetFolderId === child.id && dropMode === 'into' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 [.group:hover:not(:has(.group:hover))>&]:border-gray-400'}"
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
					<!-- Индикатор "вставить перед" -->
					{#if dropTargetFolderId === child.id && dropMode === 'before'}
						<div class="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-20"></div>
					{/if}
					<!-- Индикатор "вставить после" -->
					{#if dropTargetFolderId === child.id && dropMode === 'after'}
						<div class="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 z-20"></div>
					{/if}
					<div 
						class="flex items-center gap-2"
						role="region"
						ondragover={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleFolderDragOver(child, e);
						}}
						ondrop={(e) => handleFolderDrop(child, e)}
					>
						<svg
							class="size-4 shrink-0 text-gray-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
						<h3 class="text-sm font-semibold text-gray-800">{child.title}</h3>
						<div class="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 [.group:not(:hover)_&]:!opacity-0">
							<button
								onclick={(e) => handleCreateBookmark(child.id, e)}
								class="flex size-5 items-center justify-center rounded-full bg-gray-400 text-white transition-colors hover:bg-gray-600"
								title="Добавить закладку"
							>
								<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
								</svg>
							</button>
							<button
								onclick={(e) => handleCreateFolder(child.id, e)}
								class="flex size-5 items-center justify-center rounded-full bg-gray-400 text-white transition-colors hover:bg-gray-600"
								title="Добавить папку"
							>
								<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6" />
								</svg>
							</button>
							<button
								onclick={(e) => handleDeleteFolder(child.id, child.title, e)}
								class="flex size-5 items-center justify-center rounded-full bg-gray-400 text-white transition-colors hover:bg-gray-600"
								title="Удалить папку"
							>
								<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
					<div
						role="region"
						ondragover={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleFolderDragOver(child, e);
						}}
						ondrop={(e) => handleFolderDrop(child, e)}
					>
						<Self item={child} level={level + 1} {onDelete} {onMove} />
					</div>
				</div>
			{:else}
				<Bookmark item={child} parentId={item.id} {onDelete} {onMove} />
			{/if}
		{/each}
	</div>
{/if}

