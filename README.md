# Visafeast website + admin

Visit, study and immigration consultancy website for Pakistan, with a simple admin panel and automatic accounting.
The full specification is `VISAFEAST_MASTER_BRIEF.md`; working rules for Claude Code are in `CLAUDE.md`.

## 1. See the website on your computer (no accounts needed)

1. Install **Node.js 22 or newer** from nodejs.org if you have not.
2. Open a terminal in this folder and run:
   ```
   npm install
   npm run dev
   ```
3. Open **http://localhost:3000** (English) and **http://localhost:3000/ur** (Urdu).

Without any accounts the site runs on built-in sample data: forms respond but nothing is saved, the admin shows a "not connected" notice.

Other commands: `npm run typecheck` · `npm run lint` · `npm test` · `npm run build`.

## 2. Connect Supabase (database + admin login)  — free

1. Go to supabase.com → **New project**. Choose a region near Pakistan (e.g. Mumbai or Singapore). Save the database password.
2. In the project, open **SQL Editor** → **New query**. Paste, in this order, the contents of each file and press **Run**:
   `supabase/migrations/0001_core.sql`, `0002_backoffice.sql`, `0003_ledger_functions.sql`, `0004_rls.sql`, `0005_recurring_and_media.sql`, then `supabase/seed.sql`.
3. **Project settings → API**: copy the *Project URL*, *anon public* key and *service_role* key.
4. Copy `.env.example` to `.env.local` and paste them into `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. (Never share the service_role key.)
5. **Authentication → Users → Add user** → your email + a strong password (tick "auto confirm").
6. Back in **SQL Editor**, run this once (replace the email) to make yourself the owner:
   ```sql
   insert into profiles (id, full_name, role)
   select id, 'Ather', 'owner' from auth.users where email = 'YOUR@EMAIL.COM';
   ```
7. Restart `npm run dev` and open **http://localhost:3000/admin** → sign in.
8. First-login checklist (Admin → Settings): business details, WhatsApp number, Cal.com link, add your cash/bank/JazzCash accounts, price list, first YouTube video.

## 3. Other free accounts (add when ready — each is optional while testing)

| Service | What for | Where to put the key |
|---|---|---|
| Resend (resend.com) | Email you when an enquiry or review arrives | `RESEND_API_KEY` |
| Cloudflare Turnstile | Stops spam bots on forms. Dashboard → Turnstile → Add site | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| Cal.com | Booking calendar. Create a "15 min" event, put `yourname/15min` in Admin → Settings | (in Admin) |
| Google Analytics | Backup analytics | `NEXT_PUBLIC_GA_ID` |
| Pexels | Photo search in Admin → Website → Photos. pexels.com/api → sign up → copy the key | `PEXELS_API_KEY` |
| Google Search Console API | Shows which Google searches bring visitors. Google Cloud → create a *service account* → download its JSON key → encode it as base64 → paste. Then in Search Console → Settings → Users add the service account's email as a *Restricted* user | `GOOGLE_SEARCH_CONSOLE_CREDENTIALS`, `GSC_SITE_URL` (e.g. `sc-domain:visafeast.com`) |
| IndexNow | Tells Bing about new pages instantly. Invent any 16+ letter/number text | `INDEXNOW_KEY` |
| Gemini or Anthropic key | Chatbot, decoder AI mode, weekly digest. **Optional** — everything works without | `LLM_PROVIDER`, key |

Also set `CRON_SECRET` and `DAILY_SALT_SECRET` to any long random text.

## 4. Put it online (Vercel)

1. Push this folder to a **GitHub** repository (github.com → New repository → follow "push an existing repository").
2. vercel.com → **Add New → Project** → import the repository → add every variable from `.env.local` under **Environment Variables** → **Deploy**.
3. **Settings → Domains** → add `visafeast.com` and `www.visafeast.com`; change DNS at your registrar to what Vercel shows. Set `NEXT_PUBLIC_SITE_URL=https://www.visafeast.com`.
4. The two jobs in `vercel.json` register automatically once `CRON_SECRET` is set: a **daily job at 9am Karachi time** (fetches visa news, adds repeating monthly expenses, pulls Search Console numbers and emails you a morning summary) and a weekly news digest. In Admin → Website → News press **Fetch news now** once.
5. **Google Search Console**: add the domain, verify by DNS, submit `https://www.visafeast.com/sitemap.xml`. Do the same in Bing Webmaster Tools.
6. In the Cal.com event, add a webhook to `https://www.visafeast.com/api/calcom/webhook` with your `CALCOM_WEBHOOK_SECRET`.
7. **Important:** Vercel's free *Hobby* plan is for non-commercial use only. Before you take clients, move to **Pro** (about US$20/month).

## 5. Things only you can fill in (the site never invents these)

