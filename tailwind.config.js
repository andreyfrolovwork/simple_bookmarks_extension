/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{svelte,js,ts,jsx,tsx}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				pixel: ['"Press Start 2P"', 'monospace']
			},
			colors: {
				'pixel-light': {
					bg: '#e3f2fd',
					surface: '#fce4ec',
					accent: '#81c784',
					text: '#2d3748'
				},
				'pixel-dark': {
					bg: '#1a1a2e',
					surface: '#16213e',
					accent: '#6c5ce7',
					text: '#e8e8e8'
				}
			},
			boxShadow: {
				'pixel': '4px 4px 0px rgba(0,0,0,0.25)',
				'pixel-lg': '6px 6px 0px rgba(0,0,0,0.25)',
				'pixel-sm': '2px 2px 0px rgba(0,0,0,0.25)',
				'pixel-inset': 'inset 4px 4px 0px rgba(0,0,0,0.25)'
			},
			borderWidth: {
				'pixel': '4px',
				'pixel-thin': '2px'
			}
		}
	},
	plugins: []
};

