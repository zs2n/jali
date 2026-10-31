# JALI Redesign Progress

## Session 1 — Design System ✅ Complete
- **Changed:** `index.html` — first inline `<style>` block only (the site's global stylesheet; no external CSS exists). No markup/JS changes.
- **Tokens:** dark palette (`--jali-night #071A14`, `--jali-deep #0C241B`, `--jali-forest #102D23`, `--emerald #0D8B65`, `--gold-champagne #D4B77A`, `--ivory #F2EBDD`), light surfaces, semantic tokens (`--primary`, `--border-gold`, `--line-strong`, `--surface-3`), shadows, focus (`--focus-*`), spacing (`--space-1..8`), radii, transitions (zeroed under reduced motion), type scale and font stacks.
- **Decisions:**
  - Dark is now the default; light theme is prepared under `:root[data-theme="light"]` (no toggle yet, nothing sets the attribute).
  - Legacy variable names are kept and remapped. `--green` (used for link/label text) maps to `--emerald-bright #3DBB8F` for AA contrast; `#0D8B65` is `--primary` for fills.
  - Headings stay Noto Kufi Arabic; Saudi Font not used because its files and licence weren't verified.
  - `#court` keeps its own scoped palette and is unaffected.
- **Verified:** CSS braces balanced; Playwright at 390px — dark and light computed colors correct, no JS errors, no horizontal overflow, court vars unchanged.
- **Not yet themed:** `about.html`, `privacy.html`, `offline.html` have their own inline styles.

## Session 2 — Navigation & Hero ✅ Complete
- **Changed:** `index.html` — hero markup (headline, new `.hero-sub` line, primary CTA label) and the header/hero CSS. Header markup and JS were not modified.
- **Content:** H1 «لا تترك حقك مجهولًا.», sub «افهم حقوقك في العمل، واعرف موقفك النظامي، وخطوتك القادمة.», CTAs «ابدأ بمعرفة حقك» → `#guide`, «احسب مستحقاتك» → `#calc`. The عامي/قانوني lead toggle, the bench and all IDs are unchanged.
- **Header:** glass emerald bar with gold hairline, emerald brand mark, gold underline on hover/focus. Mobile (≤820px) nav, previously hidden, is now a horizontally scrollable pill row; brand row ≥60px so the floating `.level` toggle doesn't overlap.
- **Hero:** emerald/gold radial glow, gold-outlined eyebrow pill, emerald accent word + gold dot. Hero-scoped CTA styling (`.hero .cta …`) so other buttons are unaffected; AA-contrast primary (#0A7354→#085E45 with ivory text); full-width CTAs ≤480px.
- **Verified (Playwright 360/768/1280):** no horizontal overflow, RTL, all 8 nav + 2 CTA targets exist, primary CTA navigates to `#guide`, no `.level`/nav overlap, no JS errors (only sandbox-blocked font/analytics requests). Dark + light screenshots inspected.

## Session 3 — Homepage Sections ✅ Complete
- **Changed:** `index.html` — one scoped CSS block (all selectors under `#top`, so the `#court` overlay and `#promoArt` pixel art are untouched) + `.step-links` added to the three «كيف يعمل» cards linking to existing anchors (`#topic`, `#guide`, `#calc`, `#help`). No other text changed; section order kept.
- **Styling:** consistent section rhythm with hairline dividers and gold-dash eyebrows; shared card look (radius-lg, soft gradient, gold border on hover) for steps, FAQ, where-to-go, topics and trust; FAQ open state + circular toggle; topic article header tint, gold-ruled example, striped tables; highlighted «متاح» topic; numbered student path; emerald/gold court promo.
- **Not touched:** guide, calculator, quiz internals (Session 4).
- **Verified (Playwright 360/1280):** all 11 `main` sections present in order; every in-page anchor resolves; no horizontal overflow or elements wider than the viewport; no JS errors; with JS disabled the `main` text is identical to the previous commit apart from the new links. Screenshots of how/help/students inspected.

## Next: Session 4 (awaiting prompt)
