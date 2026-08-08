import type { Plugin } from 'unified';
import type { Root, Text, Paragraph } from 'mdast';

/**
 * 将 remark-math 生成的 inlineMath/math 节点还原为带 $...$ / $$...$$ 定界符的文本，
 * 供客户端 MathJax 识别渲染。必须在 remark-math 之后运行。
 *
 * remark-math 在 tokenizer 层提取数学内容，使反斜杠（\{, \}, \| 等）
 * 免受 CommonMark 转义处理；本插件再把定界符拼回，保持 MathJax 行为不变。
 */
const remarkMathPassthrough: Plugin<[], Root> = () => {
  return (tree) => {
    const walk = (nodes: Root['children']): void => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as { type: string; value?: string; children?: unknown[] };

        if (node.type === 'inlineMath' && typeof node.value === 'string') {
          const text: Text = { type: 'text', value: `$${node.value}$` };
          (nodes as unknown[])[i] = text;
          continue;
        }

        if (node.type === 'math' && typeof node.value === 'string') {
          const para: Paragraph = {
            type: 'paragraph',
            children: [{ type: 'text', value: `$$${node.value}$$` }],
          };
          (nodes as unknown[])[i] = para;
          continue;
        }

        if (Array.isArray(node.children)) {
          walk(node.children as Root['children']);
        }
      }
    };
    walk(tree.children);
  };
};

export default remarkMathPassthrough;
