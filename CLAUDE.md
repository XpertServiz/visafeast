# CLAUDE.md — Visafeast project rules

The full specification is **VISAFEAST_MASTER_BRIEF.md** in this folder. It is the single source of truth. Re-read the relevant section before starting each phase.

## The owner
Ather is the owner and is **not a developer**. Explain things in plain language. When he needs to do something himself (create an account, copy a key, change DNS), give numbered click-by-click steps and wait for him to confirm.

## Working rules
1. Build in the phases of §16. Finish one phase, run the checks, commit to git, then give Ather a short summary (what was built, how to see it, what he needs to do). Wait for his "go" before the next phase.
2. Ask the `[ASK]` questions from §0 once, at the start, in one list. Use the listed placeholders for anything unanswered.
3. **Never invent facts.** Visa fees, processing times, requirements, immigration rules, statistics, reviews and client stories come only from an official source (with URL + date) or from Ather. Unknown values stay `null` and show the §6.4 fallback.
4. **Never create fake reviews or testimonials** — not in seeds, fixtures or demos (§9.6).
5. **The admin must be super simple** (§9.0): six menu items, plain words, phone-first, one main button per screen. If a screen would need a manual, simplify it.
6. **Money is always correct** (§9A.3): every money action posts balanced ledger entries through the database functions; client money (embassy/VFS fees) is never counted as income; never hard-delete money records.
7. Keep running costs near zero (§15.3). No new paid service without asking.
8. Security: RLS on every table, service key only on the server, validate every input, no raw IPs, private storage for client documents.
9. Design: follow the tokens in §4 and the approved prototype files in `design-reference/` (homepage section order is §6.1 FINAL). The `.dc.html` files are visual references only — rebuild them properly in Next.js; do not copy their runtime.
10. **Picture-first public pages** (§4 Imagery): real royalty-free photos of people and places (Pexels/Unsplash/Pixabay, licence + credit recorded), colourful icons and flags, very short text — understandable by visitors who read little English.
11. **SEO and live analytics are core features**, not extras: follow §14.4 and §12 on every page you build.
12. Before saying a phase is done: typecheck, lint, run tests, open the pages and check them on a 360px-wide phone screen and on desktop.

## Stack (summary — details in §2)
Next.js (App Router, TypeScript) · Tailwind · Supabase (Postgres, Auth, Storage) · React Three Fiber (hero) · next-intl (English + Urdu) · Resend · Cloudflare Turnstile · Cal.com embed · Vercel (+ Vercel Cron).
