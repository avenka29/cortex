import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://avenka29.github.io',
	base: '/cortex',
	integrations: [
		starlight({
			title: 'Cortex MCP Server',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/avenka29/cortex' }
			],
			sidebar: [
				{ label: 'Getting Started', link: '/getting-started/' },
				{ label: 'Architecture', link: '/architecture/' },
				{ label: 'MCP Tools', link: '/tools/' },
				{ label: 'Configuration', link: '/configuration/' },
			],
		}),
	],
});
