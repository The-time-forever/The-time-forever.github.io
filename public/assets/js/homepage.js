      const sidebar = document.querySelector(".sidebar");
      const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
      const navLinks = Array.from(document.querySelectorAll(".side-nav a[href^='#']"));

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
