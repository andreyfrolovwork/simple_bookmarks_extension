<script lang="ts">
	// Импорт иконок из pixelarticons
	import add from 'pixelarticons/svg/plus.svg?raw';
	import close from 'pixelarticons/svg/close.svg?raw';
	import check from 'pixelarticons/svg/check.svg?raw';
	import edit from 'pixelarticons/svg/edit.svg?raw';
	import folder from 'pixelarticons/svg/folder.svg?raw';
	import bookmark from 'pixelarticons/svg/book.svg?raw';
	import search from 'pixelarticons/svg/search.svg?raw';
	import sun from 'pixelarticons/svg/sun.svg?raw';
	import moon from 'pixelarticons/svg/moon.svg?raw';
	import settings from 'pixelarticons/svg/sliders.svg?raw';
	import arrowRight from 'pixelarticons/svg/arrow-right.svg?raw';
	import externalLink from 'pixelarticons/svg/external-link.svg?raw';
	import trash from 'pixelarticons/svg/trash.svg?raw';

	let { 
		name, 
		size = 16,
		class: className = ''
	}: { 
		name: string; 
		size?: number;
		class?: string;
	} = $props();

	const icons: Record<string, string> = {
		add,
		close,
		check,
		edit,
		folder,
		bookmark,
		search,
		sun,
		moon,
		settings,
		'arrow-right': arrowRight,
		'external-link': externalLink,
		trash
	};

	const iconSvg = $derived(icons[name] || '');
</script>

{#if iconSvg}
	<span 
		class="pixel-icon {className}" 
		style="width: {size}px; height: {size}px; display: inline-flex; align-items: center; justify-content: center;"
	>
		{@html iconSvg}
	</span>
{/if}

<style>
	.pixel-icon :global(svg) {
		width: 100%;
		height: 100%;
		fill: currentColor;
	}
</style>
