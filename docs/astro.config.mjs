import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://avenka29.github.io',
  base: '/cortex',

  integrations: [starlight({
      title: 'Cortex MCP Server',
      expressiveCode: {
          themes: ['github-dark'],
      },
      customCss: [
          './src/styles/custom.css',
      ],
      social: [
          { icon: 'github', label: 'GitHub', href: 'https://github.com/avenka29/cortex' }
      ],
      sidebar: [
          { 
              label: 'Getting Started', 
              items: [
                  { label: 'Setup', link: '/getting-started/setup/' },
                  { label: 'Examples', link: '/getting-started/examples/' }
              ]
          },
          { label: 'Architecture', link: '/architecture/' },
          { label: 'MCP Tools', link: '/tools/' },
          { label: 'Configuration', link: '/configuration/' },
      ],
  }), react()],

  vite: {
    plugins: [tailwindcss()],
  },
});