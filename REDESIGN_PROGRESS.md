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

## Next: Session 2 (awaiting prompt)
