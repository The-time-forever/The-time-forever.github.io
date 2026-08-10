      const sidebar = document.querySelector(".sidebar");
      const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
      const navLinks = Array.from(document.querySelectorAll(".side-nav a[href^='#']"));
      const hero = document.querySelector(".hero");
      const heroImage = document.querySelector(".hero-media");
      const calendarStage = document.querySelector(".calendar-stage");
      const calendarPanel = document.querySelector(".hero-calendar");
      const calendarDays = document.querySelector(".calendar-days");
      const calendarYear = document.querySelector(".calendar-year");
      const calendarMonth = document.querySelector(".calendar-month");
      const calendarDate = document.querySelector(".calendar-date strong");
      const calendarWeekday = document.querySelector(".calendar-date span");
      const calendarDock = document.querySelector(".calendar-dock");
      const calendarDockMonth = document.querySelector(".calendar-dock-month");
      const calendarDockDate = document.querySelector(".calendar-dock-date");
      const calendarHide = document.querySelector(".calendar-hide-toggle");
      const calendarShow = document.querySelector(".calendar-show-toggle");
      let calendarKeyboardActivation = false;
      const monthNames = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
      ];
      const weekdayNames = [
        "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY",
        "THURSDAY", "FRIDAY", "SATURDAY"
      ];
      const desktopCalendarMedia = window.matchMedia("(min-width: 761px)");
      let calendarFeaturesInitialized = false;

      function regionInkScore(pixels, width, xStart, xEnd, yStart, yEnd) {
        let score = 0;
        let samples = 0;
        for (let y = yStart; y < yEnd; y += 1) {
          for (let x = xStart; x < xEnd; x += 1) {
            const offset = (y * width + x) * 4;
            const luminance =
              pixels[offset] * 0.2126 +
              pixels[offset + 1] * 0.7152 +
              pixels[offset + 2] * 0.0722;
            const darkness = Math.max(0, (165 - luminance) / 165);
            const nextOffset = offset + 4;
            const nextLuminance =
              pixels[nextOffset] * 0.2126 +
              pixels[nextOffset + 1] * 0.7152 +
              pixels[nextOffset + 2] * 0.0722;
            score += darkness + Math.abs(luminance - nextLuminance) / 255 * 0.7;
            samples += 1;
          }
        }
        return samples ? score / samples : 0;
      }

      function regionAverageLuminance(pixels, width, xStart, xEnd, yStart, yEnd) {
        let luminance = 0;
        let samples = 0;
        for (let y = yStart; y < yEnd; y += 1) {
          for (let x = xStart; x < xEnd; x += 1) {
            const offset = (y * width + x) * 4;
            luminance +=
              pixels[offset] * 0.2126 +
              pixels[offset + 1] * 0.7152 +
              pixels[offset + 2] * 0.0722;
            samples += 1;
          }
        }
        return samples ? luminance / samples : 127;
      }

      function useCalendarFallback() {
        if (!desktopCalendarMedia.matches) return;
        hero.dataset.calendarSide = "left";
        hero.dataset.calendarDetection = "fallback";
        hero.dataset.calendarTone = "mid";
        hero.dataset.calendarReady = "true";
      }

      function detectCalendarSide() {
        if (!heroImage || !heroImage.complete || heroImage.naturalWidth === 0) return;
        if (!desktopCalendarMedia.matches) return;

        const canvas = document.createElement("canvas");
        const width = 160;
        const height = 90;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          useCalendarFallback();
          return;
        }

        try {
          context.drawImage(heroImage, 0, 0, width, height);
          const pixels = context.getImageData(0, 0, width, height).data;
          // The large month numeral usually occupies the lower-middle band.
          const leftScore = regionInkScore(pixels, width, 10, 68, 43, 75);
          const rightScore = regionInkScore(pixels, width, 92, 150, 43, 75);
          const calendarSide = leftScore >= rightScore ? "right" : "left";
          hero.dataset.calendarSide = calendarSide;
          hero.dataset.calendarDetection = "visual-density";

          const calendarLuminance = calendarSide === "right"
            ? regionAverageLuminance(pixels, width, 104, 150, 18, 68)
            : regionAverageLuminance(pixels, width, 10, 56, 18, 68);
          hero.dataset.calendarTone =
            calendarLuminance >= 170 ? "light" :
            calendarLuminance <= 95 ? "dark" : "mid";
          hero.dataset.calendarLuminance = String(Math.round(calendarLuminance));
          hero.dataset.calendarReady = "true";
        } catch (_) {
          useCalendarFallback();
        }
      }

      function initializeCalendarPlacement() {
        if (!desktopCalendarMedia.matches) return;

        if (heroImage.complete) {
          if (heroImage.naturalWidth > 0) {
            detectCalendarSide();
          } else {
            useCalendarFallback();
          }
          return;
        }

        if (typeof heroImage.decode === "function") {
          heroImage.decode().then(detectCalendarSide).catch(() => {
            if (!heroImage.complete) return;
            if (heroImage.naturalWidth > 0) {
              detectCalendarSide();
            } else {
              useCalendarFallback();
            }
          });
        }
      }

      heroImage.addEventListener("load", detectCalendarSide);
      heroImage.addEventListener("error", useCalendarFallback);
      initializeCalendarPlacement();

      desktopCalendarMedia.addEventListener("change", () => {
        if (!desktopCalendarMedia.matches) {
          hero.dataset.calendarReady = "false";
          return;
        }
        hero.dataset.calendarReady = "false";
        initializeCalendarPlacement();
        ensureCalendarFeatures();
      });

      function setMobileMenu(open) {
        sidebar.dataset.menuOpen = String(open);
        mobileMenuToggle.setAttribute("aria-expanded", String(open));
        mobileMenuToggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
      }

      mobileMenuToggle.addEventListener("click", () => {
        setMobileMenu(sidebar.dataset.menuOpen !== "true");
      });

      document.querySelectorAll(".side-nav a").forEach((link) => {
        link.addEventListener("click", () => setMobileMenu(false));
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          setMobileMenu(false);
        }
      });

      function formatDatePart(value) {
        return String(value).padStart(2, "0");
      }

      function renderCalendar(date = new Date()) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const fragment = document.createDocumentFragment();

        calendarYear.textContent = year;
        calendarMonth.textContent = monthNames[month];
        calendarDate.textContent = day;
        calendarWeekday.textContent = weekdayNames[date.getDay()];
        calendarDockMonth.textContent = `${monthNames[month]} ${year}`;
        calendarDockDate.textContent = `${formatDatePart(month + 1)} · ${formatDatePart(day)}`;
        calendarPanel.setAttribute("aria-label", `${year}年${month + 1}月日历，今天是${day}日`);

        for (let index = 0; index < firstWeekday; index += 1) {
          const spacer = document.createElement("span");
          spacer.setAttribute("aria-hidden", "true");
          fragment.append(spacer);
        }

        for (let dateNumber = 1; dateNumber <= daysInMonth; dateNumber += 1) {
          const dateNode = document.createElement("time");
          dateNode.className = "calendar-day";
          dateNode.dateTime = `${year}-${formatDatePart(month + 1)}-${formatDatePart(dateNumber)}`;
          dateNode.textContent = dateNumber;
          if (dateNumber === day) {
            dateNode.classList.add("is-today");
          }
          fragment.append(dateNode);
        }

        calendarDays.replaceChildren(fragment);
      }

      function setCalendarState(state, { persist = true, moveFocus = false } = {}) {
        const collapsed = state === "collapsed";
        hero.dataset.calendarState = collapsed ? "collapsed" : "expanded";
        calendarStage.setAttribute("aria-hidden", String(collapsed));
        calendarDock.setAttribute("aria-hidden", String(!collapsed));
        calendarHide.setAttribute("aria-expanded", String(!collapsed));
        calendarShow.setAttribute("aria-expanded", String(!collapsed));
        calendarStage.inert = collapsed;
        calendarDock.inert = !collapsed;

        if (persist) {
          try {
            localStorage.setItem("homepage-calendar-state", hero.dataset.calendarState);
          } catch (_) {
            // Keep the controls working when storage is unavailable.
          }
        }

        if (moveFocus) {
          (collapsed ? calendarShow : calendarHide).focus({ preventScroll: true });
        }
      }

      function ensureCalendarFeatures() {
        if (calendarFeaturesInitialized) return;
        if (!desktopCalendarMedia.matches) return;
        if (!calendarStage || !calendarDock || !calendarHide || !calendarShow) return;
        calendarFeaturesInitialized = true;

        renderCalendar();

        let savedCalendarState = "expanded";
        try {
          savedCalendarState = localStorage.getItem("homepage-calendar-state") || "expanded";
        } catch (_) {
          // Use the expanded state when storage is unavailable.
        }
        setCalendarState(savedCalendarState, { persist: false });

        [calendarHide, calendarShow].forEach((button) => {
          button.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              calendarKeyboardActivation = true;
            }
          });
        });

        calendarHide.addEventListener("click", () => {
          setCalendarState("collapsed", { moveFocus: calendarKeyboardActivation });
          calendarKeyboardActivation = false;
        });

        calendarShow.addEventListener("click", () => {
          setCalendarState("expanded", { moveFocus: calendarKeyboardActivation });
          calendarKeyboardActivation = false;
        });

        /* === Liquid Glass — pointer-tracked specular highlight === */
        (function initLiquidGlass() {
          const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
          if (!finePointer.matches) return;
          const supportsBackdrop =
            CSS.supports("backdrop-filter", "blur(1px)") ||
            CSS.supports("-webkit-backdrop-filter", "blur(1px)");
          if (!supportsBackdrop) return;

          const targets = document.querySelectorAll(".calendar-stage, .calendar-dock");
          if (!targets.length) return;

          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

          targets.forEach((target) => {
            let raf = 0;
            let nextX = 50;
            let nextY = 30;

            const apply = () => {
              raf = 0;
              target.style.setProperty("--liquid-pointer-x", `${nextX}%`);
              target.style.setProperty("--liquid-pointer-y", `${nextY}%`);
              target.style.setProperty("--liquid-pointer-strength", "1");
            };

            target.addEventListener("pointermove", (event) => {
              const rect = target.getBoundingClientRect();
              nextX = ((event.clientX - rect.left) / rect.width) * 100;
              nextY = ((event.clientY - rect.top) / rect.height) * 100;
              if (raf) return;
              raf = requestAnimationFrame(apply);
            }, { passive: true });

            target.addEventListener("pointerenter", () => {
              if (reducedMotion.matches) return;
              target.style.setProperty("--liquid-pointer-strength", "1");
            });

            target.addEventListener("pointerleave", () => {
              if (raf) {
                cancelAnimationFrame(raf);
                raf = 0;
              }
              target.style.setProperty("--liquid-pointer-strength", "0");
            });

            target.addEventListener("pointerdown", () => {
              target.style.setProperty("--liquid-pointer-strength", "1");
            });
          });

          finePointer.addEventListener("change", () => {
            if (!finePointer.matches) {
              targets.forEach((target) => {
                target.style.removeProperty("--liquid-pointer-strength");
              });
            }
          });
        })();

        /* === Calendar Dock — slide-up on hover, slide-down on leave === */
        (function initDockSlide() {
          const dock = document.querySelector(".calendar-dock");
          if (!dock) return;

          const DOCK_AUTO_HIDE_MS = 1400;
          const HIDE_DELAY = 500;

          let hideTimer = 0;
          let autoHideTimer = 0;
          let userInteracted = false;

          const clearAllTimers = () => {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = 0; }
            if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = 0; }
          };

          const showDock = () => {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = 0; }
            if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = 0; }
            dock.classList.add("is-visible");
          };

          const scheduleHide = () => {
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
              dock.classList.remove("is-visible");
              hideTimer = 0;
            }, HIDE_DELAY);
          };

          dock.addEventListener("pointerenter", () => {
            userInteracted = true;
            showDock();
          });
          dock.addEventListener("pointerleave", () => {
            scheduleHide();
          });

          const toggle = dock.querySelector(".calendar-show-toggle");
          if (toggle) {
            toggle.addEventListener("focus", () => {
              userInteracted = true;
              showDock();
            });
            toggle.addEventListener("blur", () => {
              if (!dock.matches(":hover")) scheduleHide();
            });
          }

          const hero = document.querySelector(".hero");
          if (hero) {
            const observer = new MutationObserver(() => {
              const state = hero.dataset.calendarState;
              clearAllTimers();

              if (state === "expanded") {
                dock.classList.remove("is-visible");
                userInteracted = false;
                return;
              }

              if (state === "collapsed") {
                userInteracted = false;
                // Reveal dock immediately — it slides up while the stage
                // shrinks down, so visually the stage "becomes" the dock.
                dock.classList.add("is-visible");

                autoHideTimer = setTimeout(() => {
                  autoHideTimer = 0;
                  if (!userInteracted && !dock.matches(":hover")) {
                    scheduleHide();
                  }
                }, DOCK_AUTO_HIDE_MS);
              }
            });
            observer.observe(hero, { attributes: true, attributeFilter: ["data-calendar-state"] });
          }
        })();
      }

      // Boot calendar features immediately when above threshold.
      ensureCalendarFeatures();

      function updateActiveNavigation() {
        navLinks.forEach((link) => {
          if (link.getAttribute("href") === "#top") {
            link.setAttribute("aria-current", "page");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      }

      window.addEventListener("scroll", updateActiveNavigation, { passive: true });
      window.addEventListener("hashchange", updateActiveNavigation);
      updateActiveNavigation();
