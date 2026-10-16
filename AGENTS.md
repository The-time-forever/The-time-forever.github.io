# Repository Guidelines

## Project Structure & Module Organization

This repository is a static personal blog built with Astro and deployed to GitHub Pages. Keep page routes in `src/pages/`, shared page shells in `src/layouts/`, reusable UI in `src/components/`, and build-time helpers in `src/utils/`. Posts live in `src/content/posts/`; their schema is defined in `src/content.config.ts`. Put files that must retain stable public URLs—such as images, stylesheets, and browser scripts—in `public/`. Deployment automation is in `.github/workflows/deploy.yml`; monthly homepage wallpaper updates use `.github/workflows/update-calendar.yml` and `scripts/update_calendar.py`.

`src/pages/404.astro` is the static not-found route. Keep it `noindex`, retain clear links back to `/` and `/posts/`, and use the existing theme and favicon rather than adding a separate third-party asset. Reuse shared navigation components such as `SiteTopbar.astro` and `SiteSidebar.astro` instead of copying responsive navigation markup between pages.

## Build, Test, and Development Commands

- `npm ci` installs the exact locked dependency tree; use it before local verification and in CI.
- `npm run dev` starts the Astro development server.
- `npm run build` validates content and generates the production site in `dist/`.
- `npm run preview` serves the already-built `dist/` output for a final browser check.
- `python -m pip install -r scripts/requirements-calendar.txt` installs the calendar updater dependency (Python 3.12+).
- `python scripts/update_calendar.py --dry-run` downloads and validates the current Beijing month's wallpaper pair without replacing site files. Supply `--year YYYY --month M` together to select another month.
- `python scripts/update_calendar.py --build` updates the pair and metadata, runs the Astro build, and rolls back on build failure.
- `python -m unittest discover -s scripts/tests -v` runs the calendar updater failure-protection tests.

There is no frontend unit-test or lint command configured. Run the Python tests when changing calendar update logic. Before opening a PR, run `npm run build` and manually check `/`, `/posts/`, `/about/`, and the not-found route (for example, a nonexistent local URL), plus any changed article page. Check Mermaid or MathJax rendering when applicable. For responsive UI work, also check a narrow mobile viewport and confirm the document does not gain horizontal scrolling.

## Calendar Wallpaper Automation

The updater discovers official ZZZ calendar announcements, reads their Minas share link and public password, and validates both PC and mobile originals before replacement. Preserve the fixed paths `src/assets/images/homepage/hero-calendar-desktop.jpg` and `hero-calendar-mobile.jpg`, the source/hash metadata in `src/data/calendar.json`, and the homepage's Astro `Image`/`getImage` optimization and responsive `srcset`. The homepage `alt` derives its month from the metadata.

Keep pair validation, transaction recovery, build-failure rollback and hash-based duplicate detection intact. Temporary downloads, transaction files, run logs and verification screenshots stay out of Git. Maintain operational guidance in the existing AI documents.

`update-calendar.yml` checks on days 1-10 at 02:17 UTC (10:17 Beijing), and supports manual `year`, `month`, `dry_run` and `force` inputs on `main`. It runs the Python tests, installs site dependencies, and updates with `--build` before committing only the two images and metadata. Default `GITHUB_TOKEN` pushes do not trigger the normal push workflow: preserve the explicit dispatch of `deploy.yml`, its `revision` input, and its deployment eligibility for manual runs on `main`.

## Coding Style & Naming Conventions

Use TypeScript and Astro with two-space indentation, semicolons, and single quotes, matching the existing `src/` files. Prefer small, focused components and utilities over duplicating page logic. Use `PascalCase.astro` for components and layouts, lowercase kebab-case names for browser assets, and descriptive lowercase filenames for posts (for example, `2026-07-28-project-guide.md`). When changing a shared file in `public/assets/`, keep its absolute public URL and bump the existing cache-busting version query where appropriate.

Post frontmatter must include `title` and `date`; use optional fields such as `permalink`, `tags`, `categories`, `math`, and `mermaid` only as defined by the collection schema. Keep `permalink` paths under `/posts/.../` and use HTTPS for `redirect_to` links.

Do not put assistant skill packages or other tool metadata beneath `src/content/posts/`: every Markdown file there is eligible to enter the post collection.

## Runtime and Accessibility

`BaseLayout.astro` keeps optional browser work scoped to the pages that use it. Its `guestbook`, `particleField`, and `busuanzi` props default to `false`; a page must explicitly enable the feature it needs. Keep the global theme initialization and theme-toggle script available to every page.

The guestbook panel is rendered after the page slot and is `inert` while closed. Preserve that behavior (including focus moving to the close button when opened and returning to the trigger when closed) so invisible controls never appear in sequential keyboard navigation. Shared mobile navigation must keep `aria-expanded`, its accessible label, and Escape-to-close behavior in sync with the visible menu state.

## Commit & Pull Request Guidelines

Recent history uses concise, imperative messages, commonly with prefixes such as `feat:`, `fix:`, `refactor:`, and `chore:`. Follow that pattern; Chinese descriptions are acceptable when they are equally clear. Keep commits narrow and avoid bundling content edits with unrelated refactors.

PRs should explain the user-visible change, link related issues when available, list verification performed, and include screenshots for visual changes. The deployment workflow builds every PR; pushes and manual deployment runs on `main` publish the site. PR runs only build.

## Security & Configuration

Do not commit secrets or build artifacts (`dist/`, `node_modules/`, `.astro/`). Treat post content and Mermaid source as trusted repository content, and avoid adding third-party scripts without documenting their purpose and loading behavior.
