<script lang="ts">
	import type { BookmarkItem } from '../types';
	import Icon from './Icon.svelte';
	import { modalStore } from './modalStore.svelte';
	import { archiveMany } from './archiveBookmark';
	import { isChromeExtensionContext } from './loadBookmarks';
	import { formatSliderDays, getSliderCutoff, SLIDER_MAX_DAYS } from './clickPeriods';
	import { getLastClickMap } from './clickStats';
	import {
		archiveTargetIds,
		collectArchivePreview,
		type ArchivePreview
	} from './unusedBookmarks';
	import {
		archivePreviewOpen,
		clearArchivePreview,
		openArchivePreview,
		setArchivePreviewIds
	} from './archivePreviewStore';
	import { unusedArchiveUi } from './unusedArchiveUi.svelte';

	let {
		scope,
		disabled = false,
		onArchived
	}: {
		scope?: BookmarkItem;
		disabled?: boolean;
		onArchived?: () => void;
	} = $props();

	let archiving = $state(false);

	const days = $derived(unusedArchiveUi.days);
	const preview = $derived(unusedArchiveUi.preview);
	const periodLabel = $derived(formatSliderDays(days));
	const targetCount = $derived(preview.bookmarkIds.length + preview.folderIds.length);

	function applyPreview(next: ArchivePreview) {
		unusedArchiveUi.preview = next;
		setArchivePreviewIds(next.highlightIds);
	}

	function recompute() {
		if (disabled || !scope || days < 0.5) {
			applyPreview({ bookmarkIds: [], folderIds: [], highlightIds: [] });
			return;
		}
		const cutoff = getSliderCutoff(days);
		applyPreview(collectArchivePreview([scope], unusedArchiveUi.lastClicks, cutoff));
	}

	async function loadClicks() {
		unusedArchiveUi.lastClicks = await getLastClickMap();
		unusedArchiveUi.loaded = true;
		recompute();
	}

	async function toggle() {
		if ($archivePreviewOpen) {
			clearArchivePreview();
			return;
		}
		if (disabled) return;
		unusedArchiveUi.days = 0;
		openArchivePreview();
		await loadClicks();
	}

	function setDays(value: number) {
		unusedArchiveUi.days = Math.min(SLIDER_MAX_DAYS, Math.max(0, value));
	}

	$effect(() => {
		if (!$archivePreviewOpen) return;
		void unusedArchiveUi.days;
		void scope;
		void unusedArchiveUi.lastClicks;
		if (unusedArchiveUi.loaded) recompute();
	});

	async function handleArchive() {
		if (targetCount === 0 || archiving) return;

		const confirmed = await modalStore.confirm(
			`Archive ${preview.bookmarkIds.length} bookmarks and ${preview.folderIds.length} folders not opened in the last ${periodLabel.toLowerCase()}? Highlighted items will move to Archive.`,
			'Archive unused'
		);
		if (!confirmed) return;

		if (!isChromeExtensionContext()) {
			await modalStore.alert(
				'Archiving unused items requires the Chrome extension (not the web preview).',
				'Unavailable'
			);
			return;
		}

		archiving = true;
		try {
			const result = await archiveMany(archiveTargetIds(preview));
			onArchived?.();
			await loadClicks();
			if (result.failed > 0) {
				await modalStore.alert(
					`Archived ${result.archived}, failed ${result.failed}.`,
					'Partial archive'
				);
			}
		} catch (error) {
			console.error('Failed to archive unused items', error);
			await modalStore.alert('Failed to archive unused items', 'Error');
		} finally {
			archiving = false;
		}
	}
</script>

<div class="pixel-archive-controls">
	{#if $archivePreviewOpen}
		<div class="pixel-slider-row">
			<span class="pixel-slider-period">{periodLabel}</span>
			<input
				class="pixel-range"
				type="range"
				min="0"
				max={SLIDER_MAX_DAYS}
				step="any"
				value={days}
				oninput={(e) => setDays(Number((e.currentTarget as HTMLInputElement).value))}
			/>
			<span class="pixel-slider-count" title="{preview.bookmarkIds.length} bookmarks, {preview.folderIds.length} folders">
				{preview.bookmarkIds.length} · {preview.folderIds.length}
			</span>
			<button
				type="button"
				class="pixel-archive-go"
				disabled={archiving || targetCount === 0}
				onclick={handleArchive}
			>
				{archiving ? '...' : targetCount}
			</button>
		</div>
	{/if}
	<button
		type="button"
		class="pixel-preview-toggle"
		class:active={$archivePreviewOpen}
		title="Preview unused archive"
		disabled={disabled}
		onclick={toggle}
	>
		<Icon name="archive" size={20} />
	</button>
</div>

<style>
	.pixel-archive-controls {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.pixel-preview-toggle {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
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

	.pixel-preview-toggle:hover:not(:disabled) {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0px var(--shadow);
		background-color: var(--archive-preview);
	}

	.pixel-preview-toggle.active {
		background-color: var(--archive-preview);
		border-color: var(--archive-preview-border);
	}

	.pixel-preview-toggle:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.pixel-slider-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.pixel-slider-period {
		font-size: 8px;
		text-transform: uppercase;
		font-weight: bold;
		white-space: nowrap;
	}

	.pixel-slider-count {
		font-size: 8px;
		color: var(--archive-preview-border);
		text-transform: uppercase;
		white-space: nowrap;
	}

	.pixel-range {
		width: 792px;
		accent-color: var(--archive-preview-border);
		cursor: pointer;
		height: 4px;
	}

	.pixel-archive-go {
		min-width: 28px;
		height: 24px;
		padding: 0 6px;
		background-color: var(--archive-preview);
		border: 2px solid var(--archive-preview-border);
		color: var(--text-primary);
		font-size: 8px;
		text-transform: uppercase;
		cursor: pointer;
		box-shadow: 1px 1px 0px var(--shadow);
	}

	.pixel-archive-go:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
