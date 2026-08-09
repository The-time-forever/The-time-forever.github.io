// Typed headline treatment adapted from the Antigravity sample's TypedHeader.
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function initialiseTypedHeadings() {
    document.querySelectorAll('[data-archive-typed]').forEach(function (element) {
      if (element.dataset.typedReady === 'true') return;

      var content = element.querySelector('[data-typed-content]');
      var cursor = element.querySelector('[data-typed-cursor]');
      if (!content || !cursor) return;

      var chars = [];
      var text = content.textContent || '';
      content.textContent = '';
      element.dataset.typedReady = 'true';

      Array.from(text).forEach(function (character) {
        var char = document.createElement('span');
        char.className = 'typed-char';
        char.textContent = character === ' ' ? '\u00a0' : character;
        content.appendChild(char);
        chars.push(char);
      });

      function placeCursor(char, atEnd) {
        var containerRect = element.getBoundingClientRect();
        var charRect = char.getBoundingClientRect();
        var x = charRect.left - containerRect.left + (atEnd ? charRect.width + 8 : 0);
        var y = charRect.top - containerRect.top;
        cursor.style.setProperty('--typed-cursor-x', x + 'px');
        cursor.style.setProperty('--typed-cursor-y', y + 'px');
      }

      if (!chars.length) return;
      placeCursor(chars[0], false);
      cursor.style.opacity = '1';
      cursor.style.animation = 'archive-cursor-blink 0.8s step-end infinite';

      var delay = Number(element.dataset.typedDelay || 0.2) * 1000;
      chars.forEach(function (char, index) {
        window.setTimeout(function () {
          placeCursor(char, true);
          char.style.opacity = '1';
        }, delay + index * 50);
      });
      window.setTimeout(function () {
        cursor.style.animation = 'none';
        cursor.style.opacity = '0';
      }, delay + chars.length * 50 + 420);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseTypedHeadings);
  } else {
    initialiseTypedHeadings();
  }
})();
