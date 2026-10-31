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

## Next: Session 3 (awaiting prompt)
