type Theme = 'light' | 'dark' | 'auto';

class ThemeStore {
	theme = $state<Theme>('auto');
	resolvedTheme = $state<'light' | 'dark'>('light');
	
	private mediaQuery: MediaQueryList | null = null;

	constructor() {
		// Загрузка сохраненной темы
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('theme') as Theme;
			if (saved && ['light', 'dark', 'auto'].includes(saved)) {
				this.theme = saved;
			}
			
			// Настройка слушателя системной темы
			this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			this.updateResolvedTheme();
			
			// Слушаем изменения системной темы
			this.mediaQuery.addEventListener('change', () => {
				this.updateResolvedTheme();
			});
		}
	}

	// Обновление resolved темы на основе текущей настройки
	private updateResolvedTheme() {
		if (this.theme === 'auto') {
			this.resolvedTheme = this.mediaQuery?.matches ? 'dark' : 'light';
		} else {
			this.resolvedTheme = this.theme;
		}
		this.applyTheme();
	}

	// Применение темы к документу
	private applyTheme() {
		if (typeof document !== 'undefined') {
			if (this.resolvedTheme === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}

	// Установка темы
	setTheme(newTheme: Theme) {
		this.theme = newTheme;
		localStorage.setItem('theme', newTheme);
		this.updateResolvedTheme();
	}

	// Переключение темы (циклично: light -> dark -> auto -> light)
	toggleTheme() {
		const themes: Theme[] = ['light', 'dark', 'auto'];
		const currentIndex = themes.indexOf(this.theme);
		const nextIndex = (currentIndex + 1) % themes.length;
		this.setTheme(themes[nextIndex]);
	}

	// Инициализация (вызывать при монтировании App)
	init() {
		this.updateResolvedTheme();
	}
}

export const themeStore = new ThemeStore();
