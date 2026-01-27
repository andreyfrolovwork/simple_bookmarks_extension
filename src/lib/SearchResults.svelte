<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { searchStore } from './searchStore.svelte';

	// Получение favicon для сайта
	function getFavicon(url: string): string {
		try {
			const urlObj = new URL(url);
			return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
		} catch {
			return '';
		}
	}

	// Открытие закладки
	function openBookmark(url: string) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	// Закрытие поиска
	function closeSearch() {
		searchStore.clear();
	}

	// Обработка клика по backdrop
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeSearch();
		}
	}

	// Обработка нажатия клавиш
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeSearch();
		}
	}

	// Сокращение длинного URL
	function truncateUrl(url: string, maxLength: number = 60): string {
		if (url.length <= maxLength) return url;
		return url.substring(0, maxLength) + '...';
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if searchStore.isActive}
	<!-- Backdrop - только под шапкой -->
	<div
		class="fixed inset-x-0 bottom-0 top-[60px] z-40 bg-black/50 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && handleBackdropClick(e as unknown as MouseEvent)}
		role="button"
		tabindex="-1"
	>
		<!-- Результаты поиска -->
		<div
			class="mx-auto mt-4 max-w-3xl rounded-lg bg-white shadow-2xl"
			transition:fly={{ y: -20, duration: 300 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="0"
		>
			<!-- Заголовок с количеством результатов -->
			<div class="border-b border-gray-200 px-6 py-4">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">
						{#if searchStore.resultsCount > 0}
							Найдено: {searchStore.resultsCount}
						{:else}
							Ничего не найдено
						{/if}
					</h3>
					<button
						onclick={closeSearch}
						class="flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
						title="Закрыть"
					>
						<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			<!-- Список результатов -->
			<div class="max-h-[60vh] overflow-y-auto">
				{#if searchStore.resultsCount > 0}
					<div class="divide-y divide-gray-100">
						{#each searchStore.results as result (result.item.id)}
							<button
								onclick={() => openBookmark(result.item.url || '')}
								class="flex w-full items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50"
							>
								<!-- Favicon -->
								<div class="mt-1 shrink-0">
									{#if result.item.url}
										<img
											src={getFavicon(result.item.url)}
											alt=""
											class="size-5"
											onerror={(e) => {
												if (e.currentTarget instanceof HTMLImageElement) {
													e.currentTarget.style.display = 'none';
												}
											}}
										/>
									{:else}
										<svg
											class="size-5 text-gray-400"
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
									{/if}
								</div>

								<!-- Информация о закладке -->
								<div class="min-w-0 flex-1">
									<!-- Название -->
									<div class="mb-1 font-medium text-gray-900">
										{result.item.title}
									</div>

									<!-- URL -->
									{#if result.item.url}
										<div class="mb-1 text-sm text-gray-500">
											{truncateUrl(result.item.url)}
										</div>
									{/if}

									<!-- Путь к папке (breadcrumbs) -->
									{#if result.item.path}
										<div class="flex items-center gap-1 text-xs text-gray-400">
											<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
												/>
											</svg>
											<span>{result.item.path}</span>
										</div>
									{/if}

									<!-- Оценка релевантности (для отладки) -->
									{#if result.score !== undefined}
										<div class="mt-1 text-xs text-gray-300">
											Score: {result.score.toFixed(3)}
										</div>
									{/if}
								</div>

								<!-- Иконка перехода -->
								<div class="mt-1 shrink-0">
									<svg
										class="size-5 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<!-- Пустое состояние -->
					<div class="flex flex-col items-center justify-center gap-4 py-16 text-gray-400">
						<svg class="size-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<p class="text-lg font-medium">Ничего не найдено</p>
						<p class="text-sm">Попробуйте изменить поисковый запрос</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
