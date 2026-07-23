(function () {
  var root = document.documentElement;
  var panel = document.getElementById("guestbook-panel");
  var closeButton = document.getElementById("guestbook-close");
  var overlay = document.getElementById("guestbook-overlay");
  var triggers = Array.prototype.slice.call(
    document.querySelectorAll("[data-open-guestbook]")
  );
  var giscusLoaded = false;
  var activeTrigger = null;

  if (!panel || !closeButton || !overlay || triggers.length === 0) return;

  function loadGiscus() {
    if (giscusLoaded) return;

    var script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "The-time-forever/The-time-forever.github.io");
    script.setAttribute("data-repo-id", "R_kgDOQXvq9w");
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDOQXvq984CzpQ2");
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", "Guestbook");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute(
      "data-theme",
      window.siteTheme
        ? window.siteTheme.giscusTheme(window.siteTheme.current())
        : root.dataset.theme === "light"
          ? "noborder_light"
          : "transparent_dark"
    );
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;
    panel.querySelector(".giscus").appendChild(script);
    giscusLoaded = true;
  }

  function openGuestbook(trigger) {
    activeTrigger = trigger || activeTrigger;
    panel.classList.add("active");
    overlay.classList.add("active");
    panel.setAttribute("aria-hidden", "false");
    triggers.forEach(function (item) {
      item.setAttribute("aria-expanded", "true");
    });
    loadGiscus();
  }

  function closeGuestbook(moveFocus) {
    panel.classList.remove("active");
    overlay.classList.remove("active");
    panel.setAttribute("aria-hidden", "true");
    triggers.forEach(function (item) {
      item.setAttribute("aria-expanded", "false");
    });

    if (moveFocus && activeTrigger) {
      activeTrigger.focus({ preventScroll: true });
    }
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      openGuestbook(trigger);
    });
  });

  closeButton.addEventListener("click", function () {
    closeGuestbook(true);
  });
  overlay.addEventListener("click", function () {
    closeGuestbook(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && panel.classList.contains("active")) {
      closeGuestbook(true);
    }
  });
}());
