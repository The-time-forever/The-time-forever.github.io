// 主题切换：夜间 <-> 白天，持久化并联动粒子 / giscus / mermaid。
(function () {
  var STORAGE_KEY = 'theme';
  var root = document.documentElement;

  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  // giscus：主题映射
  function giscusTheme(theme) {
    return theme === 'light' ? 'light' : 'transparent_dark';
  }

  function syncGiscus(theme) {
    var frame = document.querySelector('iframe.giscus-frame');
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: giscusTheme(theme) } } },
      'https://giscus.app'
    );
  }

  function syncParticles(theme) {
    if (!window.spaceParticles) return;
    if (theme === 'dark') {
      window.spaceParticles.start();
    } else {
      window.spaceParticles.stop();
    }
  }

  function syncMermaid(theme) {
    // post.html 在有 Mermaid 时定义此函数；无则跳过。
    if (typeof window.renderMermaidForTheme === 'function') {
      window.renderMermaidForTheme(theme);
    }
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
    syncParticles(theme);
    syncGiscus(theme);
    syncMermaid(theme);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
      });
    }
    // 初次进入时，让粒子/评论与已生效主题保持一致
    // （粒子脚本自身会按主题决定是否自启，这里只处理评论延迟加载的情况）
    syncGiscus(currentTheme());
  });
})();
