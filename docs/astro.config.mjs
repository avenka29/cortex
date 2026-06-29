import { defineConfig } from 'astro/config';
import starlight from '@withastro/starlight';

export default defineConfig({
  // Format: 'https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>'
  site: 'https://avenka29.github.io/cortex',
  base: '/cortex', 
  integrations: [
    starlight({
      title: 'Cortex MCP Server',
      social: {
        github: 'https://github.com/avenka29/cortex',
      },
      sidebar: [
        { label: 'Getting Started', link: '/getting-started/' },
        { label: 'Architecture', link: '/architecture/' },
        { label: 'MCP Tools', link: '/tools/' },
        { label: 'Configuration', link: '/configuration/' },
      ],
    }),
  ],
});
