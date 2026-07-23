# Design QA

- Implementation: `http://127.0.0.1:4173/homepage-prototype/`
- Revision: responsive dynamic calendar with collapsible hero dock.
- State: light theme, top of page, desktop prototype.

## Visual audit

- Hero sources: `assets/images/homepage/hero-calendar-desktop.jpg` (2560 × 1440) and `assets/images/homepage/hero-calendar-mobile.jpg` (1290 × 2796).
- Hero container: matching `2560 / 1232` aspect ratio with `object-fit: contain` and top alignment.
- The prior 11% left offset placed the calendar too close to the visual center at wider desktop sizes.
- The new clamped 7% placement keeps the card over the darker hair area and leaves more breathing room around the character's face.
- The hide control is reduced to a window-style minus symbol inside the calendar's upper-right corner; the date block reserves space for it.

## Current implementation

- Transparent glass calendar is positioned with `left: clamp(48px, 7%, 96px)` and a 30% stage top.
- Calendar dimensions remain responsive between 238 px and 286 px; numerals use tabular sans-serif styling.
- JavaScript derives the first weekday and month length using native date arithmetic, so February and 30/31-day months render correctly.
- Hide/show controls use real button elements, accessible labels, keyboard focus transfer, `aria-expanded`, `aria-hidden`, and `inert`.
- The scale/fade transition is retained. The glass background, border, shadow and content share the same transformed layer, which prevents the blur from loading after the text.
- The expanded/collapsed state persists in local storage.
- Wallpaper Engine image, font, clock, frequency visualizer, petals, audio controls and scripts are absent.
- The independent calendar example remains at `D:\Document\Design\glass-calendar-example\`.

## Browser verification

- Browser: Codex in-app browser.
- Checked expanded layout, collapsed dock layout, hide/show click flow, current July 2026 day count (31), focus transfer, and no new console errors.
- Existing avatar rotation, theme persistence, navigation and repository-backed article content remain intact.

## Cleanup

- Removed `homepage-prototype/assets/wallpaper-3586750479/`: 50 copied/extracted files, 20,838,715 bytes.
- Original Steam Workshop files and `D:\SoftWare\RePKG` were not changed.

final result: passed
