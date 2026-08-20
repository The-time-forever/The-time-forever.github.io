import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkToc from 'remark-toc';
import remarkSlug from 'remark-slug';
import remarkMath from 'remark-math';
import kramdownToc from './src/utils/remark-kramdown-toc.ts';
import remarkMathPassthrough from './src/utils/remark-math-passthrough.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://the-time-forever.github.io',
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkMath,
        remarkMathPassthrough,
        remarkSlug,
        kramdownToc,
        [remarkToc, { heading: '目录', tight: true, ordered: false }],
      ],
    }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
  vite: {
    resolve: {
      alias: {
        // picomatch is CommonJS, but Astro loads content collections in an ESM-only runner.
        picomatch: fileURLToPath(new URL('./src/utils/picomatch-compat.mjs', import.meta.url)),
      },
    },
  },
});
