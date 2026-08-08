import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    categories: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.array(z.string()).optional(),
    permalink: z.string().optional(),
    redirect_to: z.string().optional(),
    math: z.boolean().optional(),
    mermaid: z.boolean().optional(),
  }),
});

export const collections = { posts };
