# VISAFEAST — Master Build Brief for Claude Code

> **Project:** Visafeast — visit & study visa consultancy website + admin panel
> **Owner:** Ather (Karachi, Pakistan) · Facebook: https://www.facebook.com/visafeast/ · Email: visafeast@gmail.com
> **Goal:** Build, test and deploy a production website on **Vercel** with Supabase, matching the approved prototype, SEO-first, near-zero running cost.
> **Brief date:** 23 Oct 2026

---

## 0. How to use this brief (instructions to Claude Code)

1. Read this whole file before writing code. Build in the **phases in §16**, committing after each phase.
2. Anything marked **`[ASK]`** must be asked to the owner at the start (one consolidated question list). If the owner is unavailable, use the placeholder shown and keep it editable in Admin → Settings.
3. **Never invent facts.** Visa fees, processing times, document rules, statistics, client names, reviews and testimonials must come from (a) an official source with a URL and a "last checked" date, or (b) the owner via the admin panel. Where a value is unknown, store `null` and render the fallback text defined in §6.4.
4. **Never seed fake reviews or testimonials.** The reviews table starts empty. (See §9.6.)
5. Keep running cost near $0: no paid APIs except one optional LLM provider, used sparingly (§10, §11).
6. Everything the owner might want to change (copy, fees, FAQs, countries, contact numbers, Cal.com link, feeds, YouTube channels) must be editable in the admin panel — no code changes needed after launch.

### `[ASK]` list — ask the owner once, up front
| # | Question | Placeholder if no answer |
|---|---|---|
| 1 | Domain: is `visafeast.com` owned/controlled by you? Registrar/DNS access? | Deploy on `visafeast.vercel.app` first |
| 2 | WhatsApp number to display: +1 647-966-2297 (Canada), a +92 number, or both? | `+16479662297` |
| 3 | Office address or "Online across Pakistan"? NTN/registration to show? Office hours? | "Karachi · consultations online across Pakistan", hours "Mon–Sat 10am–7pm PKT" |
| 4 | Cal.com username + event slugs (free 15-min call; optional paid file review + price) | `visafeast/15min` |
| 5 | Show service fees as exact, "from PKR X", or "contact for quote"? | "Contact for quote" |
| 6 | Logo/brand colours — use the prototype's (below) or provide your own? | Prototype brand (§4) |
| 7 | Real client stories + consent for visa-grant photos (blurred passport numbers)? | Case-study section hidden until 1+ story exists |
| 8 | LLM provider for chatbot/digest: Google Gemini (free tier) or Anthropic Claude Haiku? API key? | Chatbot runs in FAQ-only mode (no AI) until a key is added |
| 9 | Vercel plan: Hobby (free, **non-commercial use only per Vercel terms**) or Pro ($20/mo)? | Build for either; note the Hobby restriction to the owner |
| 10 | YouTube channels to watch (channel URLs) | Empty watchlist; admin can add later |
| 11 | Immigration: which licensed partners (RCIC for Canada, registered migration agent for Australia, etc.) and their licence numbers to display? | Pathway pages say "filed with licensed partners"; pages stay unpublished until confirmed |
| 12 | Who reviews/approves the Urdu translations? | Machine-drafted Urdu marked "draft" in admin; owner approves before publishing |
| 13 | Is Visafeast registered for tax (FBR / Sindh Revenue Board)? Should invoices show a tax line and NTN? | Tax line off; no NTN shown |
| 14 | Bank / cash / JazzCash / Easypaisa accounts to set up, and your price list (service fees in PKR) | Owner adds them in the first-login setup checklist |

---

## 1. Business context (why the site is built this way)

