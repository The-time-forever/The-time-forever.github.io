import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkToc from 'remark-toc';
import remarkSlug from 'remark-slug';
import kramdownToc from './src/utils/remark-kramdown-toc.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://the-time-forever.github.io',
  markdown: {
    syntaxHighlight: false,
    processor: unified({
      remarkPlugins: [
        remarkSlug,
        kramdownToc,
        [remarkToc, { heading: '目录', tight: true, ordered: false }],
      ],
      rehypePlugins: [],
    }),
  },
});
