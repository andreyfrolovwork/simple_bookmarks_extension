<script lang="ts">
	import { searchStore } from './searchStore.svelte';
	import Icon from './Icon.svelte';

	let inputRef: HTMLInputElement;

	// Обработка ввода текста
	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchStore.search(target.value);
	}

	// Очистка поиска
	function handleClear() {
		searchStore.clear();
		if (inputRef) {
			inputRef.focus();
		}
	}

	// Обработка нажатия Escape
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClear();
		}
	}
</script>

<div class="pixel-search-bar" class:active={searchStore.isActive}>
	<div class="search-wrapper">
		<!-- Иконка поиска -->
		<span class="search-icon">
			<Icon name="search" size={14} />
		</span>

		<!-- Инпут -->
		<input
			bind:this={inputRef}
			type="text"
			bind:value={searchStore.query}
			oninput={handleInput}
			onkeydown={handleKeydown}
			placeholder="Search..."
			class="search-input"
		/>

		<!-- Кнопка очистки -->
		{#if searchStore.query}
			<button
				onclick={handleClear}
				class="search-clear"
				title="Clear"
			>
				<Icon name="close" size={12} />
			</button>
		{/if}
	</div>
</div>

<style>
	.pixel-search-bar {
		min-width: 200px;
		transition: all 0.2s steps(4);
	}

	.pixel-search-bar.active {
		width: 100%;
	}

	.search-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 8px;
		pointer-events: none;
		display: flex;
		align-items: center;
		color: var(--text-secondary);
	}

	.search-input {
		width: 100%;
		height: 48px;
		padding: 8px 32px 8px 32px;
		background-color: var(--bg-surface);
		border: 4px solid var(--border);
		color: var(--text-primary);
		font-size: 10px;
		font-family: 'Press Start 2P', monospace;
		transition: all 0.1s;
		box-shadow: 2px 2px 0px var(--shadow);
	}

	.search-input::placeholder {
		color: var(--text-secondary);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--accent-primary);
		box-shadow: inset 2px 2px 0px var(--shadow);
	}

	.search-clear {
		position: absolute;
		right: 4px;
		width: 24px;
		height: 24px;
		background-color: var(--bg-secondary);
		border: 2px solid var(--border);
		color: var(--text-primary);
		font-size: 12px;
		cursor: pointer;
		transition: all 0.1s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.search-clear:hover {
		background-color: var(--accent-primary);
		transform: translate(-1px, -1px);
		box-shadow: 2px 2px 0px var(--shadow);
	}

	.search-clear:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}
</style>