- Visafeast handles **visit visas**: UK, Canada, USA, Australia, New Zealand, Schengen/Europe, Azerbaijan, Thailand, Singapore (+ others on request).
- **Study visas**: Germany, UK, Canada, USA, Australia, Italy, Greece, other Europe.
- **Immigration pathways** (added 23 Oct 2026): Canada, Australia, UK, USA, Germany, New Zealand, other Europe — see §6.8. Where the law requires a licensed representative (e.g. RCIC for Canada, registered migration agent for Australia), cases are filed through licensed partners `[ASK #11]`.
- **Bilingual:** the whole public site is available in **English and Urdu** (§14.3).
- Audience: Pakistani families, travellers, students and parents (Karachi, Lahore, Islamabad + all Pakistan; secondary: Pakistanis resident in the UAE).
- Main traffic source must be **Google search** (Facebook page reach is currently very low). The site is built around **one page per country per visa type**, which is how every competitor ranking on Google page 1 in Pakistan is structured.
- Differentiators vs competitors (Apricot Tours, EasyVisa.pk, AINiT, Times Consultant, HS Consultants, trips.pk):
  1. Fees and processing times shown with a **"last checked" date** and source link.
  2. A real **eligibility checker** (competitors' "Check eligibility" is just a contact form).
  3. **Daily visa news radar + weekly digest** from official sources (competitors' news sections are stale).
  4. **AI assistant** grounded on the site's own content, with WhatsApp hand-off.
  5. Modern design with a **3D hero** (no competitor has one).
  6. Honesty signals: "not an embassy" disclaimer, "no fake documents" policy, no visa guarantees.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (latest stable), App Router, TypeScript** | Server Components by default; ISR for content pages |
| Styling | **Tailwind CSS** (latest) + CSS variables for tokens (§4) | No UI kit required; shadcn/ui allowed for admin |
| 3D | **three + @react-three/fiber + @react-three/drei** | Hero only, lazy-loaded (§7) |
| Animation | framer-motion (stamps, small transitions) | Respect `prefers-reduced-motion` |
| DB / Auth / Storage | **Supabase** (Postgres, Auth, Storage) free tier | RLS on every table |
| Email | **Resend** free tier | Lead + review notifications to owner |
| Booking | **Cal.com** embed (`@calcom/embed-react`) | Optional Cal.com webhook → leads |
| Bot protection | **Cloudflare Turnstile** (free) | On all public forms |
| RSS parsing | `rss-parser` or `fast-xml-parser` | Atom + RSS |
| PDF | `@react-pdf/renderer` | Document checklist PDFs |
| LLM (optional) | Provider abstraction: Gemini Flash **or** Claude Haiku (`claude-haiku-5-5`) | Env-switchable; FAQ-only fallback |
| Analytics | Built-in first-party tracker (§12) + GA4 + Google Search Console | Vercel geo headers for country/city |
| Hosting | **Vercel** + Vercel Cron | See §15 |
| Package manager | pnpm | |

---

## 3. Information architecture & routes

```
/                                   Homepage (landing page, §6.1)
/visit-visa                         Visit-visa hub (grid of countries)
/visit-visa/[slug]                  Country visit-visa page (template §6.2)
/study-visa                         Study-visa hub
/study-visa/[slug]                  Country study-visa page (template §6.3)
/immigration                        Immigration hub (country cards + pathway chips)
/immigration/[slug]                 Pathway page (template §6.8), e.g. canada-express-entry-from-pakistan
/tools/refusal-decoder              Refusal letter decoder (also embedded on homepage, §8.4)
/ur/...                             Urdu version of every public route (§14.3)
/news                               Visa News Radar (daily items) + digests list
/news/[slug]                        Weekly digest post / guide / blog post
/tools/eligibility                  Eligibility checker (also embedded on homepage)
/tools/fee-estimator                Fee estimator (PKR)
/tools/checklists                   Index of downloadable checklists
/reviews                            Approved reviews + "Write a review" form
/reviews/write                      Review form (direct link used in WhatsApp requests)
/about                              Founder profile, approach, policies
/contact                            Enquiry form, WhatsApp, Facebook, map/hours
/book                               Cal.com booking
/visa-consultant-karachi            City landing page (only Karachi at launch)
/privacy  /terms  /disclaimer       Legal
/sitemap.xml  /robots.txt           Generated
/admin/*                            Admin panel (auth-protected, §9)
/api/*                              Route handlers (§13)
```

### Launch slugs (seed rows in `countries` table)
**Visit:** `uk-visit-visa-from-pakistan`, `canada-visit-visa-from-pakistan`, `usa-visit-visa-from-pakistan`, `australia-visit-visa-from-pakistan`, `new-zealand-visit-visa-from-pakistan`, `schengen-visa-from-pakistan`, `azerbaijan-visa-for-pakistani`, `thailand-visa-from-pakistan`, `singapore-visa-from-pakistan`
**Study:** `study-in-germany-from-pakistan`, `study-in-uk-from-pakistan`, `study-in-canada-from-pakistan`, `study-in-usa-from-pakistan`, `study-in-australia-from-pakistan`, `study-in-italy-from-pakistan`, `study-in-greece-from-pakistan`, `study-in-europe-from-pakistan`

Lahore and Islamabad city pages: **do not create at launch.** Create only when the owner provides real local content (Google treats copy-paste city pages as doorway pages).

---

## 4. Design system (from the approved prototype)

**Look name:** "Night flight & passport ink" — navy night-sky hero, amber accents, cream paper sections, boarding-pass cards, ink-stamp badges, monospace route codes.

### Colour tokens
| Token | Hex | Use |
|---|---|---|
| `--navy` | `#0A1A33` | Hero, footer, dark cards, primary dark buttons |
| `--navy-2` | `#102849` | Inputs on dark |
| `--navy-hover` | `#163463` | Dark button hover |
| `--amber` | `#F2A93B` | Primary CTA background, accents on navy |
| `--amber-hover` | `#FFC061` | |
| `--amber-text` | `#8A5300` | Amber-ish text/links on light backgrounds (passes 4.5:1) |
| `--paper` | `#F7F4EE` | Page background |
| `--passport` | `#F3EBDA` | Passport page in hero |
| `--line` | `#E4DED3` | Borders, dividers |
| `--ink` | `#0F172A` | Body text |
| `--muted` | `#475569` | Secondary text |
| `--muted-2` | `#5B6474` | Captions/mono labels |
| `--on-navy` | `#C9D3E2` | Body text on navy |
| `--on-navy-2` | `#9FB0C8` | Captions on navy |
| `--ok` | `#2F6B3A` | Success / approved stamp |
| `--bad` | `#8C1F2C` | Problem / refusal |
| `--stamp-blue` | `#1F4E8C` | Stamp ink |
| `--stamp-purple` | `#6B3FA0` | Stamp ink |
| `--whatsapp` | `#25D366` (text on it `#06371B`) | WhatsApp buttons only |

### Typography (Google Fonts via `next/font`) — DEFAULTS + admin-selectable
- Display (headings) default: **Fraunces** 500/600/700 (optical size axis), letter-spacing −0.01em to −0.015em.
- Body default: **Inter** 400/500/600.
- Mono (fixed): **IBM Plex Mono** 500/600 — route codes "KHI → LHR", eyebrows, dates, stamps.
- Urdu default: **Noto Nastaliq Urdu** 500/700 — `dir="rtl"`, line-height ≥ 1.9 (Nastaliq needs extra height), no letter-spacing.
- **Admin → Appearance (§9.10)** lets the owner switch fonts from curated lists only:
  - Heading: Fraunces · Sora · Playfair Display · DM Serif Display · Plus Jakarta Sans · Poppins
  - Body: Inter · Manrope · DM Sans · Plus Jakarta Sans · Poppins
  - Urdu: Noto Nastaliq Urdu · Noto Naskh Arabic · Gulzar
- Implementation: declare every curated font with `next/font/google` (`variable` mode, `display: 'swap'`); the root layout reads `settings.heading_font/body_font/urdu_font` server-side and sets `--font-display`, `--font-body`, `--font-urdu` on `<html>` (no flash of wrong font). Browsers only download the font files a page actually uses. Saving in Appearance revalidates all pages.
- Scale: H1 60px (mobile 40), H2 40px (mobile 30), H3 19–22px, body 16–17px, eyebrow 13px mono uppercase tracking .12em.

### Components / motifs
- **Boarding-pass card** (destination cards): `FROM ---✈--- TO` mono row, country (display font, 19–23px), visa name, dashed perforation line with half-circle notches, footer row "NOTE · Guide →". Hover lift 3px.
- **Ink stamp badge**: mono uppercase, 2.5px border in stamp colour, slight rotation (−4°…+9°), opacity .9; used for "VISA GRANTED", "RECEIVED", eligibility result, review status.
- **Pill buttons** (radius 999px, min-height 44–52px). Primary = amber on navy text. Ghost = white outline on navy. Dark = navy.
- Cards: white, 1px `--line` border, radius 14–20px, no heavy shadows (one soft shadow allowed on quick-facts card).
- Icons: inline stroke SVG (lucide-react is fine). **No emoji in UI.**
- Floating bottom-right: chat button (navy circle, amber icon) + WhatsApp button (green circle with pulse).
- Accessibility: WCAG AA contrast, real buttons/links/labels, focus rings, `aria-expanded` on accordions, `role="tablist"` for tabs, keyboard operable everything, touch targets ≥ 44px.


### Imagery — real royalty-free photos (REQUIRED)
The site must look **real and lively**, not text-heavy. Use real photographs of people and places from royalty-free libraries:
- **Sources (free for commercial use):** [Pexels](https://www.pexels.com/license/), [Unsplash](https://unsplash.com/license), [Pixabay](https://pixabay.com/service/license-summary/). Before using any photo, open its page and confirm the licence; keep the source URL, photographer and licence in the `media` table (§5 additions) and in `/about` → Image credits (credit photographers even when not required).
- **Pexels API (free key)** powers an in-admin photo search (Admin → Website → Media → "Find a photo"): search, preview, pick → the server downloads the original, converts to WebP/AVIF, stores it in Supabase Storage (`media` bucket) and records the credit. Never hot-link to the stock site.
- **People:** prefer South Asian / Pakistani-looking people and families, women with and without hijab, students, older parents, a consultant at a desk. Never present a stock photo as a real client, review or case study, and never put stock faces next to testimonials.
- **Places:** recognisable landmarks per destination (e.g. London Tower Bridge / Big Ben, Toronto skyline, New York, Sydney Opera House, Auckland / Milford Sound, Paris / Rome / Athens, Baku Flame Towers, Bangkok temples, Singapore Marina Bay, German university towns).
- **Image map (search terms to start from; owner can swap any image in Admin → Media):**
| Where | Image | Example search terms |
|---|---|---|
| Hero (behind/next to the globe on mobile, where the 3D globe is replaced) | Happy traveller at airport | "south asian family airport", "pakistani traveler airport passport" |
| 3 easy steps | Phone call · documents on table · aeroplane window | "woman phone call smiling", "documents passport desk", "airplane window view" |
| Eligibility check | Person thinking with phone | "young man thinking phone" |
| Refusal decoder | Worried person reading a letter | "worried man reading letter", "sad woman document" |
| Why visas get refused (3 cards) | Bank statement worry · confused with papers · sad after refusal | "stressed bank statement", "confused paperwork", "disappointed man sitting" |
| Mid-page CTA | Friendly consultant | "consultant office smiling headset", "south asian businessman desk" |
| Destination cards & country pages | Landmark photo of the country + flag | "tower bridge london", "toronto skyline", "sydney opera house", "baku flame towers" … |
| Study pages | Students on campus | "international students campus", "graduation south asian" |
| Immigration pages | Family with luggage / new home | "family moving abroad", "family suitcases airport" |
| Reviews section | **No stock faces** — use the client's own photo only if they uploaded it with consent; otherwise initials avatar | — |
| Why Visafeast | Handshake / consultant with client | "handshake office", "advisor client meeting" |
- **Technical:** `next/image` everywhere, AVIF/WebP, responsive `sizes`, lazy-load below the fold, hero image `priority`, max 200 KB per image (hero ≤ 250 KB), descriptive keyword-rich `alt` text (e.g. "Pakistani family at Karachi airport with passports — UK visit visa"), meaningful file names (`uk-visit-visa-from-pakistan-tower-bridge.webp`).
- The prototype uses drawn characters (Open Peeps, CC0), Fluent Emoji (MIT) and flag SVGs (MIT) only to **show where pictures go**. In production: keep the colourful icons (Fluent Emoji Flat, MIT) and flags (`flag-icons`, MIT) for buttons, steps and cards; use **real photos** for people and places.

- **Missing-photo placeholder (never a broken layout):** every photo slot is rendered by one `<Photo slot="..."/>` component that shows the stored `media` image, and if none exists yet shows a neutral placeholder block (paper colour, subtle diagonal pattern, text "Photo coming soon") with fixed aspect ratio so there is no layout shift. The owner (or Pexels search in admin) fills slots later; do not leave the site with empty boxes at launch (§4 Imagery photo plan must be filled before go-live).
- **One config file:** all brand strings, contact details, social links and opening hours come from `/config/site.ts` (seeded from `settings`), never hard-coded in components.

### Picture-first, easy-to-understand rules (for all public pages)
Many visitors read little English. Every section must be understandable from pictures and a few words:
- Each section = **one picture or icon + a heading of ≤ 7 words + at most one line of ≤ 12 words.** Longer explanations go on the country pages, behind "Read more", or in FAQs.
- Every button has an icon (calendar, envelope, WhatsApp, magnifier) and a verb ("Book a free call", "Check my chances").
- Use numbers and steps ("3 easy steps"), ticks ✓ and crosses ✗, flags for countries — not paragraphs.
- Big tap targets, large text (body ≥ 17 px on mobile), high contrast.
- Everything available in Urdu with the EN / اردو switch; the Urdu version uses the same pictures.
- Short videos (the owner's YouTube videos) appear high on the page because many visitors prefer watching to reading.

---

## 5. Data model (Supabase SQL)

Create as migrations in `supabase/migrations/`. Enable RLS on all tables. Public reads only of published rows; **all public writes go through Next.js route handlers using the service-role key** (validated with zod + Turnstile + rate limit). Admin users identified by `profiles.role = 'admin'`.

```sql
-- profiles (admin users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('admin','viewer')),
  created_at timestamptz default now()
);

-- site-wide settings (single row, id = 1)
create table settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text not null default '+16479662297',
  whatsapp_number_pk text,
  email text default 'visafeast@gmail.com',
  facebook_url text default 'https://www.facebook.com/visafeast/',
  address_line text default 'Karachi · consultations online across Pakistan',
  office_hours text default 'Mon–Sat 10am–7pm PKT',
  ntn text,
  calcom_link text default 'visafeast/15min',
  service_fee_mode text default 'quote' check (service_fee_mode in ('exact','from','quote')),
  digest_auto_publish boolean default false,
  chatbot_enabled boolean default true,
  llm_provider text default 'none' check (llm_provider in ('none','gemini','anthropic')),
  google_reviews_url text,
  youtube_channel_url text,
  theme text default 'night_flight' check (theme in ('night_flight','passport','window','gate','custom')),
  accent_color text default '#F2A93B',
  splash_style text default 'plane_stamp' check (splash_style in ('plane_stamp','globe_spin','passport_open','boarding_pass','logo_fade','off')),
  splash_duration_ms int default 2200,
  splash_once_per_session boolean default true,
  splash_custom_logo_media_id uuid,
  hero_globe_style text default 'realistic' check (hero_globe_style in ('realistic','dotted')),
  heading_font text default 'Fraunces',
  body_font text default 'Inter',
  urdu_font text default 'Noto Nastaliq Urdu',
  updated_at timestamptz default now()
);

-- countries = one row per visa page (visit or study)
create table countries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  kind text not null check (kind in ('visit','study','immigration')),
  pathways jsonb default '[]',             -- immigration hub chips: [{name, slug}] (kind='immigration' country cards)
  licensed_partner text,                   -- immigration: partner name + licence no. shown on page [ASK #11]
  content_ur jsonb,                        -- Urdu versions of all text fields (§14.3); null = fall back to English with notice
  ur_status text default 'none' check (ur_status in ('none','draft','approved')),
  country_name text not null,              -- 'United Kingdom'
  country_code text,                       -- 'GB' (for news tagging)
  from_code text default 'KHI',            -- boarding-pass codes
  to_code text,                            -- 'LHR'
  visa_name text,                          -- 'Standard Visitor visa'
  card_note text,                          -- 'TOURISM · FAMILY'
  h1 text not null,
  meta_title text not null,
  meta_description text not null,
  intro text,
  -- quick facts (nullable = unknown -> fallback text)
  embassy_fee_text text,                   -- '£135 (6 months)'
  embassy_fee_pkr int,
  vfs_fee_text text,
  service_fee_pkr int,
  processing_time_text text,               -- 'Usually within 3 weeks'
  max_stay_text text,
  apply_window_text text,
  biometrics_text text,
  facts_source_url text,
  facts_last_checked date,
  -- rich sections (markdown) — see §6.2
  who_for_md text,
  documents jsonb default '[]',            -- [{title, detail}]
  funds_md text,
  steps jsonb default '[]',                -- [{title, detail}]
  refusal_reasons jsonb default '[]',      -- [{title, detail}]
  extra_sections jsonb default '[]',       -- [{heading, md}] e.g. blocked account, scholarships
  related_slugs text[] default '{}',
  keywords text[] default '{}',            -- for news tagging + SEO notes
  is_published boolean default false,
  sort_order int default 100,
  updated_at timestamptz default now()
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references countries on delete cascade,  -- null = homepage/general FAQ
  question text not null,
  answer_md text not null,
  sort_order int default 100,
  is_published boolean default true
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text, phone text, email text, city text,
  destination text, visa_type text, travel_date date,
  prior_refusal text,                      -- 'no' | 'once' | 'more'
  message text,
  source text not null,                    -- 'enquiry','chatbot','checklist','eligibility','calcom','review_request'
  page_path text,
  utm jsonb,
  eligibility jsonb,                       -- answers + score if from checker
  status text default 'new' check (status in ('new','contacted','docs_received','submitted','approved','refused','closed')),
  notes text,
  assigned_to uuid references profiles
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  city text,
  visa_type text,
  rating int not null check (rating between 1 and 5),
  body text not null,
  photo_path text,                          -- optional, Supabase Storage
  consent boolean not null default false,   -- "I agree this can be published"
  submitted_via text default 'website' check (submitted_via in ('website','whatsapp')),
  status text default 'pending' check (status in ('pending','approved','rejected')),
  approved_at timestamptz,
  ip_hash text
);

create table case_studies (
  id uuid primary key default gen_random_uuid(),
  title text not null, profile text, destination text, visa_type text,
  challenge text, what_we_did text, outcome text,
  badge text default 'VISA GRANTED',
  photo_path text, client_consent boolean not null default false,
  is_published boolean default false, sort_order int default 100
);

create table news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  kind text not null check (kind in ('official_rss','google_news_rss','youtube_channel')),
  country_codes text[] default '{}',
  is_official boolean default true,
  is_active boolean default true,
  last_fetched_at timestamptz,
  last_status text
);

create table news_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references news_sources on delete set null,
  title text not null,
  url text not null unique,
  published_at timestamptz,
  summary text,                             -- source excerpt, max ~300 chars (do NOT republish full text)
  country_codes text[] default '{}',
  topics text[] default '{}',               -- 'visit','study','fees','processing','policy'
  is_relevant boolean default true,
  what_it_means text,                       -- optional 1-line, admin- or digest-written
  created_at timestamptz default now()
);

create table youtube_videos (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references news_sources on delete cascade,
  video_id text unique not null,
  title text, description text, published_at timestamptz,
  claim text,                               -- extracted claim (LLM in weekly batch, or admin)
  verification text default 'unchecked' check (verification in ('unchecked','confirmed','unconfirmed','rejected')),
  official_url text,                        -- the official source that confirms it
  checked_at timestamptz
);

create table posts (                        -- weekly digests, guides, blog
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  type text not null check (type in ('digest','guide','blog')),
  title text not null,
  excerpt text,
  body_md text not null,
  sources jsonb default '[]',               -- [{title,url}]
  country_codes text[] default '{}',
  status text default 'draft' check (status in ('draft','published','archived')),
  generated_by text,                        -- 'llm:gemini' | 'llm:anthropic' | 'human'
  published_at timestamptz,
  created_at timestamptz default now(),
  meta_title text, meta_description text
);

create table page_views (
  id bigserial primary key,
  ts timestamptz default now(),
  path text not null,
  referrer_host text,
  utm_source text, utm_medium text, utm_campaign text,
  country text, region text, city text,     -- from Vercel geo headers
  device text,                              -- 'mobile' | 'desktop' | 'tablet'
  visitor_hash text,                        -- sha256(daily_salt + ip + ua) — no raw IP stored
  session_id text
);
create index on page_views (ts);
create index on page_views (path);

create table events (
  id bigserial primary key,
  ts timestamptz default now(),
  name text not null,                       -- 'whatsapp_click','cta_click','chat_open','checklist_download','booking_click','eligibility_complete'
  path text, meta jsonb, visitor_hash text, country text
);

create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  visitor_hash text, page_path text, lead_id uuid references leads,
  message_count int default 0
);
create table chat_messages (
  id bigserial primary key,
  session_id uuid references chat_sessions on delete cascade,
  role text check (role in ('user','assistant')),
  content text, used_llm boolean default false,
  ts timestamptz default now()
);

create table hero_videos (                  -- owner's own YouTube videos for the hero strip/slider (§6.7, §9.9)
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null,                -- as pasted by admin
  video_id text not null,                   -- parsed 11-char ID
  title text,                               -- fetched via YouTube oEmbed (free, no key) or typed by admin
  caption text,
  is_short boolean default false,           -- 9:16 when true (auto-set from /shorts/ URLs)
  is_active boolean default true,
  sort_order int not null default 100,
  show_on_country_slug text,                -- optional, phase 2
  created_at timestamptz default now()
);

create table rate_limits (                  -- simple fixed-window limiter
  key text primary key, window_start timestamptz, count int
);
```


```sql
-- added: media library, richer analytics, SEO
create table media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null, width int, height int, alt_en text, alt_ur text,
  source text check (source in ('pexels','unsplash','pixabay','owner','other')),
  source_url text, photographer text, licence text, used_on text[], created_at timestamptz default now()
);
alter table page_views
  add column browser text, add column os text, add column screen text,
  add column browser_language text,           -- navigator.language, e.g. 'ur-PK', 'en-GB'
  add column accept_language text,            -- primary Accept-Language header value
  add column site_locale text,                -- 'en' | 'ur' (which version they viewed)
  add column is_new_visitor boolean, add column landing boolean default false,
  add column duration_ms int;                 -- filled by a final beacon on page hide
create table live_presence (                  -- heartbeat rows, kept 10 minutes
  session_id text primary key, visitor_hash text, path text, country text, city text,
  device text, browser_language text, site_locale text, referrer_host text, last_seen timestamptz default now()
);
alter table leads add column nationality text;        -- self-declared: "Your passport country"
alter table leads add column residence_country text;  -- self-declared: "Where do you live now?"
create table seo_pages (
  path text primary key, locale text default 'en', title text, meta_description text, h1 text,
  focus_keyword text, word_count int, internal_links int, images_missing_alt int,
  score int, issues jsonb, checked_at timestamptz
);
create table search_console_daily (           -- pulled from the free Search Console API
  day date, page text, query text, country text, device text,
  clicks int, impressions int, ctr numeric, position numeric,
  primary key (day, page, query, country, device)
);
```

Storage buckets: `review-photos` (private, admin approves), `case-studies` (public), `checklists` (generated PDFs cache, public).

Views/RPCs for admin analytics: daily visitors (distinct `visitor_hash` per day), by country, by city, top pages, referrers, devices, conversion (leads ÷ unique visitors), WhatsApp clicks per page.

---

## 6. Public pages — content & behaviour

### 6.1 Homepage — FINAL section order (approved by owner 23 Oct 2026 — this supersedes §6.1-old below)
**Picture-first:** follow the §4 "Imagery" and "Picture-first" rules for every section below — real photos, icons, flags, very short text (the prototype's drawn characters only mark where real photos go).
Base design = prototype **"Option A — Night Flight"** (navy/amber, 3D globe + passport stamps) with features taken from **Option C** (fonts, video slider, refusal decoder, visa-page cards, EN/اردو switch). Build in exactly this order:

1. **Nav:** logo · links (Visas & immigration · Eligibility check · Refusal decoder · Visa news · Reviews) · **EN / اردو toggle** · "Book a free call" amber pill.
2. **Hero** (§7 globe + passport stamps):
   - Eyebrow: `VISIT, STUDY & IMMIGRATION CONSULTANTS · KARACHI · SERVING ALL PAKISTAN`
   - H1: **"Your visa, prepared right the first time."**
   - Sub: "Visit visas, study visas and immigration pathways for the UK, Canada, USA, Australia, New Zealand, Europe and Asia — with fees and timelines published openly."
   - Buttons: **Check my eligibility — free** (amber → #eligibility) · **Book a free call** (ghost, calendar icon → #book) · **WhatsApp** (green). Text link under them: "Prefer to write? Send an enquiry →" (→ #book).
   - Trust ticks: "Fees shown with a 'last checked' date" · "One consultant, start to decision" · "Updates on WhatsApp". Then the "WE HANDLE" strip (Visit visas · Study visas · Immigration pathways · UK · Canada · USA · Australia · New Zealand · Europe · Asia).
   - Urdu copy: Appendix D2.
2b. **"Your visa in 3 easy steps"** — three big picture cards: 1 Talk to us (phone) · 2 We prepare your file (documents) · 3 You fly (aeroplane). Two to five words each.
3. **Videos slider** (§6.7) — its own section **directly below the hero** (this replaces the "inside the hero" placement described in §6.7; all other §6.7 rules apply).
4. **Free · 60 seconds eligibility checker** (§8.1) — moved up because it is the highest-converting tool.
5. **Refusal letter decoder** (§8.4) with result panel and "Book a free file review" + "Send it to a consultant" buttons.
6. **Why files get refused** — 3 problem → "How we fix it" cards (Appendix D).
7. **Mid-page CTA band** (navy): "Not sure where your file stands? A 15-minute call is free. So is an honest answer." + **Book a free call** · **Send an enquiry** · **WhatsApp**.
8. **Choose your visa page** — tablist **Visit visas | Study visas | Immigration**.
   - Visit / Study tabs: 8 cards each — kind label (VISIT blue / STUDY maroon), route code (e.g. KHI → LHR), country in display font, visa name, perforation line, "Open guide →".
   - Immigration tab: 7 country cards with pathway chips (§6.8) + note: "Immigration rules change often — each pathway page shows the official source and the date we last checked it. Where the law requires a licensed representative (for example an RCIC for Canada or a registered migration agent for Australia), cases are filed with our licensed partners." Card CTA "Check if I qualify →".
9. **Client reviews** — approved reviews + "Leave a review" form (service select includes Immigration).
10. **Why Visafeast** — 4 items: Published fees · One consultant · No fake documents · **English and Urdu** ("The whole site, every checklist and our WhatsApp updates — in the language you prefer."), followed by **Book a free call** + **Send an enquiry** buttons.
11. **Visa News Radar** (2 official items + weekly digest card).
12. **FAQ** (seed list in §6.1-old, with the work-visa question replaced — see below — plus "Do you help with immigration and PR?" and "Can I read the website in Urdu?").
13. **Book a free 15-minute call** (Cal.com) + **Send an enquiry** form (Service: Visit / Study / Immigration; Country; **Your passport country**; **Where do you live now?**; Refused before?).
14. **Footer** with columns: brand · Visit & study · **Immigration** (Canada Express Entry, Australia skilled visas, Germany Opportunity Card, UK Skilled Worker) · Contact.
15. Floating chat assistant + WhatsApp (every page).

**Removed from earlier drafts — do not build on the homepage:** the "Where are you headed?" boarding-pass destinations grid (replaced by item 8) and the "Real files, real outcomes" case-studies section (the `case_studies` table stays for later use on country pages).

### 6.1-old Homepage — earlier draft (superseded by §6.1; keep only for copy and component details)
1. **Nav:** logo (stamp-circle mark + "visafeast" wordmark), links: Visit visas · Study visas · Visa news · Free eligibility check · Reviews · (Book a free call = amber pill). Mobile: hamburger sheet.
2. **Hero (3D, §7):**
   - Eyebrow (mono, amber): `VISIT & STUDY VISA CONSULTANTS · KARACHI · SERVING ALL PAKISTAN`
   - H1: **"Visit and study visas, prepared right the first time."**
   - Sub: "Document review, file preparation and appointment support for the UK, Canada, USA, Australia, New Zealand, Europe and Asia — with fees and timelines published openly."
   - CTAs: **Check my eligibility — free** (→ #eligibility) · **WhatsApp us** (wa.me link with prefilled text).
   - Trust ticks: "Fees shown with a 'last checked' date" · "One consultant, start to decision" · "Updates on WhatsApp".
   - **Hero video strip (owner's YouTube videos, §6.7):** inside the hero section, directly below the headline + globe row, on the navy background. Shows up to 3 videos side by side on desktop, autoplaying muted; if more than 3 videos are active, it becomes a swipeable slider.
   - Under hero: "WE HANDLE" strip listing all destinations.
3. **Problem / Solution** — 3 cards: (a) "My bank statement wasn't enough" (b) "I didn't know which documents" (c) "I was refused once — now what?" Each: problem text → perforation → "How we fix it".
4. **Destinations (portfolio)** — Visit / Study tabs, 8 boarding-pass cards each, from `countries` (published only), link to country pages.
5. **Case studies** — from `case_studies` (published + consent). Hide whole section if none.
6. **Reviews** — approved reviews carousel/grid (name, city, visa type, stars, text, date). If < 3 approved: show the empty-state card + link to Google reviews (if set) + "Leave a review" form. Copy: "Every review here is from a real client. Clients post their own review; we approve it before it appears to stop spam — we never edit the words or hide fair criticism."
7. **Why Visafeast** — 4 items: Published fees · One consultant · No fake documents ("We never arrange bank statements or letters. In the UK, a false document can bring a 10-year ban.") · Updates on WhatsApp. Plus founder mini-profile with photo `[ASK]`.
8. **Eligibility checker** (§8.1) embedded.
9. **Visa News Radar** — 2 latest relevant official items (with "What it means" line if present) + latest published weekly digest card.
10. **FAQ** — general FAQs from `faqs` where `country_id is null`. Seed (owner can edit):
    - *Do you guarantee a visa?* — No. No honest consultant can — only the embassy decides. What we promise is a complete, consistent file and an honest opinion of your chances before you pay embassy fees.
    - *How much bank balance do I need for a UK visit visa?* — There is no fixed official amount. The officer checks that your funds cover the trip and match your income history. We review your statements in the free call.
    - *I was refused before. Can you help?* — Yes. Send us the refusal letter; we address every point raised and tell you honestly if it's better to wait.
    - *I live outside Karachi. Can I still use Visafeast?* — Yes. Consultations run on WhatsApp video or phone; you attend biometrics at your nearest VFS/visa centre.
    - *How long does processing take?* — Depends on the country and season; each country page shows the current official time with the date we last checked it.
    - *Do you help with immigration and PR?* — Yes — skilled, family and business pathways for Canada, Australia, the UK, USA, Germany, New Zealand and parts of Europe. Where the law requires a licensed representative, your case is filed with our licensed partners.
    - *Can I read the website in Urdu?* — Yes. Use the EN / اردو switch at the top. Checklists and WhatsApp updates are available in Urdu too.
11. **Final CTA** — Cal.com inline embed (left) + enquiry form (right, navy card).
12. **Footer** — brand blurb, Visit links, Study links, Contact (WhatsApp, email, Facebook, address), legal links, disclaimer: "Visafeast is a private consultancy, not an embassy or government agency. Visa decisions are made only by the relevant embassy or immigration authority."
13. **Floating** — chat button + WhatsApp button (both every page).

### 6.2 Visit-visa country page template (`/visit-visa/[slug]`)
Sections in this order (each heading is an H2, good for SEO):
1. Navy header: breadcrumb (with BreadcrumbList JSON-LD), boarding-pass route row `KHI ---✈--- LHR`, H1 (e.g. "UK Visit Visa from Pakistan"), intro, mono line `LAST CHECKED {date} · SOURCE: {domain}`.
2. **Quick facts card** (overlapping header): Visa · Embassy fee (+ ≈ PKR) · Decision time · Stay · Apply window · Biometrics. Unknown fields use §6.4 fallback.
3. "On this page" anchor nav.
4. **Who this visa is for** (cards).
5. **Documents checklist** — interactive checkboxes ("x of n ready", state in localStorage wrapped in try/catch) + **"Get this checklist as a PDF"** → asks WhatsApp number (+ Turnstile) → creates lead (`source='checklist'`) → returns PDF download and offers WhatsApp share.
6. **How much bank balance do I need?** (navy callout; the #1 follow-up search for every country).
7. **How it works with Visafeast** — numbered steps.
8. **Common refusal reasons** — cards.
9. **Total cost** table: Item · Paid to · Amount · Last checked (embassy / VFS / Visafeast service fee per `settings.service_fee_mode`).
10. **Latest news for this country** — 3 newest `news_items` tagged with the country code.
11. **FAQ** (country FAQs, FAQPage JSON-LD).
12. Sidebar (desktop) / bottom block (mobile): CTA card (eligibility, WhatsApp), latest news, related guides. **Sidebar must not be sticky.**

### 6.3 Study-visa country page template (`/study-visa/[slug]`)
Same skeleton, with study-specific `extra_sections` (e.g. Germany: blocked account, APS certificate, public universities with low/no tuition, language requirements; UK: CAS, IELTS/UKVI English, maintenance funds; Canada: study permit, PAL, GIC; Italy: pre-enrolment/Universitaly, DSU scholarships). **All requirement details and amounts must be filled from official sources with links, or left null.**

### 6.4 Unknown-value fallback
If a fee/time/fact is `null` or `facts_last_checked` is older than 90 days, render: **"Being verified — WhatsApp us for today's figure"** (linked to WhatsApp with prefilled text "Hi, what's the current {visa_name} fee?"). Admin dashboard flags pages older than 60 days in red.

### 6.5 Seed data you MAY use (verified on GOV.UK, 23 Oct 2026 — https://www.gov.uk/standard-visitor/apply-standard-visitor-visa)
UK Standard Visitor: fee **£135** (up to 6 months); long-term **2 yr £506 / 5 yr £903 / 10 yr £1,128** (6 months per visit); decision **usually within 3 weeks**; earliest application **3 months before travel**. `facts_source_url` = that URL, `facts_last_checked` = 2026-10-23.
All other countries: create the rows with structure, copy outlines and `null` facts; the owner/agent verifies before publishing.

### 6.8 Immigration hub & pathway pages (`/immigration`, `/immigration/[slug]`)
Hub cards (seed — **each pathway must be checked against its official source before `is_published=true`; programmes open, pause and change often**):
| Country | Pathway chips |
|---|---|
| Canada | Express Entry (FSW, CEC, FST) · Provincial Nominee Programs · Atlantic Immigration Program · Start-up Visa · Spouse & family sponsorship |
| Australia | Skilled Independent (189) · Skilled Nominated (190) · Skilled Work Regional (491) · Employer Nomination (186) · Skills in Demand (482) · National Innovation (858) · Partner visas |
| United Kingdom | Skilled Worker · Health and Care Worker · Global Talent · Innovator Founder · Spouse / partner |
| USA | EB-2 NIW · EB-1A extraordinary ability · EB-5 investor · H-1B (employer) · Family-based green cards |
| Germany | EU Blue Card · Opportunity Card (Chancenkarte) · Skilled worker visa · Family reunion |
| New Zealand | Skilled Migrant Category · Green List Straight to Residence · Accredited Employer Work Visa · Partner visas |
| Europe — other | Portugal D7 (passive income) · Portugal job seeker visa · Ireland Critical Skills Employment Permit · Netherlands highly skilled migrant |

Pathway page template: navy header (breadcrumb, H1 e.g. "Canada Express Entry from Pakistan", last-checked + official source) → quick facts (who it's for, main requirements, official processing info, official fees — all nullable with §6.4 fallback) → eligibility basics → step-by-step → documents → common mistakes → total cost table → licensed partner box (`licensed_partner`) → country news → FAQ → CTA ("Check if I qualify" → lead `source='immigration'`, Book a call, WhatsApp). Never state points scores, cut-offs or quotas unless copied with a date from the official source.

### 6.7 Hero video strip / slider (owner-managed YouTube videos)
- Source: `hero_videos` table (§5), active rows ordered by `sort_order`. Managed in Admin → Videos (§9.9). If there are 0 active videos, the strip is hidden entirely.
- Heading (mono eyebrow, amber): `WATCH · VISA TIPS FROM VISAFEAST` + optional "See all on YouTube →" link (`settings.youtube_channel_url`).
- **Layout:**
  - 1–3 active videos → static row (desktop 3 columns; tablet 2; mobile 1 with horizontal swipe).
  - **More than 3 active videos → slider** (use `embla-carousel-react`): desktop shows 3 per view, tablet 2, mobile 1 (with a peek of the next card); left/right arrow buttons (`aria-label="Previous videos" / "Next videos"`), dot pagination, touch/mouse swipe, keyboard arrows when focused; loops.
- **Embed:** privacy-enhanced domain `https://www.youtube-nocookie.com/embed/{VIDEO_ID}?autoplay=1&mute=1&playsinline=1&loop=1&playlist={VIDEO_ID}&rel=0&modestbranding=1&controls=1`. Browsers only allow autoplay when muted — so videos start **muted**; the viewer can unmute with YouTube's controls. iframe `title` = video title; `allow="autoplay; encrypted-media; picture-in-picture"`; `loading="lazy"`.
- **Aspect ratio per video:** regular videos 16:9; YouTube **Shorts** 9:16 (auto-detected from `/shorts/` URL, or the admin toggle). In a mixed row, keep cards equal height (Shorts centred in a 16:9 card with navy letterbox, or use a 9:16 card row if all are Shorts).
- **Performance rules (must keep hero LCP < 2.5 s):**
  - Server-render each card as a **thumbnail** (`https://i.ytimg.com/vi/{VIDEO_ID}/hqdefault.jpg` via `next/image`, with a play icon) — never block LCP on iframes.
  - Mount the real iframes only after the page has loaded (`requestIdleCallback`) **and** the strip is in the viewport (IntersectionObserver).
  - In slider mode, mount iframes **only for the slides currently in view**; slides that scroll out are unmounted back to thumbnails (stops playback and saves data/CPU). Newly visible slides mount and autoplay muted.
  - `prefers-reduced-motion` or `navigator.connection.saveData`: do not autoplay — show thumbnails; clicking a thumbnail loads that one video (with `autoplay=1`, unmuted allowed because it's a user click).
- Track events: `video_view` (iframe mounted), `video_click` (thumbnail click), with `video_id`.
- Below each video: title (1 line, ellipsis) and optional caption (e.g. "UK visit visa — documents in 60 seconds").
- **Also show the same videos** (optional per-video toggle `show_on_country_slug`) on a matching country page sidebar — phase 2.

### 6.6 Other pages
- `/news`: tabs All / Visit / Study / Digests; filter by country chips; each item shows source name, date, country tags, "Official source" badge, external link (`rel="nofollow noopener"`), optional "What it means". Digests are full posts.
- `/reviews`: approved reviews list + average rating text (do **not** output AggregateRating JSON-LD for own-site reviews — Google ignores self-serving review markup for LocalBusiness).
- `/about`: founder story `[ASK]`, policies (no guarantees, no fake documents, data privacy), how immigration cases are filed with licensed partners.
- `/visa-consultant-karachi`: real local content: how consultations work, VFS centre info for Karachi (verify), office hours, map embed if address given.
- Legal pages: privacy (what's collected: forms, analytics hash, chat logs; retention 12 months), terms, disclaimer.

---

## 7. 3D Hero specification

**Concept:** Slowly rotating dotted globe in a navy night sky. Glowing amber great-circle flight arcs launch from Karachi/Lahore/Islamabad to destinations; a small white low-poly aeroplane flies the active arc; on landing, the camera has eased to centre the route, the destination city pulses, and an ink **visa stamp "thumps" onto a 3D/HTML passport page** beside the globe. Then the next route. After all 8 routes, stamps clear and loop restarts.

**Routes (in order) and stamps:**
| # | From → To | HUD label | Stamp text (country / kind / code) | Ink |
|---|---|---|---|---|
| 1 | KHI → LHR | United Kingdom · visit | UNITED KINGDOM / VISITOR / KHI → LHR | stamp-blue, rect |
| 2 | LHE → YYZ | Canada · visit | CANADA / TEMP. RESIDENT / LHE → YYZ | bad (maroon), round |
| 3 | ISB → JFK | USA · B1/B2 | U.S.A. / B1 / B2 / ISB → JFK | ok (green), rect |
| 4 | KHI → SYD | Australia · visit | AUSTRALIA / VISITOR 600 / KHI → SYD | stamp-purple, round |
| 5 | LHE → BER | Germany · study | GERMANY / STUDENT · D / LHE → BER | navy, rect |
| 6 | KHI → GYD | Azerbaijan · e-visa | AZERBAIJAN / E-VISA / KHI → GYD | stamp-blue, round |
| 7 | ISB → AKL | New Zealand · visit | NEW ZEALAND / VISITOR / ISB → AKL | bad, rect |
| 8 | KHI → BKK | Thailand · visit | THAILAND / TOURIST / KHI → BKK | ok, round |

City coords (lat, lon): KHI 24.86,67.0 · LHE 31.55,74.34 · ISB 33.68,73.05 · LHR 51.47,−0.45 · YYZ 43.68,−79.63 · JFK 40.64,−73.78 · SYD −33.94,151.18 · AKL −37.0,174.79 · BER 52.36,13.5 · GYD 40.47,50.05 · BKK 13.69,100.75 · SIN 1.36,103.99.

**Globe style — DEFAULT = "Realistic Earth at night-flight dusk"** (owner prefers a real-world globe over the plain blue dotted ball; the dotted style stays as a fallback and as an admin option `settings.hero_globe_style = 'realistic' | 'dotted'`).
- **Textures (public-domain NASA imagery):** NASA "Blue Marble" day texture + NASA "Black Marble"/Earth-at-night city-lights texture (+ optional specular/ocean mask and a light cloud layer). Download from NASA Visible Earth / Earth Observatory during the build, keep the source URLs and credit "Imagery: NASA" in `/about` credits. Do **not** use third-party commercial textures.
- Sizes: desktop 2048×1024, mobile 1024×512, converted to **WebP/KTX2**, target ≤ 350 KB per texture on desktop; served from `/public/globe/`.
- **Look:** a day/night shader — sunlit side shows real continents and oceans (slightly desaturated, brightness ~85% so the amber arcs stay the brightest thing), the night side shows warm city lights, with a soft terminator line. Fresnel atmosphere rim in `rgba(90,160,255,.35)`. Slow self-rotation + the route-centring camera ease below. Sun direction fixed upper-left so Pakistan sits near the terminator at dusk (nice "evening departure" mood that matches the navy sky).
- Keep the **amber arcs, white plane, pulsing city dots and passport stamps exactly as specified** — they must read clearly over the realistic texture (add a faint dark outline/glow under arcs if needed).
- **Progressive loading:** render the dotted globe instantly (no texture download), then cross-fade to the realistic globe when textures have loaded (≈400 ms fade). Slow connections / `saveData` / no WebGL2 → stay on the dotted globe.

**Implementation (R3F):**
- `<Canvas dpr={[1,2]} camera={{ fov: 35 }}>`; realistic globe = sphere (radius 1, 64×64 segments) with a custom `ShaderMaterial` mixing day and night textures by `dot(normal, sunDir)` + fresnel atmosphere (back-side sphere 1.03 radius, additive blending). Dotted fallback = sphere with radial-ish dark-blue material (`#081629`→`#1B4176` highlight) + fresnel glow (`rgba(64,132,220,.28)`).
- Dots (fallback/loading state): ~1,500 points on a Fibonacci sphere as `THREE.Points` (size ~0.012, colour `#96BEF0`, opacity by facing).
- Arcs: great-circle slerp between endpoints, lifted by `1 + lift·sin(πt)` where `lift = min(0.42, 0.1 + angle·0.16)`; draw with `<Line>` from drei (amber `#F2A93B`, width 2.4 for active, 1.2 at 22% opacity for completed). Animate draw progress with ease-in-out over **2.6 s**, hold **1.3 s**.
- Plane: small low-poly mesh (build from geometry or a ≤30 KB GLB) oriented along the arc tangent, white with amber emissive glow.
- Camera/globe rotation eases toward the active route's midpoint (lerp factor ~0.025/frame); slight mouse-parallax tilt (±4°).
- Passport: HTML overlay (`absolute`, bottom-right of hero visual, 272×340, rotate −4°, paper texture via CSS repeating radial gradient `#F3EBDA`), header "VISAS · PAGE 07"; stamps appear with framer-motion: scale 1.9→1, opacity 0→.9, spring overshoot, ~550 ms, plus subtle CSS shake of the passport.
- HUD pill top-left of visual: `● KHI → LHR · United Kingdom · visit` (mono, navy 72% bg, amber border).
- **Performance budget** (textures excluded from the JS budget, loaded after LCP): hero text + CTAs render server-side immediately; 3D chunk loaded with `next/dynamic` (`ssr:false`) after `requestIdleCallback`; 3D JS ≤ 300 KB gzipped; pause rendering when hero is off-screen (IntersectionObserver) or tab hidden; mobile (<768px): fewer dots (800), no mouse parallax, passport scaled .72; `prefers-reduced-motion`: render a static frame with all arcs and all stamps shown, no animation.
- **Fallback:** if WebGL is unavailable, use the 2D canvas implementation in **Appendix A** (proven in the prototype).
- LCP element must be the H1, not the canvas. Target LCP < 2.5 s on 4G mobile.

---

## 8. Interactive tools

### 8.1 Eligibility checker (`/tools/eligibility` + homepage embed)
Six single-choice questions, progress bar, back button. Points:
1. Where do you want to go? — UK / Canada or USA / Schengen/Europe / Australia or NZ / Asia (Thailand, Baku, Singapore) / Study abroad → 0 pts (used for result text)
2. Main purpose — Tourism / Visiting family / Business / Study → 1
3. Travel in last 5 years — UK/USA/Canada/Schengen/Australia → 3 · Gulf/Turkey/Malaysia or similar → 2 · None → 0
4. What do you do? — Salaried with payslips → 3 · Business owner with tax returns → 3 · Student/homemaker with sponsor → 1 · Not working, no sponsor → 0
5. Last 6 months of bank statements — Regular income, steady balance → 3 · Sponsor's account → 1 · Large recent deposit → 0
6. Visa refusal before? — Never → 3 · Once → 1 · More than once → 0

Max 13. **≥10 STRONG** (green stamp) · **6–9 MODERATE** (amber-text stamp) · **<6 NEEDS WORK** (maroon stamp). Advice text per band (from prototype). Always show: "This is an indicative guide, not a decision — only the embassy decides." Result CTAs: "Send me the checklist on WhatsApp" (captures number → lead `source='eligibility'` with answers JSON) and "Book a free 15-min call". Store anonymous completion as an event even if no lead.

### 8.2 Fee estimator (`/tools/fee-estimator`)
Select country + visa → shows embassy fee (original currency + PKR from admin-entered PKR value), VFS/optional services, Visafeast service fee (per fee mode), total, and each item's "last checked" date. No live FX API (keep cost zero) — PKR values are admin-entered.

### 8.3 Document checklist PDFs
Generated server-side with `@react-pdf/renderer` from the country's `documents` JSON, Visafeast branding, "Last checked {date}", disclaimer, WhatsApp/QR footer. Cache in Storage; regenerate when the country row changes.

---

### 8.4 Refusal letter decoder (`/tools/refusal-decoder` + homepage section)
- Textarea "Refusal letter text (remove your name and reference)" + **Explain it simply** button + privacy line "Text isn't saved unless you ask us to review your case."
- Before sending: client-side scrub of obvious identifiers (GWF/application numbers, passport-number patterns, emails, phone numbers) and a visible reminder to remove names. Max 6,000 characters. Turnstile + rate limit 3 decodes per visitor per day.
- **With LLM** (§11 provider): one call using Appendix E prompt → JSON `{points:[{heading, meaning, fix}], honest_view, language}`; respond in the language of the current site (EN or Urdu).
- **Without LLM (zero-cost mode):** keyword rules map text to common refusal categories (funds/source of money, ties to home country, purpose/itinerary, credibility/inconsistency, previous immigration history, insufficient documents) and return pre-written explanations editable in Admin → FAQs ("Decoder answers").
- Result panel: numbered points with **What it means** / **What to fix**, an honest view line, and buttons **Book a free file review** (→ #book) and **Send it to a consultant** (WhatsApp; or creates a lead `source='decoder'` with the text only after an explicit consent tick).
- Nothing is stored unless the visitor consents; log only an anonymous `decoder_used` event.
- Always show: "This explains your letter in plain words. It is not legal advice; only the embassy decides."

## 9. Admin panel (`/admin`)

Supabase Auth (email + password, optional magic link). Middleware protects `/admin/*`; roles in `profiles.role` = `owner` | `consultant` | `editor` (§9A.5).

### 9.0 Admin design rules — SUPER SIMPLE (hard requirement)
The owner and staff are not technical. If a screen needs explaining, it is too complicated. Every admin screen must follow these rules:
- **Six main items only**, plain words, icon + label. Desktop: left sidebar. Phone: bottom bar (Today · People · Cases · Money · More).
  1. **Today** — the home screen (§9.0b)
  2. **People** — enquiries and clients (§9A.1)
  3. **Cases** — client files in progress (§9A.2)
  4. **Money** — invoices, payments, expenses, reports (§9A.3)
  5. **Website** — tabs: Pages & countries · Media (photos) · Videos · Reviews · News & digest · YouTube watchlist · FAQs · Translations · Appearance · **SEO** (§14.4) · **Visitors — live** (§12) (all of §9.1–§9.12 live here; Appearance = fonts §9.10 + themes & splash §9.12)
  6. **Settings** — business details, team, accounts, integrations
- Plain words everywhere: "Enquiries" not "Leads", "Money in / Money out" not "Ledger", "Who owes us" not "Receivables", "Profit this month" not "P&L". No IDs, JSON, SQL or developer words on screen.
- **One main (amber) button per screen.** A floating **+** button on every screen opens: New enquiry · Receive payment · Add expense · New case.
- **Global search** at the top: finds people, phone numbers, case numbers and invoice numbers.
- **Phone-first:** touch targets ≥ 48 px, text ≥ 16 px, lists become cards on phones (no wide tables), forms show at most 6 fields with "More details" to expand.
- **Forgiving:** autosave drafts; "Undo" toast instead of "Are you sure?" pop-ups; deletes are soft (restore within 30 days); invoices and money records are never hard-deleted (cancel / reverse instead).
- **Guided:** every empty list says what to do next with one button; first login shows a 6-step setup checklist (business details & logo, WhatsApp number, Cal.com link, bank/cash accounts, price list, first YouTube video).
- **Bilingual admin:** the EN / اردو switch also works inside the admin.
- **Fast:** every list loads in under 1 second (pagination, indexes); usable on a slow mobile connection.
- Visual style: same tokens as the site (§4) — white cards on `--paper`, navy sidebar, amber primary buttons, Fraunces page titles, Inter everything else. Calm, lots of white space, max 3 numbers per card.

### 9.0b Today (home screen)
Cards, each with a one-tap action: **New enquiries** (with WhatsApp buttons) · **Follow-ups due today** · **Appointments today** (Cal.com calls + biometrics dates from cases) · **Payments due / overdue** · **Cases waiting for client documents** · **This month: money in, money out, profit** (owner only) · **Live now: people on the site + their countries** (tap → live map) · **Reviews to approve** · **Digest to approve**. Owner also gets the same summary by email every morning at 9:00 PKT (Resend).

### 9.1 Visitors (Website → Visitors tab; key numbers also on Today)
KPI tiles: unique visitors (today/7d/30d), new leads (30d), WhatsApp clicks (30d), calls booked (30d). Chart: visitors per day (30d). Visitors by country (bar list), top pages, traffic sources, pending reviews count, digest awaiting approval, stale country pages (>60 days, red).

### 9.2 Enquiries (inside People, §9A.1)
List with filters (status, source, destination, date), search, click-to-WhatsApp, enquiry status: New → Contacted → Became a client (case started) / Not interested — the application stages themselves live in Cases (§9A.2); notes; CSV export. New lead → Resend email to owner (and optional WhatsApp click-to-chat link in email).

### 9.3 Reviews moderation
Pending / Approved / Rejected tabs. Approve / Reject buttons. Admin may **add a review on a client's behalf only with `submitted_via='whatsapp'`** and must tick a confirmation "This client sent me this review and agreed to publish it" (stored). **Admin cannot edit the text of a client review** — only approve, reject or hide it. "Request a review" button generates a WhatsApp link: `https://wa.me/?text=` + "Assalam-o-Alaikum {name}, thank you for choosing Visafeast. Could you share your experience here? {site}/reviews/write" .

### 9.4 Countries (page builder)
CRUD for `countries` with form sections matching §6.2; repeatable lists for documents/steps/refusal reasons; markdown editors; "Mark facts checked today" button; preview; publish toggle; "Duplicate as new country"; SEO fields with character counters (title ≤ 60, description ≤ 155). On save → `revalidatePath` for that page, hubs, sitemap.

### 9.5 News & digest
- Sources list (enable/disable, last fetch status), "Fetch now" button.
- News items: mark relevant/irrelevant, edit tags, add "What it means" line.
- Digest drafts: preview, edit markdown, **Publish** (+ optional "Share to Facebook" → opens Facebook share dialog with the URL; auto-posting to a Page via Graph API is optional/phase 2).
- Setting: auto-publish digest (default **off**).

### 9.6 Reviews policy (hard rule)
No code path, seed script, fixture or admin feature may create reviews attributed to people who did not write them. The reviews table ships **empty**. Demo/test data must live only in a local seed flagged `is_demo` that never runs in production.

### 9.7 YouTube watchlist
Add channel by URL → resolve channel ID → store as `news_sources.kind='youtube_channel'`. Videos list with claim, verification status, official URL, buttons: Confirm (requires official URL) / Unconfirmed / Reject.

### 9.9 Videos (hero strip / slider)
Admin → **Videos** page:
- Starts with **3 empty URL rows** ("Video 1", "Video 2", "Video 3") with a text input: "Paste YouTube link".
- A **"+ Add video"** button appends another row — unlimited. Each row has: URL input, live **thumbnail preview + title** once the link is valid, optional caption, "Short (9:16)" toggle (auto-ticked for `/shorts/` links), Active toggle, **drag handle to reorder** (dnd-kit) plus up/down buttons for mobile, and a delete (trash) button with confirm.
- Accepted URL formats (parse the 11-char ID; reject anything else with a clear error): `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/shorts/ID`, `youtube.com/embed/ID`, `youtube.com/live/ID`, `m.youtube.com/...`, with or without extra params (`&t=`, `si=`). Duplicate IDs are rejected.
- Title auto-filled from free oEmbed `https://www.youtube.com/oembed?url={url}&format=json` (no API key); editable.
- **Save** writes rows to `hero_videos` (ordered), then `revalidatePath('/')`. A note under the list: "1–3 active videos show side by side; 4 or more turn into a swipeable slider."
- Preview button shows the strip exactly as on the homepage.
- Settings gains `youtube_channel_url` for the "See all on YouTube" link.

### 9.10 Appearance · fonts
Three selects (Heading / Body / Urdu) limited to the curated lists in §4, a **live preview** panel (navy hero sample with H1, paragraph and amber button, plus an Urdu line rendered RTL), **Save and publish** (writes `settings`, revalidates all pages) and **Reset to default** (Fraunces / Inter / Noto Nastaliq Urdu). Matches the prototype's Admin → "Appearance · fonts" screen. Themes and splash screens are in §9.12.

### 9.12 Appearance · themes & splash screen (owner switches these, no code)
Same idea as the owner's StarTech admin: pick from ready-made options with a live preview, press **Save and publish**.
- **Theme picker (cards with thumbnails):** Night Flight (default, navy+amber), Passport (warm paper+maroon), Window Seat (sky blue, light), Boarding Gate (dark slate+green). Each theme = a set of CSS variables (colours, radius, shadow) in `lib/themes.ts`; `settings.theme` is read server-side and set on `<html data-theme>` so there is no flash. Plus an **accent colour** picker (`settings.accent_color`) with a contrast check (warn if text contrast < 4.5:1).
- **Splash screen picker (3D/animated intro shown while the first page loads):** `plane_stamp` (3D aeroplane flies across, lands a VISAFEAST "APPROVED" stamp), `globe_spin` (the real-Earth globe spins in and zooms to the logo), `passport_open` (3D passport cover opens to reveal the logo), `boarding_pass` (boarding pass slides in and is "scanned"), `logo_fade` (simple, lightest), `off`. Each is a React Three Fiber / CSS component in `components/splash/*`, lazy-loaded.
- **Splash rules:** shows once per browser session (`sessionStorage`, controlled by `splash_once_per_session`); max duration `splash_duration_ms` (default 2200, hard cap 3000); a visible **Skip** button; never shown to search-engine bots (check user-agent) and never delays LCP: render real page content underneath, splash is an overlay that fades out; auto-disabled for `prefers-reduced-motion`, Save-Data, slow connections (`navigator.connection.effectiveType` 2g/3g) and low-end devices (fallback to `logo_fade`). Must not harm Core Web Vitals (LCP < 2.5 s); test with Lighthouse.
- **Admin controls:** style picker with live preview ("Play preview" button), duration slider (1–3 s), "show once per visit" switch, optional custom logo upload (`media`), Reset to default.
- Applies to the Urdu version too (RTL-safe, no text inside the 3D scene except the logo).

### 9.11 Translations (Urdu)
Per page/country/FAQ/post: side-by-side English and Urdu fields, status None → Draft → Approved. "Draft Urdu with AI" button (one LLM call per item, only when the owner clicks) fills `content_ur` as **Draft**; only **Approved** Urdu is shown publicly — otherwise the Urdu route shows the English content with a small "Urdu version coming soon" notice.

### 9.8 Settings
All `settings` fields; LLM provider + test button; Turnstile keys status; Cal.com link; contact numbers.


## 9A. Back office — people, cases and money (automatic accounting)

Goal: Ather or a staff member can run the whole business from a phone: enquiry → client → case → invoice → payment → expense → profit report, **without knowing any accounting**. The app keeps proper double-entry books silently in the background.

### 9A.1 People (enquiries → clients)
- Every enquiry from any source (form, chatbot, eligibility check, decoder, checklist, Cal.com, WhatsApp entered manually) creates or updates a **person** (de-duplicate by WhatsApp number).
- Person page = one timeline: enquiries, notes, calls, WhatsApp messages sent, cases, invoices, payments, documents.
- **"Start a case"** button turns an enquiry into a client case in one tap.
- **WhatsApp quick messages** (free `wa.me` links, no API): Welcome · Documents request (auto-lists missing documents of the case) · Appointment reminder · Payment reminder (with amount due) · Visa approved congratulations · Review request. Each in English and Urdu, editable in Settings. Sending one logs it on the timeline.
- **Follow-up reminders:** "Remind me on [date]" → shows on Today.
- Privacy: do not store full CNIC or passport numbers by default (optional field, encrypted at rest with pgcrypto, visible to owner only).

### 9A.2 Cases (client files)
- A case = one application: client, service type (visit / study / immigration), country, visa or pathway, assigned consultant, agreed fee, stage, key dates (travel date, apply-by, biometrics, submitted, decision) and an auto reference number (`VF-1042`).
- Default stages (editable per service type):
  - Visit / Study: New → Documents requested → Documents received → File review → Submitted → Biometrics → Decision (Approved / Refused) → Closed
  - Immigration: Assessment → Agreement signed → Documents → Filed by licensed partner → In process → Decision → Closed
- **Board view** (drag cards between stages) on desktop, simple list with stage chips on phone.
- **Document checklist** auto-created from the country page's document list; tick when received; upload files (private Supabase Storage bucket, signed URLs, 10 MB per file, images auto-compressed); case documents auto-deleted N months after the case closes (Settings, default 12) to protect clients' data.
- **Client file tracker** (public `/track`): client enters reference number + last 4 digits of their phone → sees the stage timeline and next step only (never documents or money).
- When a decision is recorded: Approved → prompt "Send congratulations", "Request a review", "Add as case study (with consent)"; Refused → prompt "Send the refusal decoder link" and "Plan re-application".

### 9A.3 Money — automatic accounting
**Rule: the user only ever fills simple forms. Every money action posts balanced double-entry records automatically.**
- **Price list (Settings → Services):** each service with a default fee in PKR (e.g. "UK visit visa — file preparation"). Used when creating invoices.
- **Invoices:** created from a case in two taps. Auto-numbered `VF-INV-2026-0001`. Line types:
  - *Service fee* → Visafeast income.
  - *Embassy / VFS fee collected for the client* → **client money (pass-through), not income**. Tracked separately so the owner always knows how much of the bank balance belongs to clients.
  - *Discount.*
  - Optional tax line (off by default) `[ASK #13]`.
  - Branded PDF in English or Urdu; send by WhatsApp link or email; status Draft · Sent · Part-paid · Paid · Overdue · Cancelled. Optional quote (estimate) that converts to an invoice.
- **Receive payment:** amount, date, method (Cash · Bank transfer · JazzCash · Easypaisa · Card · Other), into which account, reference, photo of the receipt. Part-payments and advances (held as client credit). Auto receipt PDF + WhatsApp send.
- **Pay embassy fee for client:** records the payment out of client money for that case, with a warning if the client hasn't paid it to Visafeast yet.
- **Add expense:** amount, date, category (Rent · Salaries · Internet & phone · Ads & marketing · Software & hosting · Travel & fuel · Office · Partner commission · Bank charges · Other — editable), paid from which account, receipt photo, optional link to a case (direct cost). **Recurring expenses** (e.g. monthly rent) create themselves.
- **Refunds** to clients (reverse income or client money correctly).
- **Partners & commissions:** licensed partners / referral agents with a rule (fixed amount or % of service fee). Commission is calculated automatically when the invoice is paid → "Commissions to pay" list → "Mark paid" posts the expense.
- **Accounts:** Cash in hand, one or more bank accounts, JazzCash / Easypaisa wallets. Transfers between accounts. **Owner's drawings** ("Take money out for myself") and owner's capital.
- **Simple bank check:** each month, tick transactions that match the bank statement; the screen shows the difference until it's zero.
- **Month close:** "Close [month]" locks that month's records (owner only; can reopen with a logged reason).
- **Reports (owner only), all automatic, any date range, export to Excel/CSV and PDF for an accountant:**
  - Profit this month / year (income − expenses), with a month-by-month money in vs money out chart
  - Income by service, by country, by consultant
  - Expenses by category
  - **Who owes us** (unpaid invoices: 0–30 / 31–60 / 60+ days)
  - **Client money held** (embassy fees collected but not yet paid out)
  - Cash, bank and wallet balances
  - Case results: approvals vs refusals by country and visa type (internal only — never published as a "success rate" unless the owner chooses to and the numbers are real)
- **Hidden engine (never shown as accounting jargon):** a seeded chart of accounts — Assets (Cash, Bank accounts, Wallets, Money owed by clients), Liabilities (Client money held, Commissions payable), Equity (Owner's capital, Owner's drawings), Income (Service fees, Other income), Expenses (the categories above). Each invoice, payment, expense, refund, transfer and commission posts balanced `ledger_entries` inside one database transaction. Records are immutable: edits post a reversing entry plus a new one. A nightly check confirms debits = credits and emails the owner if not.
- Currency: PKR is the base. Embassy fees can be entered in GBP / USD / CAD / EUR / AUD with a manual exchange rate on the line (no paid FX API).

### 9A.4 Data model additions (Supabase SQL — add as migrations, RLS on all)
```sql
-- roles
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('owner','consultant','editor'));

create table people (
  id uuid primary key default gen_random_uuid(),
  full_name text, whatsapp text unique, email text, city text,
  language text default 'en' check (language in ('en','ur')),
  is_client boolean default false, notes text,
  id_number_enc bytea,                         -- optional, encrypted (pgcrypto), owner-only
  created_at timestamptz default now()
);
alter table leads add column person_id uuid references people;

create table cases (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,                    -- VF-1042
  person_id uuid not null references people,
  service_type text not null check (service_type in ('visit','study','immigration')),
  country_id uuid references countries,
  visa_or_pathway text,
  consultant_id uuid references profiles,
  stage text not null default 'new',
  agreed_fee_pkr int,
  travel_date date, apply_by date, biometrics_at timestamptz, submitted_at date, decision_at date,
  decision text check (decision in ('approved','refused','withdrawn')),
  closed_at timestamptz, created_at timestamptz default now()
);
create table case_stage_templates (service_type text, stage text, label_en text, label_ur text, sort int, primary key (service_type, stage));
create table case_documents (
  id uuid primary key default gen_random_uuid(), case_id uuid references cases on delete cascade,
  title text not null, required boolean default true, received boolean default false,
  file_path text, uploaded_at timestamptz, delete_after date
);
create table timeline_events (
  id bigserial primary key, person_id uuid references people, case_id uuid references cases,
  kind text not null,                          -- 'note','call','whatsapp_sent','stage_change','payment','invoice','document'
  body text, meta jsonb, actor uuid references profiles, ts timestamptz default now()
);
create table reminders (
  id uuid primary key default gen_random_uuid(), person_id uuid references people, case_id uuid references cases,
  due_on date not null, note text, done boolean default false, assigned_to uuid references profiles
);
create table message_templates (key text primary key, label text, body_en text, body_ur text);

-- money
create table services (id uuid primary key default gen_random_uuid(), name text not null, default_fee_pkr int, is_active boolean default true);
create table money_accounts (id uuid primary key default gen_random_uuid(), name text not null, kind text check (kind in ('cash','bank','wallet')), opening_balance_pkr bigint default 0, is_active boolean default true);
create table partners (id uuid primary key default gen_random_uuid(), name text not null, licence_no text, commission_type text check (commission_type in ('fixed','percent')), commission_value numeric, phone text);
create table invoices (
  id uuid primary key default gen_random_uuid(), number text unique not null,
  person_id uuid references people, case_id uuid references cases,
  issue_date date default current_date, due_date date,
  status text default 'draft' check (status in ('draft','sent','part_paid','paid','overdue','cancelled')),
  language text default 'en', notes text, partner_id uuid references partners
);
create table invoice_lines (
  id uuid primary key default gen_random_uuid(), invoice_id uuid references invoices on delete cascade,
  line_type text not null check (line_type in ('service','pass_through','discount','tax')),
  description text, service_id uuid references services,
  amount_pkr bigint not null, foreign_amount numeric, foreign_currency text, fx_rate numeric
);
create table payments (
  id uuid primary key default gen_random_uuid(), invoice_id uuid references invoices, person_id uuid references people,
  amount_pkr bigint not null, paid_on date not null, method text, account_id uuid references money_accounts,
  reference text, receipt_path text, created_by uuid references profiles, reversed_by uuid
);
create table expense_categories (id uuid primary key default gen_random_uuid(), name text unique not null, ledger_code text);
create table expenses (
  id uuid primary key default gen_random_uuid(), category_id uuid references expense_categories,
  amount_pkr bigint not null, spent_on date not null, account_id uuid references money_accounts,
  case_id uuid references cases, vendor text, note text, receipt_path text,
  recurring text check (recurring in ('none','monthly','yearly')) default 'none', reversed_by uuid
);
create table pass_through_payments (            -- embassy / VFS fees paid out for a client
  id uuid primary key default gen_random_uuid(), case_id uuid references cases, amount_pkr bigint not null,
  paid_on date, account_id uuid references money_accounts, payee text, receipt_path text
);
create table commissions (id uuid primary key default gen_random_uuid(), partner_id uuid references partners, invoice_id uuid references invoices, amount_pkr bigint, status text default 'due' check (status in ('due','paid')), paid_on date);
create table account_transfers (id uuid primary key default gen_random_uuid(), from_account uuid references money_accounts, to_account uuid references money_accounts, amount_pkr bigint, on_date date, note text);

-- hidden double-entry engine
create table ledger_accounts (code text primary key, name text, type text check (type in ('asset','liability','equity','income','expense')));
create table ledger_entries (
  id bigserial primary key, entry_group uuid not null,  -- one business event = one group
  entry_date date not null, ledger_code text references ledger_accounts,
  debit_pkr bigint default 0, credit_pkr bigint default 0,
  source_table text, source_id uuid, memo text, created_at timestamptz default now()
);
create table period_locks (month date primary key, locked_by uuid references profiles, locked_at timestamptz default now());
create table activity_log (id bigserial primary key, actor uuid references profiles, action text, target_table text, target_id text, meta jsonb, ts timestamptz default now());
```
Post ledger entries only through Postgres functions (`post_invoice`, `post_payment`, `post_expense`, `post_refund`, `post_transfer`, `post_commission`) that check the group balances and the period isn't locked. Store money as whole rupees in `bigint` columns (no floating point).

### 9A.5 Team & roles (Settings → Team)
| Role | Can |
|---|---|
| **Owner** | Everything, including profit reports, settings, month close, deleting/restoring |
| **Consultant** | People, Cases (own + unassigned), send WhatsApp messages, create invoices, receive payments, add expenses. Cannot see profit/reports, other consultants' totals, or settings |
| **Editor** | Website section only (pages, videos, reviews, news, translations) |
Invite by email. Every action is written to `activity_log` (owner can see "who did what, when").

### 9A.6 Admin API / pages to add
`/admin` (Today) · `/admin/people` · `/admin/people/[id]` · `/admin/cases` (board/list) · `/admin/cases/[ref]` · `/admin/money` (overview) · `/admin/money/invoices` · `/admin/money/payments` · `/admin/money/expenses` · `/admin/money/reports` · `/admin/website/*` · `/admin/settings/*` · public `/track`. Server Actions for all mutations with role checks; PDF generation via `@react-pdf/renderer`.

---

## 10. Automated news engine (near-zero API cost)

### 10.1 Daily job — `GET /api/cron/news-daily` (Vercel Cron, 01:00 UTC = 06:00 PKT)
1. For each active `news_sources` (`official_rss`, `google_news_rss`): fetch with 10 s timeout, parse RSS/Atom, upsert `news_items` by URL (store title, link, date, ≤300-char excerpt only).
2. **Relevance filter (no AI):** keep if title/summary matches any of: `visa, visitor, visit, student, study permit, study visa, ETA, eVisa, e-visa, Schengen, biometric, VFS, fee, processing, immigration rules, international students, Pakistan, Pakistani` AND does not match exclusion list (`fuel, excise, tax relief, passport renewal` for Canadians, etc. — editable in admin). Tag countries by source country codes + keyword map (`countries.keywords`), topics by keywords.
3. For each `youtube_channel` source: fetch free channel feed `https://www.youtube.com/feeds/videos.xml?channel_id={ID}`; upsert new videos (title, description, date). **No YouTube Data API, no transcripts.**
4. Update `last_fetched_at/last_status`. Revalidate `/news` and affected country pages.
5. Cost: $0. Also keeps the Supabase free project active (prevents inactivity pausing).

### 10.2 Weekly job — `GET /api/cron/digest-weekly` (Mondays 02:00 UTC = 07:00 PKT)
1. Collect last 7 days of relevant official `news_items` + `youtube_videos` with `verification='unchecked'`.
2. **One LLM call** (if provider configured) with the prompt in Appendix B. The model:
   - writes an original digest "Visa updates this week: what they mean for Pakistani applicants" grouped by country, each point linking its official source;
   - for each YouTube video, extracts the factual claim and says whether any of the supplied official items support it (returns item URL or `null`).
3. Save digest as `posts` draft (`type='digest'`, `generated_by`); update YouTube rows: supported → `confirmed` + `official_url`; unsupported → `unconfirmed` (**never published**).
4. Email owner "Digest ready for approval" with admin link. If `digest_auto_publish=true`, publish directly.
5. If no LLM configured: create a draft digest that simply lists the week's items (title, source, link) for the owner to annotate.
6. Rules: never copy article text; never present YouTube claims as fact unless confirmed by an official source; always include source links; add "Last updated" date; add disclaimer line.

### 10.3 Seed sources
Verified working (23 Oct 2026):
- GOV.UK — UK Visas and Immigration (Atom): `https://www.gov.uk/search/news-and-communications.atom?organisations%5B%5D=uk-visas-and-immigration` → `GB`
- Canada.ca — IRCC news (Atom; noisy, rely on filter): `https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&sort=publishedDate&orderBy=desc&pick=50&format=atom` → `CA`

To discover and validate during build (insert only if the feed parses; otherwise leave `is_active=false` and note in admin):
- Australia — Department of Home Affairs news/media feed → `AU`
- New Zealand — Immigration New Zealand news → `NZ`
- USA — travel.state.gov / US Mission Pakistan news → `US`
- Germany — Federal Foreign Office / German Missions in Pakistan / DAAD Pakistan → `DE`
- EU — Home Affairs / Schengen news → `EU`
- Google News RSS search (one per gap country), format `https://news.google.com/rss/search?q={query}&hl=en-PK&gl=PK&ceid=PK:en`, e.g. `Thailand visa Pakistan`, `Azerbaijan visa Pakistan`, `Singapore visa Pakistan`, `Italy study visa Pakistan`, `Greece study visa Pakistan` → mark `is_official=false` (show "News report" badge, never "Official source").

`vercel.json`:
```json
{ "crons": [
  { "path": "/api/cron/news-daily",    "schedule": "0 1 * * *" },
  { "path": "/api/cron/digest-weekly", "schedule": "0 2 * * 1" }
] }
```
Protect cron routes with `Authorization: Bearer ${CRON_SECRET}` (Vercel sends it automatically when `CRON_SECRET` is set).

---

## 11. AI chatbot

- Floating widget on all pages; opens a panel (360px, mobile full-width sheet). Greeting: "Assalam-o-Alaikum! I'm the Visafeast assistant. Ask me about visit, study or immigration — in English or Urdu. For your own case, I'll connect you to our consultant on WhatsApp."
- Quick replies: "UK visit visa documents" · "Do you guarantee a visa?" · "Talk to a consultant".
- **Answer pipeline (cost control):**
  1. Normalise question → search FAQs + country pages (Postgres full-text search, `to_tsvector` on question/answer/sections). If a high-confidence match → answer directly **without LLM** (+ link to page).
  2. Else, if LLM enabled and visitor under limits → call LLM with the top 3–5 retrieved snippets only (Appendix C system prompt). Max 400 output tokens.
  3. Else → "I'm not sure — our consultant can answer this on WhatsApp" + button.
- Limits: 10 user messages per visitor per day, 60 LLM calls per day site-wide (env), per-IP rate limit; Turnstile on first message.
- Lead capture: after 2nd message or on hand-off, ask for name + WhatsApp; create lead `source='chatbot'` with transcript summary. WhatsApp hand-off button pre-fills: "Hi Visafeast, I was chatting on your website about {topic}."
- Store transcripts (`chat_sessions/messages`), visible in Leads.
- Supports English and Roman Urdu input; replies in the user's language/script.

---

## 12. Analytics & LIVE traffic monitoring (built-in, free)

**What the owner sees (Admin → Today card + Admin → Website → Visitors):**
- **Live now:** number of people on the site right now (active in the last 2 minutes), on a world map with dots, plus a live list: country flag · city · page they are on · device · language · where they came from (Google / Facebook / WhatsApp / direct). Updates automatically every few seconds (Supabase Realtime on `live_presence`, heartbeat every 30 s while the tab is visible).
- **Visitors:** today / yesterday / 7 / 30 / 90 days / custom — unique visitors, page views, new vs returning, average time on site, pages per visit, bounce rate. Day-by-day chart.
- **Where they are:** countries (with flags), regions/provinces and cities (e.g. Karachi, Lahore, Islamabad, Dubai, Riyadh, London, Toronto).
- **Languages:** browser language (`navigator.language`, Accept-Language) and which site version they used (English / Urdu).
- **Nationality:** a website cannot detect nationality. It is collected **only when the visitor tells us** — enquiry, eligibility check, chat hand-off and booking forms ask "Your passport country" and "Where do you live now?". The Visitors screen shows a **Nationality (from enquiries)** report and a **Country of residence** report from those answers.
- **Devices:** mobile / tablet / desktop, browser, operating system, screen size.
- **Traffic sources:** Google search, Google Maps, Facebook, Instagram, YouTube, WhatsApp, direct, other sites; UTM campaigns.
- **Pages:** top pages, top landing pages, exit pages, top countries per page.
- **Conversions:** visitors → WhatsApp clicks → enquiries → booked calls → cases, by source and by country page.
- **Search (from Google Search Console API, free):** top Google search queries, clicks, impressions, average position per page and per keyword, country — so the owner sees which keywords bring traffic (refreshed daily into `search_console_daily`).
- Export any report to Excel/CSV.

**How it is collected (privacy-safe, no paid tools):**
- Client beacon (`navigator.sendBeacon`) on every route change → `POST /api/track` with path, referrer, UTM, viewport, `navigator.language`, site locale, screen size; a final beacon on `visibilitychange: hidden` sends time on page.
- Server reads Vercel geo headers `x-vercel-ip-country`, `x-vercel-ip-country-region`, `x-vercel-ip-city` (URL-decoded), `Accept-Language`, and parses the User-Agent (browser, OS, device) with `ua-parser-js`. `visitor_hash = sha256(DAILY_SALT + ip + ua)`; **raw IPs are never stored**. New vs returning via a first-party cookie (random id, 1 year) after consent.
- Ignore bots (UA regex + `isbot`), prefetches and `/admin`.
- Events: `whatsapp_click`, `cta_click` (label), `chat_open`, `checklist_download`, `booking_click`, `eligibility_complete`, `review_submitted`, `decoder_used`, `video_view`, `video_click`.
- GA4 (`NEXT_PUBLIC_GA_ID`) as a backup, loaded after consent; Google Search Console + Bing Webmaster Tools verified.
- Small cookie/consent banner (EN/UR). Retention: `page_views` 13 months, `live_presence` rows deleted after 10 minutes.

---

## 13. API route handlers

| Route | Method | Purpose | Protection |
|---|---|---|---|
| `/api/leads` | POST | Enquiry/checklist/eligibility leads | zod, Turnstile, rate limit, honeypot |
| `/api/reviews` | POST | Submit review (pending) + optional photo | zod, Turnstile, rate limit, consent required |
| `/api/track` | POST | Page views + events + time on page | rate limit, bot filter |
| `/api/presence` | POST | Live heartbeat (every 30 s while visible) | rate limit, bot filter |
| `/api/media/pexels-search` | GET | Admin photo search via Pexels API | admin session |
| `/api/cron/search-console` | GET | Daily pull of Search Console data | CRON_SECRET |
| `/api/chat` | POST | Chatbot | Turnstile (first msg), limits §11 |
| `/api/checklist/[slug]` | POST | Create lead + return PDF URL | Turnstile |
| `/api/calcom/webhook` | POST | Booking → lead (`source='calcom'`) | signature secret |
| `/api/cron/news-daily` | GET | §10.1 | CRON_SECRET |
| `/api/cron/digest-weekly` | GET | §10.2 | CRON_SECRET |
| `/api/revalidate` | POST | Admin-triggered ISR | admin session |

Admin mutations: Server Actions with admin check.

---

## 14. SEO requirements

### 14.1 Keyword map (one main keyword per page)
| Page | Main keyword | Also cover (H2s/FAQs) |
|---|---|---|
| `/` | visa consultant in Karachi | visit visa consultant Karachi, study visa consultant Pakistan, visa consultancy fee |
| `/visit-visa/uk-visit-visa-from-pakistan` | UK visit visa from Pakistan | bank statement for UK visit visa, UK visa fee in PKR 2026, documents required, processing time, new rules 2026 |
| `/visit-visa/canada-visit-visa-from-pakistan` | Canada visit visa from Pakistan | bank statement amount, processing time, fee, documents checklist, apply online |
| `/visit-visa/usa-visit-visa-from-pakistan` | USA visit visa from Pakistan | B1/B2 interview questions, appointment wait time Karachi/Islamabad, fee |
| `/visit-visa/australia-visit-visa-from-pakistan` | Australia visit visa from Pakistan | subclass 600, processing time, bank statement, 3-year multiple entry |
| `/visit-visa/new-zealand-visit-visa-from-pakistan` | New Zealand visit visa from Pakistan | fee, processing time, documents |
| `/visit-visa/schengen-visa-from-pakistan` | Schengen visa from Pakistan | easiest Schengen country for Pakistani, Italy/Greece/Germany visit visa |
| `/visit-visa/azerbaijan-visa-for-pakistani` | Azerbaijan visa for Pakistani | Baku visa price in Pakistan, e-visa fee, Baku visa and ticket price |
| `/visit-visa/thailand-visa-from-pakistan` | Thailand visa from Pakistan | Thailand e-visa fee for Pakistani 2026, visa and ticket price, processing time |
| `/visit-visa/singapore-visa-from-pakistan` | Singapore visa from Pakistan | fee, documents, processing time |
| `/study-visa/study-in-germany-from-pakistan` | study in Germany from Pakistan | free study for Pakistani students, cost, blocked account, after 12th, scholarships |
| `/study-visa/study-in-uk-from-pakistan` | study in UK from Pakistan | UK student visa requirements, scholarships, IELTS waiver |
| `/study-visa/study-in-canada-from-pakistan` | study in Canada from Pakistan | study permit, PAL, GIC, cost |
| `/study-visa/study-in-italy-from-pakistan` | study in Italy from Pakistan | DSU scholarship, no-fee universities, pre-enrolment |
| `/immigration` | immigration consultant in Pakistan | immigration consultant Karachi, PR from Pakistan |
| `/immigration/canada-express-entry-from-pakistan` | Canada immigration from Pakistan | Express Entry from Pakistan, PNP, CRS score, proof of funds |
| `/immigration/australia-skilled-visa-from-pakistan` | Australia PR from Pakistan | subclass 189/190/491, skills assessment, points test |
| `/immigration/germany-opportunity-card-from-pakistan` | Germany Opportunity Card from Pakistan | Chancenkarte requirements, EU Blue Card from Pakistan |
| `/immigration/uk-skilled-worker-visa-from-pakistan` | UK Skilled Worker visa from Pakistan | certificate of sponsorship, salary threshold |
| `/visa-consultant-karachi` | visa consultant in Karachi | visit visa consultant Karachi, US/UK/Europe visa consultant Karachi |

### 14.2 Technical SEO checklist
- `generateMetadata` per page from DB; unique title (≤60) + description (≤155); canonical URLs; Open Graph + Twitter cards with a generated OG image per country (`next/og`: navy background, boarding-pass route, country name).
- Exactly one H1 per page; logical H2/H3.
- JSON-LD: `Organization` + `LocalBusiness`/`ProfessionalService` (name, url, logo, sameAs Facebook, telephone, areaServed Pakistan, address if given) on home; `BreadcrumbList` on all inner pages; `FAQPage` on pages with FAQs (rich results are limited by Google, but markup is still valid); `Article`/`NewsArticle` on digests with `datePublished/dateModified`. **No AggregateRating for own reviews.**
- `app/sitemap.ts` including all published countries, posts and static pages with `lastModified`; `app/robots.ts` disallowing `/admin` and `/api`.
- Internal links: hubs ↔ country pages, related countries block, news items → country pages.
- Visible "Last checked/updated" dates.
- Images: `next/image`, WebP/AVIF, descriptive alt text.
- Core Web Vitals green: LCP < 2.5 s, CLS < 0.1, INP < 200 ms on mobile. Lighthouse ≥ 90 Performance, ≥ 95 Accessibility, 100 SEO, ≥ 95 Best Practices on homepage and a country page.
- `hreflang` not needed at launch (English). Phase 2: Urdu/Roman-Urdu FAQ sections.
- Google Business Profile: link to site (owner action).

### 14.3 Urdu version (i18n)
- Use `next-intl` (or equivalent) with locales `en` (default, no prefix) and `ur` (`/ur/...`). `<html lang="ur" dir="rtl">` on Urdu routes; mirror layouts with CSS logical properties (`margin-inline-start`, etc.); keep numbers, route codes and Latin brand names LTR inside RTL text (`<bdi>`).
- EN / اردو toggle in the nav switches to the same page in the other locale (remember choice in a cookie; never auto-redirect search bots).
- SEO: `hreflang` alternates `en-PK`, `ur-PK` and `x-default`; separate Urdu titles/descriptions; both locales in the sitemap. Only **Approved** Urdu pages are indexable; untranslated Urdu routes use `noindex` until approved.
- UI strings in `messages/en.json` and `messages/ur.json` (seed Urdu from Appendix D2; owner approves). Database content via `content_ur` (§5, §9.11).
- Chatbot and decoder answer in Urdu when the site is in Urdu or the user writes in Urdu / Roman Urdu.


### 14.4 Indexing & organic-traffic plan (do all of this — it's how traffic starts coming automatically)
**Indexing**
- Verify the domain in **Google Search Console** (DNS TXT) and **Bing Webmaster Tools**; submit `/sitemap.xml` (a sitemap index with child sitemaps: pages, countries, immigration, news, posts, Urdu) on launch day.
- Every public page: server-rendered HTML, `200` status, self-referencing canonical, in the sitemap with accurate `lastmod`, linked from at least one other page (no orphan pages), `index, follow` (draft/unapproved Urdu pages `noindex`).
- **IndexNow** ping (free) to Bing/Yandex whenever a page is published or updated (country page, news, digest). Note: Google's Indexing API is only for job postings/livestreams — do not use it; rely on sitemaps, internal links and Search Console "Request indexing" for key pages.
- `robots.txt` allows everything public; blocks `/admin`, `/api`, `/track` results, search/filter URLs with parameters.
- Pretty, permanent URLs (no IDs); 301 redirects when a slug changes (store old slugs).
- Custom 404 with links to popular pages; no soft 404s.

**On-page SEO for every page and section (automated checks)**
- One H1 containing the main keyword; H2s for each section using secondary keywords (from §14.1); keyword in the first 100 words; title ≤ 60 chars (keyword first, "| Visafeast" last); meta description 140–155 chars with a call to action; descriptive image `alt`; FAQ section on every country/immigration page.
- Country and pathway pages: at least 900 words of genuinely useful content, organised in the §6.2 sections, with official source links and "last checked" dates (freshness + trust).
- The homepage stays short and picture-first (§4 rules) — SEO depth lives on country, immigration and guide pages, which the homepage links to.
- Structured data per page type: `Organization` + `ProfessionalService` (home), `BreadcrumbList` (all), `FAQPage` (pages with FAQs), `Article`/`NewsArticle` (news & digests), `HowTo` style steps as plain content (no HowTo markup — deprecated), `VideoObject` for embedded YouTube videos, `WebSite` with `SearchAction`. Validate with Google's Rich Results Test in CI (schema-dts types).
- **Admin → Website → SEO** shows an SEO score per page (title, description, H1, keyword use, word count, internal links, missing alt text, schema present, page speed) with plain-language fixes ("Your title is too long — shorten it to 60 characters"), plus Search Console data for that page. Auto-suggest titles/descriptions (one LLM call only when the owner clicks).
- Internal linking: every country page links to 3 related countries, its study/immigration counterpart, the eligibility check and the decoder; news items link to their country page; footer links to all hubs.
- Urdu: separate Urdu titles/descriptions, `hreflang` (en-PK, ur-PK, x-default), Urdu keywords (e.g. "یوکے وزٹ ویزا پاکستان سے", "کینیڈا ویزا کنسلٹنٹ کراچی") and Roman Urdu FAQs ("UK ka visa kaise milega").

**Keyword clusters to cover with pages/guides (add to §14.1 map as pages are built)**
- Visit: "[country] visit visa from Pakistan", "[country] visa fee in Pakistan 2026", "bank statement for [country] visit visa", "[country] visa processing time from Pakistan", "[country] visa documents checklist", "[country] visa and ticket price from Pakistan", "[country] visa refusal reasons".
- Study: "study in [country] from Pakistan", "[country] student visa requirements for Pakistani students", "scholarships in [country] for Pakistani students", "study in [country] without IELTS", "cost of studying in [country] for Pakistani students".
- Immigration: "[country] immigration from Pakistan", "Express Entry from Pakistan", "Australia PR from Pakistan", "Germany Opportunity Card from Pakistan", "UK Skilled Worker visa from Pakistan".
- Local: "visa consultant in Karachi", "best visa consultant in Karachi", "study visa consultant Karachi", "immigration consultant Karachi", later Lahore/Islamabad pages with real local content.
- Questions (People Also Ask): "Which country gives visa easily to Pakistani?", "How much bank balance is required for UK visit visa?", "Can I apply again after refusal?", "Is Thailand e-visa available for Pakistan?" → FAQ answers + guide posts.

**Content engine (steady new pages = steady traffic)**
- Launch with all country pages + 10 evergreen guides (e.g. "UK visit visa refusal reasons and how to fix them", "Bank statement for visit visa: what embassies check", "Study in Germany without tuition fees: a guide for Pakistani students").
- Weekly digest (§10) adds a fresh, dated page every Monday.
- Plan 2 new guides per month from Search Console queries that get impressions but no page yet (admin shows "Keyword ideas from Google": queries with impressions and position > 10).

**Local SEO & off-page**
- Google Business Profile (Karachi): exact same name/address/phone as the site, category "Visa consultant"/"Immigration consultant", photos, weekly posts (share the digest), ask happy clients for Google reviews (the review-request WhatsApp link offers both website and Google).
- Consistent listings (NAP) on Pakistani directories and study-abroad portals, Facebook page "Website" field, YouTube channel links, Instagram bio.
- Every YouTube video description links to the matching country page (traffic + backlinks).

**Speed (ranking factor)**
- Core Web Vitals green on mobile (LCP < 2.5 s, INP < 200 ms, CLS < 0.1); Lighthouse SEO 100 on every page template; checked in CI with Lighthouse CI on `/`, a country page and an immigration page.

---

## 15. Environment, deployment & ops

### 15.1 Environment variables
```
NEXT_PUBLIC_SITE_URL=https://www.visafeast.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
OWNER_NOTIFY_EMAIL=visafeast@gmail.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
CRON_SECRET=
DAILY_SALT_SECRET=
LLM_PROVIDER=none            # none | gemini | anthropic
GEMINI_API_KEY=
GEMINI_MODEL=                # set to current Gemini Flash model id
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-5-5
LLM_DAILY_CAP=60
NEXT_PUBLIC_GA_ID=
PEXELS_API_KEY=               # free, for Admin → Media photo search
GOOGLE_SEARCH_CONSOLE_CREDENTIALS=   # service account JSON (base64) with read access to the property
INDEXNOW_KEY=
CALCOM_WEBHOOK_SECRET=
```
Provide `.env.example` with all keys and comments.

### 15.2 Deployment steps (write these into README.md for the owner)
1. Create Supabase project (region closest to Pakistan, e.g. Mumbai/Singapore) → run migrations → create owner user → set `profiles.role='admin'`.
2. Create Resend account, verify sending domain (or use onboarding domain initially).
3. Create Cloudflare Turnstile site keys.
4. Push repo to GitHub → import into Vercel → set env vars → deploy.
5. Add domain `visafeast.com` + `www` in Vercel; update DNS at registrar (A/CNAME as Vercel shows). `[ASK #1]`
6. Set `CRON_SECRET` → crons auto-register from `vercel.json`. Hit "Fetch now" in admin once.
7. Search Console: verify domain, submit `/sitemap.xml`. GA4: add ID.
8. Cal.com: create event types, put link in Admin → Settings; add webhook to `/api/calcom/webhook`.
9. **Vercel plan note:** the Hobby plan is for personal, non-commercial use under Vercel's terms; a business site should move to Pro. Hobby crons run at most once per day — this design already fits that.

### 15.3 Running cost estimate
Vercel $0 (Hobby) / $20 (Pro) · Supabase $0 · Resend $0 · Turnstile $0 · Cal.com $0 · GA4/Search Console $0 · LLM: $0 on Gemini free tier, or a few US$/month on Claude Haiku with the caps above · Domain ~US$10–15/yr.

### 15.4 Security & privacy
RLS everywhere; service key only server-side; zod validation; Turnstile; honeypot fields; rate limits; sanitize markdown (rehype-sanitize); CSP headers; no raw IPs; uploaded review photos private until approved; admin audit log (who approved what, when).

---

## 16. Build phases & acceptance criteria

**Phase 1 — Foundation:** Next.js + Tailwind + tokens/fonts; layout, nav, footer, floating buttons; Supabase schema + RLS + seed (countries skeletons, UK facts, FAQs, news sources); `.env.example`; README.
✅ Site runs locally; DB migrated; lint/typecheck pass.

**Phase 2 — Public pages:** homepage in the FINAL §6.1 order (hero with static fallback first), hubs, country template (visit + study), immigration hub + pathway template (§6.8), EN/Urdu routing with the language switch (§14.3), news pages, reviews pages, about/contact/book, legal, Karachi page; §6.4 fallbacks; SEO metadata, JSON-LD, sitemap, robots, OG images.
✅ All routes render with seed data; one H1 each; Lighthouse targets met on `/` and UK page (static hero).

**Phase 3 — 3D hero + splash:** R3F globe per §7 with all safeguards + Appendix A fallback; splash screens + theme switcher per §9.12.
✅ Animation loops through 8 routes with stamps; reduced-motion static; mobile performant; LCP still < 2.5 s.
✅ Realistic day/night Earth loads after the dotted globe and cross-fades in; arcs and stamps stay clearly visible; Admin → Settings can switch to the dotted style.
✅ Hero video strip: with 3 active videos all autoplay muted side by side; with 4+ it becomes a slider (arrows, dots, swipe) and only in-view slides play; thumbnails render first; LCP unaffected.

**Phase 4 — Forms & tools:** enquiry, review submission, eligibility checker, checklist PDF, fee estimator, Cal.com embed + webhook, Turnstile, rate limits, Resend notifications, event tracking.
✅ Each form creates the right DB row + owner email; abuse protections verified.
✅ Refusal decoder works in zero-cost keyword mode and in LLM mode, in English and Urdu, and stores nothing without consent.

**Phase 5 — Admin panel:** auth, Appearance (fonts) with live preview, Urdu translations workflow, dashboard, leads CRM, reviews moderation (+ WhatsApp request link), countries builder with revalidation, FAQs, case studies, news & digest, YouTube watchlist, analytics, settings.
✅ Owner can change any fee/FAQ/country/contact without code; approve a review and see it live.
✅ Admin → Videos: paste 3 links, press "+ Add video" for a 4th and 5th, reorder by drag, save → homepage shows the slider in the new order.

**Phase 5B — Back office (§9A):** Today screen, People, Cases (board + checklist + documents + tracker), Money (price list, invoices, payments, pass-through, expenses, recurring, refunds, commissions, accounts, transfers, reports, month close), roles, activity log, WhatsApp quick messages, morning email.
✅ On a phone, the owner can add an enquiry, start a case, send an invoice by WhatsApp, record a part-payment and add an expense — each in under 30 seconds.
✅ Automated tests prove every money action posts balanced ledger entries; the profit report equals service income minus expenses; client money held is never counted as income.
✅ A Consultant login cannot open reports or settings; an Editor sees only Website.
✅ A non-technical tester completes the first-login setup checklist without help.

**Phase 6 — Automation & AI:** daily news cron, weekly digest cron, YouTube claim checking, chatbot (FAQ-first, LLM fallback, caps, hand-off).
✅ "Fetch now" pulls UK + Canada feeds and filters correctly; a digest draft is created; chatbot answers FAQ without LLM; LLM calls capped.

**Phase 7 — QA & launch:** Playwright smoke tests (home, country page, forms, admin login, approve review), accessibility pass (axe), mobile check at 360px, 404/500 pages, production deploy on Vercel, domain, Search Console, GA4.
✅ Live on Vercel at the owner's domain; README handover with admin how-to.

**Phase 2 backlog (after launch):** Urdu/Roman-Urdu FAQs; client case tracker (reference number → status); "For UAE residents" section; visa + ticket packages (Thailand, Baku); Facebook Page auto-post via Graph API; Lahore/Islamabad pages with real local content.

---

## Appendix A — 2D canvas hero fallback (reference implementation from the prototype)

Port to a React client component (`HeroGlobe2D.tsx`) using a `ref` on `<canvas>`, `ResizeObserver`, `requestAnimationFrame`; call `onArrive(routeIndex)` to trigger stamps.

```js
const D = Math.PI / 180;
const C = { KHI:[24.86,67.0], LHE:[31.55,74.34], ISB:[33.68,73.05], LHR:[51.47,-0.45], YYZ:[43.68,-79.63],
  JFK:[40.64,-73.78], SYD:[-33.94,151.18], AKL:[-37.0,174.79], BER:[52.36,13.5], GYD:[40.47,50.05],
  BKK:[13.69,100.75], SIN:[1.36,103.99] };
const ROUTES = [['KHI','LHR'],['LHE','YYZ'],['ISB','JFK'],['KHI','SYD'],['LHE','BER'],['KHI','GYD'],['ISB','AKL'],['KHI','BKK']];

// Fibonacci sphere dots
const pts = []; const N = 1500;
for (let i = 0; i < N; i++) { const y = 1 - (i/(N-1))*2, r = Math.sqrt(1-y*y), th = i*2.399963229728653;
  pts.push([Math.cos(th)*r, y, Math.sin(th)*r]); }

const vec = ([lat,lon]) => { const la=lat*D, lo=lon*D; return [Math.cos(la)*Math.sin(lo), Math.sin(la), Math.cos(la)*Math.cos(lo)]; };
const toLL = v => [Math.asin(Math.max(-1,Math.min(1,v[1])))/D, Math.atan2(v[0], v[2])/D];
const slerp = (a,b,t) => { const d=Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2])), w=Math.acos(d);
  if (w<1e-4) return a.slice(); const s=Math.sin(w), k1=Math.sin((1-t)*w)/s, k2=Math.sin(t*w)/s;
  return [a[0]*k1+b[0]*k2, a[1]*k1+b[1]*k2, a[2]*k1+b[2]*k2]; };
const routes = ROUTES.map(([f,t]) => { const a=vec(C[f]), b=vec(C[t]);
  const w=Math.acos(Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2])));
  return { f, t, a, b, w, mid: toLL(slerp(a,b,.5)), lift: Math.min(.42, .1 + w*.16) }; });

const cam = { lon: 60, lat: 22 };
// project: rotate around Y by -cam.lon, then tilt around X by cam.lat
function proj(v, R, cx, cy) {
  const a=-cam.lon*D, tl=cam.lat*D;
  const x1=v[0]*Math.cos(a)+v[2]*Math.sin(a), z1=-v[0]*Math.sin(a)+v[2]*Math.cos(a);
  const y2=v[1]*Math.cos(tl)-z1*Math.sin(tl), z2=v[1]*Math.sin(tl)+z1*Math.cos(tl);
  return [cx+x1*R, cy-y2*R, z2, x1, y2];
}
const visible = p => p[2] > 0 || (p[3]*p[3]+p[4]*p[4]) > 1.0001;   // in front, or lifted outside the disc
const arcPt = (rt,t) => { const v=slerp(rt.a,rt.b,t), h=1+rt.lift*Math.sin(Math.PI*t); return [v[0]*h,v[1]*h,v[2]*h]; };

// per frame (FLY=2600ms, HOLD=1300ms):
// 1. advance route when elapsed > FLY+HOLD (reset stamps when wrapping to route 0)
// 2. ease camera: cam.lon += shortestDelta(rt.mid[1]-cam.lon)*0.025; cam.lat += (clamp(rt.mid[0],-20,35)-cam.lat)*0.025
// 3. draw halo (radial gradient rgba(64,132,220,.28)->0 from 0.9R to 1.35R)
// 4. draw globe disc (radial gradient #1B4176 -> #081629) + 1px rim rgba(120,170,235,.35)
// 5. draw front dots: fillStyle rgba(150,190,240, 0.12 + z*0.55), 1.6px squares
// 6. completed arcs: amber at 22% alpha, 1.2px; active arc up to eased progress, 2.4px, alpha ramps along length
// 7. origin cities (KHI/LHE/ISB) + destination; active ones amber with expanding pulse ring + mono code label
// 8. plane at arc head, rotated to atan2 of last segment; white fill + amber shadowBlur 12
// 9. when progress hits 1 the first time -> onArrive(routeIndex) => show stamp routeIndex
// R = min(w,h)*0.42, cx = w*0.46, cy = h*0.47; devicePixelRatio capped at 2.
```

## Appendix B — Weekly digest LLM prompt (template)

```
SYSTEM:
You write a short weekly visa-news digest for Visafeast, a visit & study visa consultancy in Pakistan.
Audience: Pakistani travellers, families and students. Plain English, short sentences.
Rules:
- Use ONLY the items provided. Do not add facts, numbers, dates or rules that are not in the items.
- Write in your own words. Never copy sentences from the items.
- For each point, add "What it means for Pakistani applicants" in one sentence, and the source link.
- If an item is not relevant to Pakistani passport holders, either skip it or say clearly that it does not apply to them.
- No visa guarantees, no legal advice, no exaggeration, no clickbait.
- YouTube items are UNVERIFIED claims. For each, state the claim in one neutral sentence and return
  "supported_by" = the URL of an official item that supports it, or null. Never present an unsupported claim as fact.
Return JSON: { "title": str, "excerpt": str (<=155 chars), "body_md": str, "sources": [{"title","url"}],
  "country_codes": [str], "youtube": [{"video_id","claim","supported_by"}] }

USER:
Week: {week_start}–{week_end}
OFFICIAL_ITEMS: [{title, url, source, published_at, summary, country_codes}...]
YOUTUBE_ITEMS: [{video_id, channel, title, description, published_at}...]
```

## Appendix C — Chatbot system prompt (template)

```
You are the Visafeast website assistant (visit and study visas from Pakistan).
Answer ONLY from the CONTEXT snippets provided (from Visafeast's own pages and FAQs). If the answer is not in the context,
say you're not sure and offer the WhatsApp consultant. Keep answers under 120 words, friendly, plain English;
reply in Roman Urdu or Urdu if the user writes that way.
Never: guarantee a visa, estimate approval chances as a number, give legal advice, invent fees/times/requirements,
suggest fake or borrowed documents or funds, state immigration points scores, cut-offs or eligibility as certain
(immigration questions: explain the pathway from the context and offer the free call; licensed partners handle filing where the law requires).
When the user describes their personal case, suggest the free eligibility check or a free 15-minute call, and offer WhatsApp.
Always include the relevant page link from the context when you use it.
CONTEXT:
{snippets}
```

## Appendix D — Copy bank (from approved prototype)

- Problem cards:
  1. "My bank statement wasn't enough" — Embassies look at income history and where money came from, not one balance. Sudden deposits are a common refusal reason. → *How we fix it:* We review six months of statements with you and explain funds properly in the cover letter.
  2. "I didn't know which documents" — Every country asks for something different, and online lists are often years out of date. → A personal checklist for your case, checked against the official source with the date we last verified it.
  3. "I was refused once — now what?" — Re-applying with the same file wastes the embassy fee again and adds another refusal to your history. → We read the refusal letter, fix each point raised, and tell you honestly if it's worth applying again yet.
- Eligibility advice:
  - STRONG: "Your profile looks strong on paper. The next step is making the file match it: consistent documents, a clear travel plan and a well-written cover letter."
  - MODERATE: "You have a fair chance, with a few weak points. In a free call we will tell you exactly what to strengthen before you pay any embassy fee."
  - NEEDS WORK: "Applying right now carries a high refusal risk. Let us plan the steps first — for example building travel history or documenting funds — so your application starts strong."
- UK page "bank balance" callout: "There is no fixed amount set by UK Visas and Immigration. The officer checks three things: that your funds cover the full trip, that they match your income, and that the money has been in your account long enough to be explained. A large deposit shortly before applying is one of the most common refusal reasons. If someone else pays for your trip, include their statements and a letter explaining the relationship."
- UK refusal reasons: Unexplained deposits · Weak ties to Pakistan · Inconsistent details · Unclear purpose.
- UK FAQs: How early can I apply? (3 months before travel; decisions usually within 3 weeks, so apply 6–8 weeks ahead) · Should I apply for a 2/5/10-year visa straight away? (possible, but must show genuine repeat visits; long-term fee not refunded if refused; first-time travellers usually start with 6 months) · Do I need to book flights before applying? (No — a travel plan with dates is enough) · Can I work on a visit visa? (No; meetings and conferences are fine).
- UK documents: Passport (+ old passports) · 6 months bank statements · Proof of job or business · FBR tax returns (NTN) · Travel plan · Invitation letter (if visiting someone) · Sponsor documents (if sponsored) · Family ties (FRC, marriage certificate) · Property/other assets (optional).

— End of brief —

## Appendix D2 — Urdu copy (draft for owner approval)

| Key | English | Urdu |
|---|---|---|
| hero.eyebrow | Visit, study & immigration consultants · Karachi · serving all Pakistan | وزٹ، اسٹڈی ویزا اور امیگریشن کنسلٹنٹس · کراچی · پورا پاکستان |
| hero.h1 | Your visa, prepared right the first time. | آپ کا ویزا، پہلی ہی بار درست تیاری کے ساتھ |
| hero.sub | Visit visas, study visas and immigration pathways for the UK, Canada, USA, Australia, New Zealand, Europe and Asia — with fees and timelines published openly. | یوکے، کینیڈا، امریکہ، آسٹریلیا، نیوزی لینڈ، یورپ اور ایشیا کے لیے وزٹ ویزا، اسٹڈی ویزا اور امیگریشن — فیس اور وقت کی مکمل شفافیت کے ساتھ۔ |
| cta.eligibility | Check my eligibility — free | مفت اہلیت چیک کریں |
| cta.book | Book a free call | مفت کال بک کریں |
| cta.whatsapp | WhatsApp | واٹس ایپ |
| cta.enquiry | Prefer to write? Send an enquiry → | لکھ کر پوچھنا چاہتے ہیں؟ انکوائری بھیجیں |
| tick.1 | Fees shown with a "last checked" date | فیس کے ساتھ آخری تصدیق کی تاریخ |
| tick.2 | One consultant, start to decision | شروع سے فیصلے تک ایک ہی کنسلٹنٹ |
| tick.3 | Updates on WhatsApp | واٹس ایپ پر اپڈیٹس |

## Appendix E — Refusal decoder LLM prompt (template)

```
SYSTEM:
You explain visa refusal letters in plain, kind language for Pakistani applicants, for Visafeast (a visa consultancy).
Input is text pasted from a refusal letter. Identify each separate reason the officer gave.
For each reason return: heading (short), meaning (1–2 simple sentences: what the officer was not satisfied about),
fix (1–2 sentences: what evidence usually addresses it). Then an honest_view (1–2 sentences) on whether to fix
things before re-applying. Reply in {language: English | Urdu}.
Rules: Use only what the letter says. Do not invent rules, numbers or legal procedures. Never suggest fake, borrowed
or arranged documents or funds. Never promise approval. Do not give legal advice; if the letter mentions a ban,
deception or appeal rights, say the person should speak to a consultant or lawyer before doing anything.
Return JSON: {"points":[{"heading","meaning","fix"}], "honest_view": str, "language": str}

USER:
LETTER_TEXT: {scrubbed_text}
```
