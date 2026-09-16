// Accessible (possibly nested) tab groups for long, multi-part posts
// (frontmatter: tabs: true), plus an optional global OS switch that toggles
// .os-windows / .os-macos blocks anywhere inside its own tab-group.
(function () {
  function ownTabBtns(group) {
    var tabList = group.querySelector(':scope > .tab-list');
    return tabList ? Array.prototype.slice.call(tabList.querySelectorAll(':scope > .tab-btn')) : [];
  }

  function ownPanels(group) {
    return Array.prototype.slice.call(group.querySelectorAll(':scope > .tab-panel'));
  }

  function activate(group, btn, focusBtn) {
    var btns = ownTabBtns(group);
    var panels = ownPanels(group);

    btns.forEach(function (b) {
      var selected = b === btn;
      b.setAttribute('aria-selected', String(selected));
      b.tabIndex = selected ? 0 : -1;
    });

    panels.forEach(function (panel) {
      panel.hidden = panel.id !== btn.getAttribute('aria-controls');
    });

    if (focusBtn) btn.focus();
  }

  function initGroup(group) {
    var btns = ownTabBtns(group);
    if (!btns.length) return;

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activate(group, btn, false);
        try {
          history.replaceState(null, '', '#' + btn.dataset.tab);
        } catch (_) {
          // Ignore environments without history support.
        }
      });

      btn.addEventListener('keydown', function (event) {
        var index = btns.indexOf(btn);
        var next = null;
        if (event.key === 'ArrowRight') next = btns[(index + 1) % btns.length];
        else if (event.key === 'ArrowLeft') next = btns[(index - 1 + btns.length) % btns.length];
        else if (event.key === 'Home') next = btns[0];
        else if (event.key === 'End') next = btns[btns.length - 1];
        if (next) {
          event.preventDefault();
          activate(group, next, true);
        }
      });
    });

    // Default to the first tab; a matching hash (handled separately, after
    // every group has a sane default) can override this.
    activate(group, btns[0], false);
  }

  // Walks from a hash-matched leaf button up through every ancestor tab
  // group, activating the right tab at each level so a deep link expands
  // its parent tabs too.
  function activateChainToHash() {
    var hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    var target = document.querySelector('.tab-btn[data-tab="' + hash.slice(1).replace(/"/g, '\\"') + '"]');
    if (!target) return;

    var el = target;
    while (el) {
      var group = el.closest('[data-tabs]');
      if (!group) break;
      activate(group, el, false);
      var panel = group.parentElement ? group.parentElement.closest('.tab-panel') : null;
      if (!panel) break;
      var parentGroup = panel.closest('[data-tabs]');
      if (!parentGroup) break;
      el = parentGroup.querySelector(':scope > .tab-list > .tab-btn[aria-controls="' + panel.id + '"]');
    }

    target.closest('[data-tabs]').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var OS_STORAGE_KEY = 'guide-os';

  function initOsSwitch(root) {
    var buttons = Array.prototype.slice.call(root.querySelectorAll('.os-switch-btn'));
    if (!buttons.length) return;

    var stored = null;
    try {
      stored = localStorage.getItem(OS_STORAGE_KEY);
    } catch (_) {
      // Ignore environments without storage access.
    }
    var initial = stored || root.getAttribute('data-os') || 'windows';

    function apply(os) {
      root.setAttribute('data-os', os);
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.osTarget === os));
      });
      try {
        localStorage.setItem(OS_STORAGE_KEY, os);
      } catch (_) {
        // Ignore environments without storage access.
      }
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        apply(b.dataset.osTarget);
      });
    });

    apply(initial);
  }

  // Long posts put multiple sections (e.g. 前置准备 / 配置) behind one
  // top-level tab bar; add a shortcut back to that tab bar at the end of
  // the tabbed content, so a reader who scrolled all the way down doesn't
  // have to scroll back up manually.
  function initBackToTabs() {
    var rootGroup = document.querySelector('[data-tabs]');
    if (!rootGroup || rootGroup.closest('.tab-panel')) return;

    var anchor = rootGroup.querySelector(':scope > .tab-list') || rootGroup;

    var wrap = document.createElement('div');
    wrap.className = 'back-to-tabs-wrap';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-to-tabs-btn';
    btn.textContent = '↑ 回到导航';
    btn.addEventListener('click', function () {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    wrap.appendChild(btn);
    rootGroup.appendChild(wrap);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-tabs]').forEach(initGroup);
    document.querySelectorAll('[data-os-root]').forEach(initOsSwitch);
    activateChainToHash();
    initBackToTabs();
  });

  window.addEventListener('hashchange', activateChainToHash);
}());
