// Shared theme controller for the homepage, archive and post layouts.
(function () {
  var STORAGE_KEY = "theme";
  var root = document.documentElement;

  function currentTheme() {
    return root.dataset.theme === "dark" ? "dark" : "light";
  }

  function giscusTheme(theme) {
    return theme === "dark" ? "transparent_dark" : "noborder_light";
  }

  function syncControls(theme) {
    var dark = theme === "dark";
    document.querySelectorAll(".theme-toggle").forEach(function (button) {
      button.setAttribute("aria-pressed", String(dark));
      var label = button.querySelector(".theme-label");
      if (label) label.textContent = dark ? "浅色模式" : "深色模式";
    });
  }

  function syncGiscus(theme) {
    document.querySelectorAll("iframe.giscus-frame").forEach(function (frame) {
      if (!frame.contentWindow) return;
      frame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: giscusTheme(theme) } } },
        "https://giscus.app"
      );
    });
  }

  function syncDependentModules(theme) {
    if (window.particleField) window.particleField.start();
    if (typeof window.renderMermaidForTheme === "function") {
      window.renderMermaidForTheme(theme);
    }
    syncGiscus(theme);
  }

  function applyTheme(theme, persist) {
    var next = theme === "dark" ? "dark" : "light";
    root.dataset.theme = next;
    syncControls(next);
    syncDependentModules(next);
    if (persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (_) {
        // The page remains usable when storage is unavailable.
      }
    }
    document.dispatchEvent(new CustomEvent("site-theme-change", {
      detail: { theme: next }
    }));
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncControls(currentTheme());

    document.querySelectorAll(".theme-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
      });
    });

    var observer = new MutationObserver(function () {
      syncGiscus(currentTheme());
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY &&
        (event.newValue === "light" || event.newValue === "dark")) {
      applyTheme(event.newValue, false);
    }
  });

  window.siteTheme = {
    apply: applyTheme,
    current: currentTheme,
    giscusTheme: giscusTheme
  };
}());
