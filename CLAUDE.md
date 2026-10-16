# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `AGENTS.md` for repository conventions (project structure, coding style, commit/PR guidelines); this file focuses on architecture context and commands.

## Commands

- `npm ci` — install exact locked dependencies (use before local verification and in CI).
- `npm run dev` — start the Astro dev server.
- `npm run build` — validate content collections and build the production site into `dist/`.
- `npm run preview` — serve the built `dist/` output for a final check.
- `python -m pip install -r scripts/requirements-calendar.txt` — install the calendar updater dependency (Python 3.12+).
- `python scripts/update_calendar.py --dry-run` — discover and validate the current Beijing month's official wallpaper pair. Add `--year YYYY --month M` together for a specific month.
- `python scripts/update_calendar.py --build` — update the pair and metadata, with Astro build validation and rollback on failure.
- `python -m unittest discover -s scripts/tests -v` — run the calendar updater failure-protection tests.

There is no frontend lint or unit-test command configured. Run the Python tests when changing calendar update logic. For site changes, run `npm run build` and manually check `/`, `/posts/`, `/about/`, the not-found route, and any changed post page in a browser, including MathJax/Mermaid rendering if the post uses them.

## Architecture

This is a static blog: Astro (content collections) generating pages that were originally a Jekyll site, then migrated. Several page templates deliberately replicate old Jekyll/Liquid behavior in TypeScript — see comments referencing "Jekyll" before changing date formatting, slug generation, or excerpt logic.

### Content pipeline

- Posts are markdown files in `src/content/posts/*.md`, loaded via `src/content.config.ts` (a `glob` loader, not the legacy `src/content/config.ts` pattern). The Zod schema requires `title` and `date` (`YYYY-MM-DD` string); `categories` is a closed enum (`技术折腾`/`学术写作`/`工具效率`/`知识笔记`) — adding a new category means updating the schema. Optional fields: `featured`, `tags`, `permalink`, `redirect_to`, `math`, `mermaid`.
- `src/utils/permalink.ts` (`getPostUrl`) reproduces Jekyll's permalink rule: explicit `permalink` in frontmatter wins, otherwise builds `/posts/:year/:month/:day/:title-slug/` using a slugify function that intentionally preserves Chinese characters (matches old Jekyll behavior, do not "fix" to transliterate).
- Posts with `redirect_to` set are treated as external links and are excluded from static path generation in `src/pages/posts/[...slug].astro` — they show up in listings but link out instead of rendering a detail page.
- `astro.config.mjs` wires a custom remark pipeline: `remark-slug` → `src/utils/remark-kramdown-toc.ts` (a hand-written plugin that converts kramdown's `{:toc}` placeholder syntax into something `remark-toc` understands) → `remark-toc` (looks for a `## 目录` heading). This ordering matters — kramdown-style `{:toc}` posts must be normalized before `remark-toc` runs.

### Page structure

- `src/layouts/BaseLayout.astro` is the outer HTML shell (sets `data-theme`, includes `ThemeInit`). `PostLayout.astro` wraps it for article pages and conditionally loads MathJax/Mermaid only when a post's frontmatter sets `math: true` / `mermaid: true` — don't load these globally, they're intentionally lazy/opt-in per post.
- `src/pages/index.astro` (homepage) and `src/pages/posts/index.astro` (archive) both independently reimplement Jekyll template logic for excerpts, truncation, and category/tag display (e.g. `getExcerpt`, `truncate`, `computeCategories`, `computeSearch` in `index.astro`). These are duplicated per-page rather than shared utilities — that's intentional given each page's slightly different rendering needs, but keep it in mind when fixing a bug in one and checking whether the other has the same issue.
- Static assets that need stable public URLs (site CSS/JS in `assets/`, images, favicon, per-post images in `post-images/`) live in `public/` and are referenced by absolute path with cache-busting query strings (e.g. `?v=20260723-refactor`) — bump the version string when changing a shared CSS/JS file so browsers pick up the change.
- Mermaid is lazy-loaded: `mermaid-renderer.js` is the deferred script actually included in the page; it loads the (large, ~2.8MB) `mermaid.min.js` itself only when a diagram scrolls into view.

### Third-party integrations

- Giscus comments (`src/components/GiscusComments.astro`) and 不蒜子 (Busuanzi) page/site view counters (`src/components/BusuanziScript.astro`, `SiteStats.astro`) are loaded via inline third-party scripts tied to this specific repo (`data-repo`, `data-repo-id`). Busuanzi is deliberately deferred (`requestIdleCallback`/timeout) to avoid blocking initial render.
- The guestbook (`GuestbookPanel.astro`) is a slide-out panel wrapping the same Giscus widget, toggled via `data-open-guestbook` links and `guestbook.js`.

### Deployment

`.github/workflows/deploy.yml` builds on pushes to `main`, PRs, and manual dispatch (using `ASTRO_BASE` from `actions/configure-pages`). Pushes and manual runs on `main` deploy to GitHub Pages; PR runs only build. The optional manual `revision` input selects the verified commit to check out. Don't rely on `ASTRO_BASE` locally — it's only set in CI.

### Calendar wallpaper updates

`scripts/update_calendar.py` discovers official ZZZ announcements and downloads the PC/mobile pair through the official Minas share flow. It updates the fixed homepage JPG paths and `src/data/calendar.json`; `src/pages/index.astro` reads the metadata for `alt` while retaining Astro image optimization and responsive sources. Preserve validation of both images, transaction recovery, build-failure rollback, and hash-based duplicate detection. Detailed maintenance rules are in `AGENTS.md` under Calendar Wallpaper Automation.

`.github/workflows/update-calendar.yml` checks on days 1-10 at 02:17 UTC (10:17 Beijing), with manual `year`, `month`, `dry_run` and `force` inputs. It runs the Python tests and updates with `--build` before committing the pair and metadata to `main`. It explicitly dispatches `deploy.yml` with the committed revision because default `GITHUB_TOKEN` pushes do not start push workflows; keep this dispatch and the manual deployment condition intact.