- **Fees, processing times and requirements** — Admin → Website → Pages & countries. Only the UK visit visa is pre-filled (checked on GOV.UK, 23 Oct 2026). Everything else shows "Being verified — WhatsApp us" until you enter a confirmed figure with its official link. Facts older than 90 days are hidden automatically.
- **Photos** — every picture slot shows "Photo coming soon" until a royalty-free photo is added in `lib/photos.ts` (see the list in brief §4). Record the licence and photographer.
- **Reviews** — start empty. Real clients submit them; you approve.
- **Urdu text** — drafted from the brief; mark each page *approved* in Admin before it is indexed by Google.
- **Immigration pages** — stay unpublished until you confirm your licensed partners and licence numbers.
- **Legal pages, founder story, Karachi visa-centre details.**

## 6. How the money part works (plain words)

You only fill simple forms — *Receive a payment*, *Add an expense*, *New invoice*. Behind the scenes every action is saved as balanced double-entry records by database functions (`supabase/migrations/0003_ledger_functions.sql`).
Embassy/VFS fees collected for a client are **client money**, never counted as your income. Records can't be edited or deleted — a correction posts a reversal. `npm test` proves the rules.

## 7. Project map

```
config/site.ts        all brand strings, contact details, hours
lib/themes.ts         colour themes (Admin → Appearance)
lib/photos.ts         photo slots + credits
lib/seed.ts           built-in sample data (also generates supabase/seed.sql)
messages/             English + Urdu interface text
app/[locale]/         public site (English at /, Urdu at /ur)
app/api/              forms, tracking, chat, decoder, crons
app/admin/            admin panel
supabase/migrations/  database
```

## 8. Added after the first build

- **Client file tracker** — `/track` (and `/ur/track`). A client types their reference (VF-1001) and the last 4 digits of their phone, and sees only the stage timeline and the next step. Never documents or money. Wrong details always give the same answer, so references cannot be guessed.
- **Invoice and receipt PDFs** — Admin → Money → *PDF* on each invoice, *Receipt PDF* on each payment, and a *WhatsApp* button that opens a ready message. PDFs are **English only** for now (the PDF tool cannot join Urdu letters properly); an Urdu invoice would look broken, so it is not offered.
- **Case board** — Admin → Cases on a computer: drag a card to another column (or use the small drop-down on each card). On a phone you get the simple list.
- **Photos** — Admin → Website → Photos: search free Pexels photos or upload your own. The site converts them to a light format and saves the credit and licence automatically.
- **Urdu draft** — Admin → Website → Pages: *Draft Urdu (AI)* translates the text only (never fees, dates or numbers). It needs an AI key (section 3); you then read it and set *Approved* — only approved Urdu pages are shown to Google.
- **Tests** — `npm test` (money engine, the real database SQL run in an in-memory Postgres, tracker, Urdu rules) and `npm run e2e` (opens the real site in Edge on desktop and a 360px phone).
- **Vercel free plan allows 2 cron jobs**, so everything daily runs in one job (`/api/cron/daily`).

## Languages, country detection and Google

**Languages:** English at `/`, the others at `/ur`, `/ar`, `/de`, `/fr`, `/es`, `/zh`, `/hi`, `/tr`, `/it`, `/pt`, `/nl`, `/pl`. The list and the country-to-language and country-to-currency tables are in `config/locales.ts`.

**How a visit works:** `proxy.ts` reads the visitor's country from Vercel (no IP is stored) and sends a first-time visitor to their language. A visitor's own choice (the `vf_lang` cookie, set by the language buttons) always wins. Search engines are never redirected: they read each language at its own address, listed in `app/sitemap.ts` with hreflang.

**Text:** interface text lives in `messages/<language>.json`; anything missing falls back to English. Guide pages and FAQs from the database are translated automatically into the `content_translations` table by `lib/server/translate.ts`, which runs daily and redoes only what changed. A translation is refused if any number differs from the English. A page without its translation shows English and is kept out of Google until it has one.

**With the GPT key in `.env.local` and on Vercel, finish all translations once:**
1. `node scripts/translate-messages.mjs` fills missing interface text. Commit and deploy.
2. Call `/api/cron/translate` with `Authorization: Bearer <CRON_SECRET>` until it reports `remaining: 0`.

**Currency:** `components/LocalPrice.tsx` adds "≈ €62" after an official fee, in the visitor's currency, using free daily rates through `/api/fx`. The official amount itself never changes.

**Fonts:** each script has its own (`lib/fonts.ts`): Noto Nastaliq for Urdu, Cairo for Arabic, Noto Sans Devanagari for Hindi, the device's Chinese fonts for Chinese, Fraunces and Inter for Latin languages.

**Tests:** `npm test` covers the rules. `BASE=http://localhost:3100 node tests/e2e/lang.live.mjs` checks a running site as visitors from different countries and as Googlebot.
