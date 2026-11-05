# How to start the Visafeast build in Claude Code

## 1. Make the project folder
1. Create an empty folder on your computer, for example `E:\Projects\visafeast`.
2. Copy everything from this pack into it, so it looks like this:
```
visafeast/
├── VISAFEAST_MASTER_BRIEF.md
├── CLAUDE.md
├── START_HERE.md
└── design-reference/
    ├── README.md
    ├── homepage-final.dc.html
    ├── country-page-uk.dc.html
    └── admin-prototype.dc.html
```
3. Optional but helpful — put these in `design-reference/assets/` if you have them: your logo (SVG or PNG), a founder photo for the About page, and screenshots of each prototype screen.
4. Open Claude Code in that folder.

## 2. Paste this as your first message

```
Read CLAUDE.md, then read VISAFEAST_MASTER_BRIEF.md completely, then look at the files in design-reference/.

This is my visa, study and immigration consultancy website plus a simple admin panel with automatic accounting. I am not a developer, so explain things simply and give me click-by-click steps whenever I need to do something myself.

Step 1: Ask me all the [ASK] questions from section 0 in one list. Wait for my answers.
Step 2: Show me a short plan of the phases from section 16 (Phase 1 to Phase 7, including Phase 5B back office) with what I will be able to see after each one.
Step 3: After I say "go", build Phase 1 only. When it is done, run the checks, commit to git, tell me what you built and how I can see it, and wait for me before starting the next phase.

Rules: never invent visa fees, rules, reviews or statistics; keep the admin panel super simple (section 9.0); keep monthly running costs near zero; the homepage section order must follow section 6.1 FINAL exactly.
```

## 3. During the build
- Work **one phase per session** if a session gets long. Start a new session with: `Read CLAUDE.md and VISAFEAST_MASTER_BRIEF.md. We finished Phase X. Continue with Phase Y.`
- If something looks wrong, say exactly what and where (for example "the video slider on the homepage shows only 2 videos on my phone").
- Accounts you will be asked to create (all free to start): GitHub, Vercel, Supabase, Resend, Cloudflare (Turnstile), Cal.com, Google Search Console, Google Analytics. An AI key (Google Gemini or Anthropic) is only needed for the chatbot, the decoder's AI mode and the weekly digest.
- Before going live as a business, move Vercel to the Pro plan (the free Hobby plan is for non-commercial use only).

## 4. Have these ready (Claude Code will ask)
- Domain access for visafeast.com (where it was bought)
- WhatsApp number(s) to show
- Office address or "online across Pakistan", office hours, NTN if any
- Cal.com username
- Your service fees in PKR (price list), bank/cash/JazzCash/Easypaisa accounts to track
- Licensed immigration partners and their licence numbers (needed before immigration pages go live)
- Your YouTube video links
