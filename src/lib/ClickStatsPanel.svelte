<script lang="ts">
	import type { BookmarkItem } from '../types';
	import Icon from './Icon.svelte';
	import { modalStore } from './modalStore.svelte';
	import { archiveMany } from './archiveBookmark';
	import { isChromeExtensionContext } from './loadBookmarks';
	import {
		DEFAULT_PERIOD_ID,
		getPeriodById,
		getPeriodCutoff,
		STAT_PERIODS
	} from './clickPeriods';
	import { getLastClickMap, getPeriodStats, type PeriodStats } from './clickStats';
	import { collectUnusedBookmarks, splitUnused, type UnusedBookmark } from './unusedBookmarks';

	let {
		bookmarks,
		onArchived
	}: {
		bookmarks: BookmarkItem[];
		onArchived?: () => void;
	} = $props();

	let open = $state(false);
	let periodId = $state(DEFAULT_PERIOD_ID);
	let loading = $state(false);
	let archiving = $state(false);
	let stats = $state<PeriodStats>({ totalClicks: 0, uniqueBookmarks: 0, top: [] });
	let unused = $state<UnusedBookmark[]>([]);

	const period = $derived(getPeriodById(periodId));
	const unusedSplit = $derived(splitUnused(unused));

	async function refresh() {
		loading = true;
		try {
			const cutoff = getPeriodCutoff(period);
			const [periodStats, lastClicks] = await Promise.all([
				getPeriodStats(cutoff),
				getLastClickMap()
			]);
			stats = periodStats;
			unused = collectUnusedBookmarks(bookmarks, lastClicks, cutoff);
		} catch (error) {
			console.error('Failed to load click stats', error);
			stats = { totalClicks: 0, uniqueBookmarks: 0, top: [] };
			unused = [];
		} finally {
			loading = false;
		}
	}

	async function handleOpen() {
		open = true;
	}

	function handleClose() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			handleClose();
		}
	}

	$effect(() => {
		if (open) {
			void periodId;
			void bookmarks;
			void refresh();
		}
	});

	async function handleArchiveUnused() {
		if (unused.length === 0 || archiving) return;

		const neverPart =
			unusedSplit.neverClicked > 0
				? ` ${unusedSplit.neverClicked} have never been opened in this manager.`
				: '';
		const confirmed = await modalStore.confirm(
			`Archive ${unused.length} bookmarks not opened in the last ${period.label.toLowerCase()}?${neverPart}`,
			'Archive unused'
		);
		if (!confirmed) return;

		if (!isChromeExtensionContext()) {
			await modalStore.alert(
				'Archiving unused bookmarks requires the Chrome extension (not the web preview).',
				'Unavailable'
			);
			return;
		}

		archiving = true;
		try {
			const result = await archiveMany(unused.map((item) => item.id));
			onArchived?.();
			await refresh();
			if (result.failed > 0) {
				await modalStore.alert(
					`Archived ${result.archived}, failed ${result.failed}.`,
					'Partial archive'
				);
			}
		} catch (error) {
			console.error('Failed to archive unused bookmarks', error);
			await modalStore.alert('Failed to archive unused bookmarks', 'Error');
		} finally {
			archiving = false;
		}
	}

	function formatLastClick(ts: number | null): string {
		if (ts === null) return 'never';
		return new Date(ts).toLocaleDateString();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<button
	onclick={handleOpen}
	class="pixel-stats-toggle"
	title="Click stats"
	type="button"
>
	<Icon name="chart" size={20} />
</button>

{#if open}
	<div
		class="pixel-stats-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) handleClose();
		}}
		onkeydown={(e) => e.key === 'Enter' && handleClose()}
		role="presentation"
	>
		<div class="pixel-stats-panel" role="dialog" aria-label="Bookmark click stats" tabindex="-1">
			<div class="pixel-stats-header">
				<div class="pixel-stats-title">Click stats</div>
				<button onclick={handleClose} class="pixel-close-btn" title="Close" type="button">
					<Icon name="close" size={14} />
				</button>
			</div>

			<div class="pixel-period-row">
				{#each STAT_PERIODS as item}
					<button
						type="button"
						class="pixel-period"
						class:active={periodId === item.id}
						onclick={() => {
							periodId = item.id;
						}}
					>
						{item.label}
					</button>
				{/each}
			</div>

			<div class="pixel-stats-body">
				{#if loading}
					<p class="pixel-muted">Loading...</p>
				{:else}
					<div class="pixel-metrics">
						<div class="pixel-metric">
							<div class="pixel-metric-value">{stats.totalClicks}</div>
							<div class="pixel-metric-label">Clicks</div>
						</div>
						<div class="pixel-metric">
							<div class="pixel-metric-value">{stats.uniqueBookmarks}</div>
							<div class="pixel-metric-label">Bookmarks</div>
						</div>
						<div class="pixel-metric">
							<div class="pixel-metric-value">{unused.length}</div>
							<div class="pixel-metric-label">Unused</div>
						</div>
					</div>

					<h3 class="pixel-section-title">Most opened · {period.label}</h3>
					{#if stats.top.length === 0}
						<p class="pixel-muted">No clicks recorded for this period yet.</p>
					{:else}
						<ul class="pixel-top-list">
							{#each stats.top as row (row.bookmarkId)}
								<li>
									<span class="pixel-top-count">{row.clicks}</span>
									<span class="pixel-top-title">{row.title}</span>
								</li>
							{/each}
						</ul>
					{/if}

					<h3 class="pixel-section-title">Not opened · {period.label}</h3>
					<p class="pixel-muted">
						{#if unused.length === 0}
							Nothing to archive for this period.
						{:else}
							{unusedSplit.stale} stale
							{#if unusedSplit.neverClicked > 0}
								· {unusedSplit.neverClicked} never opened here
							{/if}
						{/if}
					</p>

					{#if unused.length > 0}
						<ul class="pixel-unused-list">
							{#each unused.slice(0, 12) as item (item.id)}
								<li>
									<span class="pixel-unused-title">{item.title}</span>
									<span class="pixel-unused-meta">{formatLastClick(item.lastClickedAt)}</span>
								</li>
							{/each}
						</ul>
						{#if unused.length > 12}
							<p class="pixel-muted">and {unused.length - 12} more</p>
						{/if}
						<button
							type="button"
							class="pixel-archive-unused"
							disabled={archiving}
							onclick={handleArchiveUnused}
						>
							<Icon name="archive" size={14} />
							<span>
								{archiving ? 'Archiving...' : `Archive ${unused.length} unused`}
							</span>
						</button>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.pixel-stats-toggle {
		width: 48px;
		height: 48px;
		background-color: var(--bg-surface);
		border: 4px solid var(--border);
		color: var(--text-primary);
		cursor: pointer;
		transition: transform 0.1s steps(2), box-shadow 0.1s;
		box-shadow: 2px 2px 0px var(--shadow);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pixel-stats-toggle:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0px var(--shadow);
		background-color: var(--accent-secondary);
	}

	.pixel-stats-toggle:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0px var(--shadow);
	}

	.pixel-stats-backdrop {
		position: fixed;
		inset: 0;
		z-index: 45;
		background-color: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 72px 16px 16px;
	}

	.pixel-stats-panel {
		width: min(720px, 100%);
		max-height: calc(100vh - 96px);
		overflow: auto;
		background-color: var(--bg-surface);
		border: 4px solid var(--border);
		box-shadow: 8px 8px 0px var(--shadow);
		color: var(--text-primary);
	}

	.pixel-stats-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background-color: var(--bg-secondary);
		border-bottom: 4px solid var(--border);
	}

	.pixel-stats-title {
		font-size: 10px;
		font-weight: bold;
		text-transform: uppercase;
	}

	.pixel-close-btn {
		width: 24px;
		height: 24px;
		background-color: var(--bg-surface);
		border: 2px solid var(--border);
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pixel-period-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 12px 16px;
		border-bottom: 2px solid var(--border);
	}

	.pixel-period {
		padding: 6px 8px;
		background-color: var(--bg-secondary);
		border: 2px solid var(--border);
		color: var(--text-primary);
		font-size: 9px;
		cursor: pointer;
		text-transform: uppercase;
	}

	.pixel-period.active {
		background-color: var(--accent-primary);
	}

	.pixel-stats-body {
		padding: 16px;
	}

	.pixel-metrics {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-bottom: 16px;
	}

	.pixel-metric {
		border: 2px solid var(--border);
		padding: 12px 8px;
		text-align: center;
		background-color: var(--bg-primary);
	}

	.pixel-metric-value {
		font-size: 18px;
		font-weight: bold;
	}

	.pixel-metric-label {
		font-size: 8px;
		text-transform: uppercase;
		color: var(--text-secondary);
		margin-top: 4px;
	}

	.pixel-section-title {
		font-size: 10px;
		text-transform: uppercase;
		margin: 16px 0 8px;
	}

	.pixel-muted {
		font-size: 10px;
		color: var(--text-secondary);
		margin: 0 0 8px;
	}

	.pixel-top-list,
	.pixel-unused-list {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 2px solid var(--border);
	}

	.pixel-top-list li,
	.pixel-unused-list li {
		display: flex;
		gap: 8px;
		align-items: center;
		padding: 8px 10px;
		border-bottom: 1px solid var(--border);
		font-size: 11px;
	}

	.pixel-top-list li:last-child,
	.pixel-unused-list li:last-child {
		border-bottom: none;
	}

	.pixel-top-count {
		min-width: 24px;
		font-weight: bold;
	}

	.pixel-top-title,
	.pixel-unused-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.pixel-unused-meta {
		font-size: 9px;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.pixel-archive-unused {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
		padding: 10px 12px;
		background-color: var(--accent-primary);
		border: 4px solid var(--border);
		color: var(--text-primary);
		font-size: 10px;
		text-transform: uppercase;
		cursor: pointer;
		box-shadow: 4px 4px 0px var(--shadow);
	}

	.pixel-archive-unused:disabled {
		opacity: 0.6;
		cursor: wait;
	}
</style>
