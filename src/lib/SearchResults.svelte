<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { searchStore } from './searchStore.svelte';
	import Icon from './Icon.svelte';

	let faviconErrors = $state<Set<string>>(new Set());

	// Get favicon for site
	function getFavicon(url: string): string {
		try {
			const urlObj = new URL(url);
			return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
		} catch {
			return '';
		}
	}

	function handleFaviconError(id: string) {
		faviconErrors = new Set([...faviconErrors, id]);
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
	<!-- Backdrop -->
	<div
		class="pixel-backdrop"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Enter' && handleBackdropClick(e as unknown as MouseEvent)}
		role="button"
		tabindex="-1"
	>
		<!-- Результаты поиска -->
		<div
			class="pixel-results-container"
			transition:fly={{ y: -20, duration: 300 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="0"
		>
			<!-- Заголовок -->
			<div class="pixel-results-header">
				<div class="results-title">
					{#if searchStore.resultsCount > 0}
						Found: {searchStore.resultsCount}
					{:else}
						Not found
					{/if}
				</div>
				<button
					onclick={closeSearch}
					class="pixel-close-btn"
					title="Close"
				>
					<Icon name="close" size={14} />
				</button>
			</div>

			<!-- Список результатов -->
			<div class="pixel-results-list">
				{#if searchStore.resultsCount > 0}
					{#each searchStore.results as result (result.item.id)}
						<button
							onclick={() => openBookmark(result.item.url || '')}
							class="pixel-result-item"
						>
							<!-- Favicon -->
							<div class="result-icon">
								{#if result.item.url}
									{#if !faviconErrors.has(result.item.id)}
										<img
											src={getFavicon(result.item.url)}
											alt=""
											class="result-favicon"
											onerror={() => handleFaviconError(result.item.id)}
										/>
									{:else}
										<Icon name="bookmark" size={16} />
									{/if}
								{:else}
									<Icon name="folder" size={16} />
								{/if}
							</div>

							<!-- Информация -->
							<div class="result-info">
								<div class="result-title">{result.item.title}</div>
								{#if result.item.url}
									<div class="result-url">{truncateUrl(result.item.url, 50)}</div>
								{/if}
								{#if result.item.path}
									<div class="result-path">📁 {result.item.path}</div>
								{/if}
							</div>

							<!-- Иконка перехода -->
							<div class="result-arrow">
								<Icon name="external-link" size={14} />
							</div>
						</button>
					{/each}
				{:else}
					<!-- Пустое состояние -->
					<div class="pixel-empty-state">
						<div style="color: var(--text-secondary);">
							<Icon name="search" size={48} />
						</div>
						<p style="font-size: 10px; margin-top: 16px;">Nothing found</p>
						<p style="font-size: 8px; margin-top: 8px; color: var(--text-secondary);">Try another query</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.pixel-backdrop {
		position: fixed;
		inset: 0;
		top: 60px;
		z-index: 40;
		background-color: rgba(0, 0, 0, 0.7);
	}

	.pixel-results-container {
		margin: 16px auto;
		max-width: 800px;
		background-color: var(--bg-surface);
		border: 4px solid var(--border);
		box-shadow: 8px 8px 0px var(--shadow);
	}

	.pixel-results-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background-color: var(--bg-secondary);
		border-bottom: 4px solid var(--border);
	}

	.results-title {
		font-size: 10px;
		font-weight: bold;
		color: var(--text-primary);
		text-transform: uppercase;
	}

	.pixel-close-btn {
		width: 24px;
		height: 24px;
		background-color: var(--bg-surface);
		border: 2px solid var(--border);
		color: var(--text-primary);
		font-size: 14px;
		cursor: pointer;
		transition: all 0.1s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pixel-close-btn:hover {
		background-color: var(--accent-primary);
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0px var(--shadow);
	}

	.pixel-results-list {
		max-height: 60vh;
		overflow-y: auto;
		background-color: var(--bg-primary);
	}

	.pixel-result-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		width: 100%;
		padding: 12px 16px;
		background-color: var(--bg-surface);
		border: none;
		border-bottom: 2px solid var(--border);
		color: var(--text-primary);
		text-align: left;
		cursor: pointer;
		transition: all 0.1s;
	}

	.pixel-result-item:hover {
		background-color: var(--accent-secondary);
		transform: translateX(2px);
		border-left: 4px solid var(--accent-primary);
		padding-left: 12px;
	}

	.result-icon {
		margin-top: 2px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		color: var(--text-primary);
		width: 16px;
		height: 16px;
	}

	.result-favicon {
		width: 16px;
		height: 16px;
		image-rendering: pixelated;
	}

	.result-info {
		flex: 1;
		min-width: 0;
	}

	.result-title {
		font-size: 10px;
		font-weight: bold;
		margin-bottom: 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-url {
		font-size: 11px;
		font-family: 'IBM Plex Mono', monospace;
		color: var(--text-secondary);
		margin-bottom: 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-path {
		font-size: 7px;
		color: var(--text-secondary);
	}

	.result-arrow {
		margin-top: 2px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		color: var(--text-secondary);
	}

	.pixel-empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 64px 16px;
		text-align: center;
		color: var(--text-primary);
	}
</style>
