import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import {
	closeClickStatsDb,
	getLastClickMap,
	getPeriodStats,
	recordClick,
	resetClickStatsDb
} from './clickStats';

describe('clickStats IndexedDB', () => {
	afterEach(async () => {
		await resetClickStatsDb();
		await closeClickStatsDb();
	});

	it('records clicks and aggregates stats for a period', async () => {
		await recordClick({ id: 'a', url: 'https://a.example', title: 'A' });
		await recordClick({ id: 'a', url: 'https://a.example', title: 'A' });
		await recordClick({ id: 'b', url: 'https://b.example', title: 'B' });

		const stats = await getPeriodStats(0);
		expect(stats.totalClicks).toBe(3);
		expect(stats.uniqueBookmarks).toBe(2);
		expect(stats.top[0]).toMatchObject({ bookmarkId: 'a', clicks: 2, title: 'A' });

		const last = await getLastClickMap();
		expect(last.get('a')?.totalClicks).toBe(2);
		expect(last.get('b')?.totalClicks).toBe(1);
	});

	it('ignores clicks older than the cutoff', async () => {
		await recordClick({
			id: 'old',
			url: 'https://old.example',
			title: 'Old',
			clickedAt: 1_000
		});
		await recordClick({
			id: 'new',
			url: 'https://new.example',
			title: 'New',
			clickedAt: 5_000
		});

		const stats = await getPeriodStats(2_000);
		expect(stats.totalClicks).toBe(1);
		expect(stats.uniqueBookmarks).toBe(1);
		expect(stats.top[0]?.bookmarkId).toBe('new');
	});

	it('skips bookmarks without a url', async () => {
		await recordClick({ id: 'folder', title: 'Folder' });
		const stats = await getPeriodStats(0);
		expect(stats.totalClicks).toBe(0);
	});
});
