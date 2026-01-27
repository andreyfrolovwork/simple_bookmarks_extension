<script lang="ts">
	import { themeStore } from './themeStore.svelte';
	import Icon from './Icon.svelte';

	// Иконки для разных состояний темы
	const icons = {
		light: 'sun',
		dark: 'moon',
		auto: 'settings'
	};

	const labels = {
		light: 'Light',
		dark: 'Dark',
		auto: 'Auto'
	};

	function handleToggle() {
		themeStore.toggleTheme();
	}
</script>

<button
	onclick={handleToggle}
	class="pixel-theme-toggle"
	title={`Theme: ${labels[themeStore.theme]}`}
	type="button"
>
	<Icon name={icons[themeStore.theme]} size={20} />
</button>

<style>
	.pixel-theme-toggle {
		position: relative;
		width: 48px;
		height: 48px;
		background-color: var(--bg-surface);
		border: 4px solid var(--border);
		color: var(--text-primary);
		font-size: 20px;
		cursor: pointer;
		transition: transform 0.1s steps(2), box-shadow 0.1s;
		box-shadow: 2px 2px 0px var(--shadow);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pixel-theme-toggle:hover {
		transform: translate(-1px, -1px);
		box-shadow: 3px 3px 0px var(--shadow);
		background-color: var(--accent-secondary);
	}

	.pixel-theme-toggle:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0px var(--shadow);
	}
</style>
