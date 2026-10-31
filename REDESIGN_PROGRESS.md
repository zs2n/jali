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

## Session 4 — Interactive Components (one per task)
### 4a. Calculator ✅ Complete
- **Changed:** `index.html` — one CSS block scoped to `#calc`. No HTML/JS changes; all JS hooks (`#calcForm`, field IDs, `err-*`, `#total`, `.out .line`, `data-l/n/v`) intact.
- **Styling:** card panels with soft shadow; 48px inputs/selects with gold SVG chevron (RTL, light-theme variant), hover/focus rings; boxed checkbox with checked state; error messages as tinted alert boxes with icon; result panel with emerald glow, gold-ruled total, dashed line items, shaded assumptions box; result panel un-stuck on ≤900px.
- **Verified:** 462 scripted input cases (every contract-end type × contract type × service years 0/1/2/4/5/7/10/25 × months 0/11 × checkbox on/off, plus validation/boundary cases: months 12/−1, empty/negative years, wage 0/empty/1/12345.67, notice −1/60/61, remaining empty/0). Total, line items, notes, error messages and visible fields are byte-identical before and after. No JS errors, no overflow at 360/1280, all controls ≥44px tall, keyboard focus visible. Dark, light and error-state screenshots inspected.
- **Not pushed** (awaiting approval).

### Remaining: 4b guide, 4c وين أروح, 4d quiz (not yet authorized)

## Session 5 — Mock Courtroom ✅ Complete
- **Changed:** `index.html` — CSS appended to the courtroom's own `<style>` block only (`#court`, `#court-promo`). Scripts and all markup outside `<style>` are byte-identical to the previous commit.
- **Entry point:** pixel-style raised «ادخل قاعة المحكمة» button (black drop shadow, gold inset) bridging site and game; gold-framed `#promoArt`; art shown first and full-width button on mobile.
- **Overlay:** warm stage-light vignette, stepped pixel-style fade-in (off under reduced motion), sticky HUD with pixel border on desktop; on ≤600px a compact static HUD (trust row + 3 equal buttons), 44px+ buttons, 48px choices, tighter padding. Game palette, fonts, canvases and `image-rendering:pixelated` untouched.
- **Verified:** scripted playthrough of case 1 (case list → dialogue → cross-examination → evidence modal → choices → «كسبت القضية») at 360 and 1280 with no JS errors; Escape closes and focus returns to `#playCourt`; no overflow; all mobile buttons ≥44px; all 5 canvases still pixelated. Run-to-run comparison of the step sequence wasn't usable (the old version varies too, from bot/animation timing), so logic preservation is shown by identical scripts instead. Screenshots inspected. Evidence sheet opens scrolled on mobile, as before (existing behavior).
- **Not pushed** (awaiting approval).

## Session 6 — Secondary Pages
### 6a. about.html ✅ Complete
- **Changed:** `about.html` only — its own inline `<style>` replaced with Emerald Luxury tokens (same values as index; dark default, light under `[data-theme="light"]`), plus the same Google Fonts link the homepage uses. No body markup, text or link changes. (Each page has its own inline styles; there is no shared stylesheet.)
- **Styling:** full-width sticky top bar (box-shadow bleed, no overflow) with pill back link; display-font headings with gold dash; gold-pill meta; gradient cards with emerald-tinted lead card; feature grid with hover; dashed phase list with emerald «متاح» tag; emerald/gold CTAs (full-width on mobile); centered footer credit with divider.
- **Verified:** rendered text and every href/src identical to the original; RTL; no horizontal overflow at 360/1280; icon loads; back link resolves to `/jali/`; no JS errors. Dark (360, 1280) and light screenshots inspected.
- **Not pushed** (awaiting approval).

### Next: 6b. privacy.html (awaiting approval)
