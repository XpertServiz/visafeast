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
   `supabase/migrations/0001_core.sql`, `0002_backoffice.sql`, `0003_ledger_functions.sql`, `0004_rls.sql`, then `supabase/seed.sql`.
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
| Pexels | Photo search | `PEXELS_API_KEY` |
| Gemini or Anthropic key | Chatbot, decoder AI mode, weekly digest. **Optional** — everything works without | `LLM_PROVIDER`, key |

Also set `CRON_SECRET` and `DAILY_SALT_SECRET` to any long random text.

## 4. Put it online (Vercel)

1. Push this folder to a **GitHub** repository (github.com → New repository → follow "push an existing repository").
2. vercel.com → **Add New → Project** → import the repository → add every variable from `.env.local` under **Environment Variables** → **Deploy**.
3. **Settings → Domains** → add `visafeast.com` and `www.visafeast.com`; change DNS at your registrar to what Vercel shows. Set `NEXT_PUBLIC_SITE_URL=https://www.visafeast.com`.
4. The two daily/weekly jobs in `vercel.json` register automatically once `CRON_SECRET` is set. In Admin → Website → News press **Fetch news now** once.
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
