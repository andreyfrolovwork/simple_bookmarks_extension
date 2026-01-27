import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [svelte()],
	build: {
		rollupOptions: {
			input: {
				main: 'index.html'
			},
			output: {
				entryFileNames: '[name].js',
				chunkFileNames: '[name].js',
				assetFileNames: '[name].[ext]'
			}
		},
		watch: {
			include: ['src/**', 'public/**'],
			exclude: ['node_modules/**', 'dist/**']
		},
		// Faster rebuilds in development mode
		minify: mode === 'production' ? 'esbuild' : false,
		sourcemap: mode === 'development'
	}
}));
