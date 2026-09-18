export interface ClickEvent {
	id?: number;
	bookmarkId: string;
	url: string;
	title: string;
	clickedAt: number;
}

export interface ClickMeta {
	bookmarkId: string;
	url: string;
	title: string;
	lastClickedAt: number;
	totalClicks: number;
}

export interface PeriodStats {
	totalClicks: number;
	uniqueBookmarks: number;
	top: Array<{
		bookmarkId: string;
		title: string;
		url: string;
		clicks: number;
		lastClickedAt: number;
	}>;
}

const DB_NAME = 'bm-click-stats';
const DB_VERSION = 1;
const TOP_LIMIT = 15;

let dbPromise: Promise<IDBDatabase> | null = null;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function openDb(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;

	dbPromise = new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains('clicks')) {
				const clicks = db.createObjectStore('clicks', {
					keyPath: 'id',
					autoIncrement: true
				});
				clicks.createIndex('clickedAt', 'clickedAt');
				clicks.createIndex('bookmarkId', 'bookmarkId');
			}
			if (!db.objectStoreNames.contains('meta')) {
				db.createObjectStore('meta', { keyPath: 'bookmarkId' });
			}
		};
		req.onsuccess = () => {
			const db = req.result;
			db.onversionchange = () => {
				db.close();
				dbPromise = null;
			};
			resolve(db);
		};
		req.onerror = () => {
			dbPromise = null;
			reject(req.error);
		};
	});

	return dbPromise;
}

export async function closeClickStatsDb(): Promise<void> {
	if (!dbPromise) return;
	try {
		const db = await dbPromise;
		db.close();
	} finally {
		dbPromise = null;
	}
}

export async function resetClickStatsDb(): Promise<void> {
	await closeClickStatsDb();
	await new Promise<void>((resolve, reject) => {
		const req = indexedDB.deleteDatabase(DB_NAME);
		req.onsuccess = () => resolve();
		req.onerror = () => reject(req.error);
		req.onblocked = () => resolve();
	});
}

export async function recordClick(bookmark: {
	id: string;
	url?: string;
	title: string;
	clickedAt?: number;
}): Promise<void> {
	if (!bookmark.id || !bookmark.url) return;
	if (typeof indexedDB === 'undefined') return;

	try {
		const db = await openDb();
		const now = bookmark.clickedAt ?? Date.now();
		const tx = db.transaction(['clicks', 'meta'], 'readwrite');
		const clicks = tx.objectStore('clicks');
		const meta = tx.objectStore('meta');

		clicks.add({
			bookmarkId: bookmark.id,
			url: bookmark.url,
			title: bookmark.title,
			clickedAt: now
		} satisfies ClickEvent);

		const existing = await requestToPromise<ClickMeta | undefined>(meta.get(bookmark.id));
		const next: ClickMeta = existing
			? {
					...existing,
					url: bookmark.url,
					title: bookmark.title,
					lastClickedAt: now,
					totalClicks: existing.totalClicks + 1
				}
			: {
					bookmarkId: bookmark.id,
					url: bookmark.url,
					title: bookmark.title,
					lastClickedAt: now,
					totalClicks: 1
				};
		meta.put(next);

		await new Promise<void>((resolve, reject) => {
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} catch (error) {
		console.error('Failed to record bookmark click', error);
	}
}

export async function getLastClickMap(): Promise<Map<string, ClickMeta>> {
	if (typeof indexedDB === 'undefined') return new Map();

	const db = await openDb();
	const tx = db.transaction('meta', 'readonly');
	const rows = await requestToPromise<ClickMeta[]>(tx.objectStore('meta').getAll());
	return new Map(rows.map((row) => [row.bookmarkId, row]));
}

export async function getPeriodStats(cutoff: number): Promise<PeriodStats> {
	if (typeof indexedDB === 'undefined') {
		return { totalClicks: 0, uniqueBookmarks: 0, top: [] };
	}

	const db = await openDb();
	const tx = db.transaction('clicks', 'readonly');
	const index = tx.objectStore('clicks').index('clickedAt');
	const events = await requestToPromise<ClickEvent[]>(
		index.getAll(IDBKeyRange.lowerBound(cutoff))
	);

	const byId = new Map<
		string,
		{ bookmarkId: string; title: string; url: string; clicks: number; lastClickedAt: number }
	>();

	for (const event of events) {
		const current = byId.get(event.bookmarkId);
		if (current) {
			current.clicks += 1;
			current.lastClickedAt = Math.max(current.lastClickedAt, event.clickedAt);
			current.title = event.title;
			current.url = event.url;
		} else {
			byId.set(event.bookmarkId, {
				bookmarkId: event.bookmarkId,
				title: event.title,
				url: event.url,
				clicks: 1,
				lastClickedAt: event.clickedAt
			});
		}
	}

	const top = [...byId.values()].sort((a, b) => b.clicks - a.clicks).slice(0, TOP_LIMIT);

	return {
		totalClicks: events.length,
		uniqueBookmarks: byId.size,
		top
	};
}
