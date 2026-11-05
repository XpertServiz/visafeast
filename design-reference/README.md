# Design reference (approved prototype)

These files are the approved visual prototype, exported from Claude's design canvas. They show layout, colours, fonts, copy, section order and interactions.

| File | What it shows |
|---|---|
| `homepage-final.dc.html` | FINAL homepage: Option A "Night Flight" (3D globe + passport stamps) with Option C features — matches brief §6.1 |
| `country-page-uk.dc.html` | Country page template (UK visit visa) — brief §6.2 |
| `admin-prototype.dc.html` | Early admin prototype (dashboard, leads, reviews, news & digest, country pages, Appearance · fonts). The final admin structure is brief §9.0 / §9A (Today · People · Cases · Money · Website · Settings) — follow the brief where they differ |

Notes for Claude Code:
- They use a canvas-specific format (`<x-dc>`, `{{holes}}`, `<sc-for>`, `<sc-if>`, a `DCLogic` class). Read them for markup, inline styles, copy and behaviour, then **rebuild as Next.js components**. Don't try to run them.
- The globe animation code inside `homepage-final.dc.html` (`startGlobe`) is the same as brief Appendix A — use it for the 2D fallback.
- Images in the prototype point to `/_blob/...` files that only exist on the design canvas. The drawn people (Open Peeps) only show **where real royalty-free photos go** (brief §4 Imagery). Recreate the colourful icons with the Fluent Emoji Flat set (MIT, `@iconify-json/fluent-emoji-flat`) and flags with `flag-icons` (MIT).
- Everything marked `[admin]`, `[n]`, `[date]` or "demo" is a placeholder, not real data.
