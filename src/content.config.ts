import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/posts',
  }),
  schema: z.object({
    title: z.string(),
    date: z.preprocess(
      (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    ),
    author: z.string().optional(),
    description: z.string().optional(),
    categories: z.array(z.enum(['技术折腾', '学术写作', '工具效率', '知识笔记'])).optional(),
    featured: z.boolean().optional(),
    tags: z.array(z.string()).max(4).optional(),
    permalink: z.string().optional(),
    redirect_to: z.string().optional(),
    math: z.boolean().optional(),
    mermaid: z.boolean().optional(),
  }),
});

export const collections = { posts };
