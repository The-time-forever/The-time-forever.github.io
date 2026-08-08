import type { Plugin } from 'unified';
import type { Root, Heading } from 'mdast';

/**
 * 兼容 Jekyll/kramdown 的 `{:toc}` 语法的 remark 插件。
 *
 * kramdown 写法：
 *   ## 目录
 *   * 目录
 *   {:toc}
 *
 * remark-toc 只识别某个 heading 文本（这里配置为「目录」），
 * 不会识别 `{:toc}` 标记。本插件在 remark-toc 运行前做预处理：
 * - 若 `{:toc}` 标记前已存在 `## 目录` heading，则删除占位 list 与标记，
 *   交由 remark-toc 在该 heading 后生成目录；
 * - 若不存在 heading，则把占位 list 替换为 `## 目录` heading 并删除标记。
 */
const kramdownToc: Plugin<[], Root> = () => {
  return (tree) => {
    const children = tree.children;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.type !== 'list') continue;
      const next = children[i + 1];
      if (!next || next.type !== 'paragraph') continue;
      const text = next.children
        .map((c) => ('value' in c ? c.value : ''))
        .join('')
        .trim();
      if (text !== '{:toc}' && text !== '{: toc}') continue;

      const prev = children[i - 1];
      const hasHeading =
        prev &&
        prev.type === 'heading' &&
        prev.children.some((c) => c.type === 'text' && c.value === '目录');

      if (hasHeading) {
        // 已存在 ## 目录 heading：删除占位 list 与 {:toc} 标记，交由 remark-toc 生成
        children.splice(i, 2);
        i -= 1;
      } else {
        // 无 heading：将占位 list 替换为 ## 目录 heading，并删除 {:toc} 标记
        const heading: Heading = {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: '目录' }],
        };
        children[i] = heading;
        children.splice(i + 1, 1);
      }
    }
  };
};

export default kramdownToc;
