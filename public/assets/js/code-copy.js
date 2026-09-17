// Adds a "复制" button to every code block in a post's content.
(function () {
  function copyText(text, btn) {
    function done(ok) {
      btn.textContent = ok ? '已复制' : '复制失败';
      btn.classList.toggle('copied', ok);
      setTimeout(function () {
        btn.textContent = '复制';
        btn.classList.remove('copied');
      }, 1500);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        function () { done(true); },
        function () { done(false); }
      );
      return;
    }

    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (_) {
      ok = false;
    }
    document.body.removeChild(textarea);
    done(ok);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var blocks = document.querySelectorAll('.glass-container pre');
    blocks.forEach(function (pre) {
      if (pre.querySelector('.code-copy-btn')) return;

      var code = pre.querySelector('code');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy-btn';
      btn.textContent = '复制';
      btn.setAttribute('aria-label', '复制代码');

      btn.addEventListener('click', function () {
        copyText((code || pre).innerText, btn);
      });

      pre.appendChild(btn);
    });
  });
}());
