import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { getPostUrl } from '../utils/permalink';

export async function GET(context: APIContext) {
  // 取所有文章按 date 降序（date 为 YYYY-MM-DD 字符串，字典序即日期序）
  const posts = (await getCollection('posts')).sort((a, b) =>
    b.data.date.localeCompare(a.data.date)
  );

  return rss({
    title: 'The Time Forever',
    description: '记录生活、学习与思考',
    site: context.site ?? 'https://the-time-forever.github.io',
    customData: '<language>zh-cn</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      // 外链文章（redirect_to）直接指向目标地址，否则用站点内 permalink
      link: post.data.redirect_to ?? getPostUrl(post),
      categories: [
        ...(post.data.categories ?? []),
        ...(post.data.tags ?? []),
      ],
    })),
  });
}
