import Fuse from 'fuse.js';
import type { BookmarkItem } from '../types';

// Расширенный тип для плоских закладок с путём
export interface FlatBookmark {
	id: string;
	title: string;
	url?: string;
	path: string; // Путь к папкам: "Bookmarks Bar > Work > Projects"
	dateAdded?: number;
}

// Конфигурация Fuse.js
const fuseOptions: Fuse.IFuseOptions<FlatBookmark> = {
	keys: [
		{ name: 'title', weight: 2 },    // Приоритет названию
		{ name: 'url', weight: 1 },      // Меньший вес URL
		{ name: 'path', weight: 1.5 }    // Средний вес пути к папкам
	],
	threshold: 0.3,                      // Широкий поиск
	minMatchCharLength: 1,               // Начинать с 1 буквы
	includeScore: true,                  // Сортировка по релевантности
	ignoreLocation: true,                // Искать по всему тексту
	useExtendedSearch: false
};

class SearchStore {
	query = $state('');
	results = $state<Fuse.FuseResult<FlatBookmark>[]>([]);
	isActive = $state(false);
	
	private fuse: Fuse<FlatBookmark> | null = null;
	private flatBookmarks: FlatBookmark[] = [];

	// Инициализация данных для поиска
	setBookmarks(flatBookmarks: FlatBookmark[]) {
		this.flatBookmarks = flatBookmarks;
		this.fuse = new Fuse(flatBookmarks, fuseOptions);
	}

	// Выполнение поиска
	search(query: string) {
		this.query = query;
		this.isActive = query.length > 0;

		if (!this.fuse || query.length === 0) {
			this.results = [];
			return;
		}

		this.results = this.fuse.search(query);
	}

	// Очистка поиска
	clear() {
		this.query = '';
		this.results = [];
		this.isActive = false;
	}

	// Получение количества результатов
	get resultsCount(): number {
		return this.results.length;
	}
}

export const searchStore = new SearchStore();
