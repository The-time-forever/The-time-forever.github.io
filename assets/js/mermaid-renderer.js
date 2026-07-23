// 两套主题配置：夜间沿用原霓虹青，白天用浅色纸感。
        window.mermaidConfigs = {
            dark: {
                theme: 'dark',
                themeVariables: {
                    // 主要颜色 - 使用亮青色
                    primaryColor: '#00d4ff',
                    primaryTextColor: '#ffffff',
                    primaryBorderColor: '#00f2ff',

                    // 次要颜色 - 使用深色但不太暗
                    secondaryColor: '#2a3f5f',
                    secondaryTextColor: '#ffffff',
                    secondaryBorderColor: '#00d4ff',

                    // 第三颜色
                    tertiaryColor: '#1e3a5f',
                    tertiaryTextColor: '#ffffff',
                    tertiaryBorderColor: '#00d4ff',

                    // 线条颜色
                    lineColor: '#00f2ff',

                    // 文字颜色 - 确保所有文字都是白色
                    textColor: '#ffffff',
                    mainBkg: '#1a2332',

                    // Git 图表特定颜色
                    git0: '#00d4ff',
                    git1: '#7c4dff',
                    git2: '#ff6b6b',
                    git3: '#4ecdc4',
                    git4: '#ffd93d',
                    git5: '#95e1d3',
                    git6: '#f38181',
                    git7: '#aa96da',

                    // Git 分支名称文字颜色（gitInv 控制分支名称标签的文字颜色）
                    gitInv0: '#000000',
                    gitInv1: '#000000',
                    gitInv2: '#000000',
                    gitInv3: '#000000',
                    gitInv4: '#000000',
                    gitInv5: '#000000',
                    gitInv6: '#000000',
                    gitInv7: '#000000',

                    // 提交点颜色 - 使用黑色文字以便在亮色背景上显示
                    commitLabelColor: '#000000',
                    commitLabelBackground: '#00d4ff',
                    commitLabelFontSize: '14px',

                    // 标签颜色 - 使用黑色文字
                    tagLabelColor: '#000000',
                    tagLabelBackground: '#00d4ff',
                    tagLabelBorder: '#00f2ff',
                    tagLabelFontSize: '12px',

                    // Git 标签文字颜色（确保所有标签都是黑色）
                    gitTagLabelColor: '#000000',
                    gitTagLabelBackground: '#00d4ff',
                    gitTagLabelBorder: '#00f2ff',

                    // 分支标签颜色
                    gitBranchLabel0: '#000000',
                    gitBranchLabel1: '#000000',
                    gitBranchLabel2: '#000000',
                    gitBranchLabel3: '#000000',
                    gitBranchLabel4: '#000000',
                    gitBranchLabel5: '#000000',
                    gitBranchLabel6: '#000000',
                    gitBranchLabel7: '#000000',

                    // 节点颜色
                    nodeBorder: '#00f2ff',
                    nodeTextColor: '#ffffff',

                    // 边框和背景
                    clusterBkg: '#1a2332',
                    clusterBorder: '#00d4ff',

                    // 标题颜色
                    titleColor: '#ffffff',

                    // 边缘标签
                    edgeLabelBackground: '#1a2332',

                    // 活动状态
                    activeTaskBkgColor: '#00d4ff',
                    activeTaskBorderColor: '#00f2ff',

                    // 网格颜色
                    gridColor: '#333333',

                    // 序列图颜色
                    actorBorder: '#00f2ff',
                    actorBkg: '#1a2332',
                    actorTextColor: '#ffffff',
                    actorLineColor: '#00d4ff',
                    signalColor: '#ffffff',
                    signalTextColor: '#ffffff',
                    labelBoxBkgColor: '#1a2332',
                    labelBoxBorderColor: '#00f2ff',
                    labelTextColor: '#ffffff',
                    loopTextColor: '#ffffff',
                    noteBorderColor: '#00f2ff',
                    noteBkgColor: '#1a2332',
                    noteTextColor: '#ffffff',
                    activationBorderColor: '#00f2ff',
                    activationBkgColor: '#2a3f5f',
                    sequenceNumberColor: '#ffffff'
                }
            },
            light: {
                theme: 'default',
                themeVariables: {
                    primaryColor: '#e0f2f0',
                    primaryTextColor: '#123330',
                    primaryBorderColor: '#0b7a75',
                    secondaryColor: '#eef1f4',
                    secondaryTextColor: '#2b2b2b',
                    secondaryBorderColor: '#7a99a8',
                    tertiaryColor: '#f4f4f2',
                    tertiaryTextColor: '#2b2b2b',
                    tertiaryBorderColor: '#c9c9c4',
                    lineColor: '#0b7a75',
                    textColor: '#2b2b2b',
                    mainBkg: '#e0f2f0',
                    nodeBorder: '#0b7a75',
                    nodeTextColor: '#123330',
                    clusterBkg: '#f0efec',
                    clusterBorder: '#0b7a75',
                    titleColor: '#1a1a1a',
                    edgeLabelBackground: '#faf9f7',
                    actorBorder: '#0b7a75',
                    actorBkg: '#e0f2f0',
                    actorTextColor: '#123330',
                    actorLineColor: '#0b7a75',
                    signalColor: '#2b2b2b',
                    signalTextColor: '#2b2b2b',
                    labelBoxBkgColor: '#e0f2f0',
                    labelBoxBorderColor: '#0b7a75',
                    labelTextColor: '#2b2b2b',
                    loopTextColor: '#2b2b2b',
                    noteBorderColor: '#0b7a75',
                    noteBkgColor: '#fff8e6',
                    noteTextColor: '#2b2b2b',
                    activationBorderColor: '#0b7a75',
                    activationBkgColor: '#d7efec',
                    sequenceNumberColor: '#ffffff',
                    git0: '#0b7a75',
                    git1: '#7c4dff',
                    git2: '#d1495b',
                    git3: '#2a9d8f',
                    git4: '#e9c46a',
                    git5: '#457b9d',
                    git6: '#e76f51',
                    git7: '#6d597a'
                }
            }
        };

        // 按当前主题渲染 / 重渲染所有 Mermaid 图（初次渲染与切换时都调用）
        window.renderMermaidForTheme = function (theme) {
            if (typeof mermaid === 'undefined') return;
            var cfg = window.mermaidConfigs[theme] || window.mermaidConfigs.dark;
            mermaid.initialize({
                startOnLoad: false,
                theme: cfg.theme,
                themeVariables: cfg.themeVariables
            });
            var nodes = document.querySelectorAll('.mermaid');
            nodes.forEach(function (node) {
                var src = node.getAttribute('data-src');
                if (src === null) {
                    // 首次：把源码存入 data-src，供后续切换重渲染
                    src = node.textContent;
                    node.setAttribute('data-src', src);
                }
                node.removeAttribute('data-processed');
                node.innerHTML = src;
            });
            if (nodes.length) {
                mermaid.init(undefined, nodes);
            }
        };

document.addEventListener('DOMContentLoaded', function() {
            // 查找所有 language-mermaid 的代码块
            document.querySelectorAll('pre code.language-mermaid').forEach(function(block) {
                // 获取 Mermaid 代码
                const code = block.textContent;

                // 创建一个新的 div 元素来替换 pre 标签
                const mermaidDiv = document.createElement('div');
                mermaidDiv.className = 'mermaid';
                mermaidDiv.setAttribute('data-src', code); // 存源码供主题切换重渲染
                mermaidDiv.textContent = code;

                // 替换原来的 pre 元素
                block.parentElement.replaceWith(mermaidDiv);
            });

            // 按当前主题初次渲染
            var theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            if (typeof window.renderMermaidForTheme === 'function') {
                window.renderMermaidForTheme(theme);
            }
        });
