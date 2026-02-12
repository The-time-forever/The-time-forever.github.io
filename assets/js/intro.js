document.addEventListener('DOMContentLoaded', () => {
    const stageEl = document.getElementById("introStage");
    if (!stageEl) return; // Not on home page or element missing

    const bgImageEl = document.getElementById("introBgImage");
    const highlighterEl = document.getElementById("introHighlighter");
    const pullArrowEl = document.getElementById("introPullArrow");
    
    // Optional manual loader
    const jsonLoaderEl = document.getElementById("introJsonLoader");
    const pickJsonBtn = document.getElementById("introPickJsonBtn");
    const jsonFileInput = document.getElementById("introJsonFileInput");

    const NORMAL_TRANSITION = "left 280ms linear, top 280ms linear, width 280ms linear, height 280ms linear, opacity 220ms ease";
    const INTRO_TRANSITION = "left 620ms cubic-bezier(0.2, 0.65, 0.2, 1), top 620ms cubic-bezier(0.2, 0.65, 0.2, 1), width 280ms linear, height 280ms linear, opacity 420ms ease";
    // CALIB shifted slightly for adjustment if needed
    const CALIB = { leftShift: 0.0, topShift: 0.0, width: 3.0, height: 5.2 };

    let currentData = null;
    let currentRect = null;
    let animToken = 0;
    let revealStarted = false;
    let stagePulled = false;
    let dragState = null;

    // Check if intro has been shown this session, if you want it once per session
    // For now we run it always on home page load as requested.

    async function loadCoordinates() {
      // Adjusted paths to be absolute from root
      const candidates = [
          "/intro-animation/calendar202602-coordinates-python.json",
          "/intro-animation/calendar-coordinates-python.json"
      ];
      for (const file of candidates) {
        try {
          const res = await fetch(file, { cache: "no-store" });
          if (!res.ok) continue;
          return await res.json();
        } catch (_) {}
      }
      throw new Error("坐标 JSON 读取失败"); // Coordinate JSON load failed
    }

    function enableManualJsonLoader() {
      if (jsonLoaderEl) {
        jsonLoaderEl.style.display = "flex";
        if (pickJsonBtn) pickJsonBtn.onclick = () => jsonFileInput && jsonFileInput.click();
      }
    }

    function readJsonFromFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            resolve(JSON.parse(String(reader.result || "")));
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(reader.error || new Error("文件读取失败")); 
        reader.readAsText(file, "utf-8");
      });
    }

    function getCoverMetrics(data) {
      if (!bgImageEl) return { renderW: 0, renderH: 0, offsetX: 0, offsetY: 0 };
      const rect = stageEl.getBoundingClientRect();
      // Fallback dimensions if image not loaded yet or data missing
      const imgW = Number(bgImageEl.naturalWidth) || Number(data?.imageNaturalSize?.width) || 2560;
      const imgH = Number(bgImageEl.naturalHeight) || Number(data?.imageNaturalSize?.height) || 1440;
      
      const scale = Math.max(rect.width / imgW, rect.height / imgH);
      const renderW = imgW * scale;
      const renderH = imgH * scale;
      const offsetX = (rect.width - renderW) / 2;
      const offsetY = (rect.height - renderH) / 2;
      return { renderW, renderH, offsetX, offsetY };
    }

    function calcHighlighterRect(item, data) {
      const m = getCoverMetrics(data);
      const widthPx = (CALIB.width / 100) * m.renderW;
      const heightPx = (CALIB.height / 100) * m.renderH;
      const anchorX = m.offsetX + (item.leftPercent / 100) * m.renderW;
      const anchorY = m.offsetY + (item.topPercent / 100) * m.renderH;
      const leftPx = anchorX - widthPx * 0.5 + (CALIB.leftShift / 100) * m.renderW;
      const topPx = anchorY - heightPx * 0.63 + (CALIB.topShift / 100) * m.renderH;
      return { leftPx, topPx, widthPx, heightPx };
    }

    function applyRect(rect, visible = true) {
      if (!highlighterEl) return;
      currentRect = rect;
      highlighterEl.style.left = `${rect.leftPx}px`;
      highlighterEl.style.top = `${rect.topPx}px`;
      highlighterEl.style.width = `${rect.widthPx}px`;
      highlighterEl.style.height = `${rect.heightPx}px`;
      if (visible) highlighterEl.classList.add("visible");
      else highlighterEl.classList.remove("visible");
    }

    function positionPullArrow(rectOverride) {
      if (!pullArrowEl) return;
      const rect = rectOverride || currentRect;
      if (!rect) return;
      const x = rect.leftPx + rect.widthPx * 0.5 - 9;
      const y = rect.topPx + rect.heightPx * 0.5 - 9;
      pullArrowEl.style.left = `${x}px`;
      pullArrowEl.style.top = `${y}px`;
    }

    function showPullArrow(rectOverride) {
      if (!pullArrowEl) return;
      if (rectOverride) positionPullArrow(rectOverride);
      pullArrowEl.classList.add("visible");
    }

    function hidePullArrow() {
      if (pullArrowEl) pullArrowEl.classList.remove("visible");
    }

    function getTargetDay() {
      return new Date().getDate();
    }

    function getDayItem(data, day) {
      if (!Array.isArray(data?.numbers)) return null;
      return data.numbers.find(n => Number(n.value) === Number(day)) || null;
    }

    function getLastAvailableDay(data) {
      if (!Array.isArray(data?.numbers) || data.numbers.length === 0) return 31;
      return Math.max(...data.numbers.map(n => Number(n.value) || 0));
    }

    function getIntroSlotRect(data) {
      const first = getDayItem(data, 1) || getDayItem(data, getTargetDay());
      if (!first) return null;
      const firstRect = calcHighlighterRect(first, data);
      const day2 = getDayItem(data, 2);
      const day2Rect = day2 ? calcHighlighterRect(day2, data) : null;
      const stepX = day2Rect ? (day2Rect.leftPx - firstRect.leftPx) : firstRect.widthPx * 1.05;
      return { ...firstRect, leftPx: firstRect.leftPx - stepX };
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function animateToDay(data, targetDay) {
      if (!data || stagePulled) return;
      const token = ++animToken;
      hidePullArrow();

      const maxDay = getLastAvailableDay(data);
      const endDay = Math.max(1, Math.min(Number(targetDay) || 1, maxDay));
      const first = getDayItem(data, 1) || getDayItem(data, endDay);
      if (!first) return;

      const firstRect = calcHighlighterRect(first, data);
      const day2 = getDayItem(data, 2);
      const day2Rect = day2 ? calcHighlighterRect(day2, data) : null;
      const stepX = day2Rect ? (day2Rect.leftPx - firstRect.leftPx) : firstRect.widthPx * 1.05;

      const preRect = {
        ...firstRect,
        leftPx: firstRect.leftPx - stepX,
        topPx: firstRect.topPx + firstRect.heightPx * 0.55,
      };
      // Adjusted logical position
      const riseRect = { ...preRect, topPx: firstRect.topPx };

      if (highlighterEl) highlighterEl.style.transition = "none";
      applyRect(preRect, false);
      await sleep(34);
      if (token !== animToken) return;

      if (highlighterEl) highlighterEl.style.transition = INTRO_TRANSITION;
      applyRect(riseRect, true);
      await sleep(700);
      if (token !== animToken) return;

      await sleep(220); // pause a bit
      if (token !== animToken) return;

      if (highlighterEl) highlighterEl.style.transition = NORMAL_TRANSITION;
      applyRect(firstRect, true);
      await sleep(280);
      if (token !== animToken) return;

      for (let d = 2; d <= endDay; d++) {
        if (token !== animToken) return;
        const item = getDayItem(data, d);
        if (item) applyRect(calcHighlighterRect(item, data), true);
        await sleep(170);
      }
      if (token !== animToken) return;

      const introRect = getIntroSlotRect(data);
      await sleep(300);
      if (token !== animToken) return;
      showPullArrow(introRect || currentRect);
    }

    function renderCurrent() {
      if (!currentData || stagePulled) return;
      if (highlighterEl) highlighterEl.style.transition = NORMAL_TRANSITION;
      const day = getTargetDay();
      const item = getDayItem(currentData, day);
      if (!item) return;
      applyRect(calcHighlighterRect(item, currentData), true);
      const introRect = getIntroSlotRect(currentData);
      positionPullArrow(introRect || currentRect);
    }

    function triggerRevealCurtain() {
      if (revealStarted) return;
      revealStarted = true;
      stageEl.classList.remove("ready");
      void stageEl.offsetWidth; // trigger reflow
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          stageEl.classList.add("ready");
        });
      });
    }

    function setStagePullOffset(px) {
      if (stagePulled) return;
      const y = Math.max(0, Math.min(window.innerHeight, px));
      stageEl.style.transform = `translateY(${-y}px)`;
    }

    function openHome() {
      if (stagePulled) return;
      stagePulled = true;
      hidePullArrow();
      stageEl.style.transform = "";
      stageEl.classList.add("pulled");
      // Optional: Cleanup listeners if needed to save resources? 
      // But keeping them is fine for simplicity if user navigates back (SPA?) or reloads.
      
      // Allow scrolling on body if it was locked. 
      // Since we used fixed pos, body scroll might be there but behind.
    }

    async function init() {
      try {
        currentData = await loadCoordinates();
        setTimeout(() => {
          if (!currentData) return;
          animateToDay(currentData, getTargetDay());
        }, 2080); // Wait for bg reveal animation somewhat
      } catch (_) {
        enableManualJsonLoader();
      }
    }

    window.addEventListener("resize", () => {
      animToken++;
      renderCurrent();
    });

    if (bgImageEl) {
        bgImageEl.addEventListener("load", triggerRevealCurtain);
        if (bgImageEl.complete) triggerRevealCurtain();
    } else {
        // Backup trigger if image missing?
        setTimeout(triggerRevealCurtain, 500);
    }

    if (pullArrowEl) pullArrowEl.addEventListener("click", openHome);

    stageEl.addEventListener("pointerdown", (e) => {
      if (stagePulled) return;
      if (e.target.closest(".intro-json-loader")) return;
      dragState = { startY: e.clientY, pulled: 0 };
      stageEl.style.transition = "none";
    });

    stageEl.addEventListener("pointermove", (e) => {
      if (!dragState || stagePulled) return;
      const dy = e.clientY - dragState.startY;
      const pulled = Math.max(0, -dy);
      dragState.pulled = pulled;
      setStagePullOffset(pulled);
    });

    function endDrag() {
      if (!dragState || stagePulled) return;
      const pulled = dragState.pulled;
      dragState = null;
      stageEl.style.transition = "transform 700ms cubic-bezier(0.2, 0.75, 0.2, 1)";
      if (pulled > 130) openHome();
      else stageEl.style.transform = "translateY(0)";
    }

    stageEl.addEventListener("pointerup", endDrag);
    stageEl.addEventListener("pointercancel", endDrag);
    stageEl.addEventListener("pointerleave", endDrag);

    if (jsonFileInput) {
        jsonFileInput.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
            currentData = await readJsonFromFile(file);
            animateToDay(currentData, getTargetDay());
        } catch (_) {}
        });
    }

    init();
});
