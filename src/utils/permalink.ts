import type { CollectionEntry } from 'astro:content';

/**
 * Jekyll slug 规则：小写、空格转连字符、去除非字母数字字符。
 * 注意中文标题 Jekyll 会保留原样（不 transliterate），这里保持一致。
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff\-]/g, '');
}

/**
 * 生成文章链接，对应 Jekyll permalink 规则 `/posts/:year/:month/:day/:title/`。
 * 优先使用 frontmatter 中显式声明的 permalink；否则用标题 slug 拼接默认链接。
 */
export function getPostUrl(post: CollectionEntry<'posts'>): string {
  const { permalink, date } = post.data;
  if (permalink) return permalink;
  const year = date.slice(0, 4);
  const month = date.slice(5, 7);
  const day = date.slice(8, 10);
  const titleSlug = slugify(post.data.title);
  return `/posts/${year}/${month}/${day}/${titleSlug}/`;
}
