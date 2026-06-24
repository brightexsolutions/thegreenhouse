# The Green House — CLAUDE.md

> This file is the authoritative project context for Claude Code. After `/clear`, read this file first. It defines what has been built, what rules to follow, what still needs doing, and where to find things.

---

## Project Identity

- **Name:** The Green House W.S (`SITE_NAME` in `lib/constants.ts`)
- **URL:** https://www.greenhousews.co.ke
- **Cloudinary cloud:** `dpjget2he` (account: info.brightexsolutions@gmail.com)
- **GitHub repo:** brightexsolutions/thegreenhouse
- **Active branch:** `dev` — all work happens here; push to `dev`, not `main`
- **Deployment:** Vercel (auto-deploys from `main` on merge)
- **Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS v4 · Supabase · Framer Motion · Resend (email) · shadcn/ui
- **Sessions are QUARTERLY.** Never write "monthly gathering", "once a month", or any monthly framing anywhere in the codebase, copy, or emails.

---

## Related Files

| File | Purpose |
|---|---|
| `/Users/brown/.claude/plans/i-would-like-us-indexed-nebula.md` | Full architecture plan — DB schema, all flows, design philosophy, phase breakdown |
| `lib/constants.ts` | SITE_NAME, SITE_URL, SESSION_FREQUENCY, partners, video URLs, social links |
| `app/globals.css` | Design tokens, keyframe animations (`ripple-out`, `play-pulse`) |
| `supabase/schema.sql` | Single-file schema — update inline, never create separate migration files |
| `middleware.ts` | Auth gates: `/admin/*` requires admin session; `/admin/system/*` requires super_admin |
| `lib/email-templates.ts` | All Resend email HTML templates |
| `components/chat/chat-fab.tsx` | Chat assistant FAB — intent engine, ripple, popup, dynamic event data |
| `components/home/partners-carousel.tsx` | Partners carousel — auto-scroll, controls, card decorations |

---

## Coding Rules (project-specific)

### Commits
- **Never** add `Co-Authored-By: Claude ...` trailers — commit as Godwin Brown only
- Always verify build is clean (`npm run build`) before pushing

### Animations
- **Framer Motion `repeat: Infinity` flicker rule:** If the start value ≠ end value in an array animation, the loop boundary flashes (FM resets instantly). Rule: use CSS `@keyframes` for any fade-out ring/pulse. Use FM only for oscillating effects where start === end.
- `ripple-out` (FAB rings) and `play-pulse` (video play buttons) are defined in `app/globals.css` — use those, don't re-declare.

### Videos
- `preload="metadata"` on all `<video>` elements. **Never `preload="auto"`** — it downloads the full video before the user presses play, consuming Cloudinary bandwidth.
- Long-form video (worship recordings) should go on YouTube and use the `youtubeEmbedUrl` prop on `EventHighlightVideo`. Cloudinary bandwidth for large MP4s depletes the free tier fast.

### Cloudinary images
Always add transform params to every Cloudinary image URL — never serve raw uploads:

| Context | Transform string |
|---|---|
| Hero / full-bleed | `w_1200,q_auto,f_auto` |
| Section photos | `w_900,q_auto,f_auto` |
| Small / accent card | `w_600,q_auto,f_auto` |
| Video card thumbnail | `so_2,w_640,q_auto,f_jpg` |
| Video poster (full-width) | `so_2,w_960,q_auto,f_jpg` |

Insert after `/upload/`: `.../image/upload/w_900,q_auto,f_auto/v17xxx/file.jpg`
`f_auto` serves WebP to modern browsers (~60% smaller than JPEG). See memory: `reference_cloudinary_optimization.md`.

### WhatsApp / tickets
The site does **not** send tickets via WhatsApp automatically. Resend email is the only delivery channel. Never write "we'll send it to you on WhatsApp" or similar in any copy, email template, or chat reply.

### Buttons
Use `rounded` (4px) or no rounding on buttons. Never `rounded-lg` or larger.

### Admin tables
All admin listing tables: `max-h-[440px] overflow-y-auto` + `sticky` `<thead>`. Hugs content when short, scrolls when tall.

### Next.js `<Image>` with Cloudinary / Supabase
Always add `unoptimized` to `<Image>` tags pointing at Cloudinary or Supabase storage URLs. Vercel's Image Optimization has a quota — don't let it proxy external images. For Supabase storage: use the `/render/image/public/` transform endpoint (`storageUrl()` in `lib/constants.ts`).

---

## Project Status: FEATURE-COMPLETE FOR SESSION 02 LAUNCH

Session 02 is **26 June 2026**. All must-have features are built and in `dev`.

---

## Completed Features

### Phase 1 — Foundation ✅
- Next.js 14 App Router, TypeScript, Tailwind v4 brand tokens, CSS design system
- Supabase client trio (`lib/supabase/client.ts`, `server.ts`, `admin.ts`)
- `lib/utils.ts` (cn), `lib/phone.ts` (normalisePhone), `lib/rate-limit.ts`, `lib/logger.ts`
- Middleware: `/admin/*` auth gate, `/admin/system/*` super_admin gate
- `lib/constants.ts`: SITE_NAME, SITE_URL, SESSION_FREQUENCY, PARTNERS, video URLs, social links
- `/api/health` → `{ status: "ok", project: "greenhouse", timestamp }`
- `/api/cron/keep-alive` → daily Vercel Cron, queries DB to prevent free-tier pause

### Phase 2 — Public Pages ✅
- `components/motion/fade-in.tsx` — FadeIn, FadeInStagger, StaggerChild
- `SiteNav` — scroll-triggered transparent→solid, Live Now pulsing indicator
- `SiteFooter` — multi-zone, "The Green House" watermark
- **Home page** (`app/(public)/page.tsx`): HeroCollage, MarqueeStrip, StatsStrip (counter animation), WhatHappens, EventTeaser, SessionHighlight, CommunityCircles, GetInvolvedCta, PartnersStrip
- **About page** (`app/(public)/about/page.tsx`): VisionCards, FaqAccordion, UmwemaMoment photo stack
- **Events listing** (`app/(public)/events/page.tsx`): EventGrid, EventCard (dark card + glow), PastEventCard
- **Event detail** (`app/(public)/events/[slug]/page.tsx`): EventHighlightVideo, GalleryCarousel, GalleryGrid, PosterViewer, RegistrationModal
- **Gallery page** (`app/(public)/gallery/page.tsx`): GalleryVideos (3 Session 01 recordings), photo grid
- **Get Involved page** (`app/(public)/get-involved/page.tsx`): InvolvementForm
- **Ticket view** (`app/(public)/ticket/[token]/page.tsx`): printable HTML ticket + badge customizer
- SEO: per-page metadata, JSON-LD Event structured data, `app/sitemap.ts`, `app/robots.ts`, dynamic OG image, Organization JSON-LD
- `SessionPromptDialog` — auto-prompt for upcoming events

### Phase 3 — Registration + Ticketing ✅
- `RegistrationForm` + `RegistrationModal` — RHF + Zod, cross-field (email OR phone required), `normalisePhone()` on blur
- `/api/register` — rate-limited, server Zod re-validate, capacity check, duplicate check, insert
- Email: PDF ticket via Resend + `lib/pdf/ticket-pdf.tsx`, comms logged to `communications_log`
- Phone-only: ticket link returned, user copies it — no WhatsApp auto-send
- `/api/ticket/[token]/pdf` — PDF download endpoint
- Badge customizer: `components/ticket/badge-customizer.tsx`, `/api/ticket/[token]/badge`

### Phase 4 — Live Event System ✅
- `/live/[slug]` — program list, song lyrics (Radix Accordion), theme card, pre-event view, donation prompt, feedback form, photo share, trivia
- `/live/[slug]/display` — fullscreen projection screen, 9 scenes, Supabase Realtime subscriber
- `/live/[slug]/control` — worship leader panel, scene switcher, lyrics advance, Realtime publisher
- `/feedback/[slug]` — 302 redirect to feedback_url
- `/api/live/[slug]/control-access`, `/api/live/[slug]/stats`, `/api/live/[slug]/photos`

### Phase 5 — Check-in System ✅
- `/checkin/[slug]` — token-gated, no admin login required, real-time attendance
- `CheckinList`, `CheckinStatsBar` — searchable, present/absent toggle, Supabase Realtime sync
- Walk-in registration from check-in page (`/api/checkin/[slug]/walkin`)
- Admin: `CheckinLinkPanel` — generate/copy/share check-in link, regenerate token

### Phase 6 — Admin Panel ✅
- Admin layout: sidebar (forest bg, gold active), topbar, auth-gated
- `/admin/dashboard` — stats cards with mini charts
- `/admin/events` — events table, new/edit event form with image upload (Supabase Storage)
- `/admin/events/[id]` — tabbed: Overview, Registrants, Sessions, Tools, Feedback
- `/admin/events/[id]/sessions` — SessionManager with dnd-kit drag-to-reorder, song picker
- `/admin/events/[id]/registrants` — RegistrantsTable + download CSV/PDF + share list via email
- `/admin/events/[id]/tools` — QR share panel, check-in link, control links, post-event email
- `/admin/registrants` — global registrants with filter/search
- `/admin/communications` — CommsSendDialog (email broadcast), CommsLogTable
- `/admin/library` — SongsLibrary, ThemesLibrary, TriviaLibrary, EventPhotoUpload, AttendeePhotoApproval
- `/admin/enquiries` — EnquiriesTable
- `/admin/system` — health overview, storage monitor
- `/admin/system/logs` — full system log (super_admin only)
- `/admin/system/trash` — soft-deleted items + restore (super_admin only)
- `/admin/system/admins` — manage admin accounts (super_admin only)
- `/admin/system/settings` — global site settings (super_admin only)
- Push notifications for new registrations and enquiries (`components/admin/notification-listener.tsx`)

### Phase 7 — Docs ✅
- `/admin/docs` — full in-app admin documentation (all features explained)
- `/docs` — public-facing docs page

### Phase 8 — Contribution System ✅
- `/contribute/[token]` — general contribution hub
- `/contribute/theme/[token]` — submit theme ideas
- `/contribute/trivia/[token]` — submit trivia questions
- Admin: SongContributionPanel, ContributionLinkPanel

### Phase 9 — Chat Assistant FAB ✅
- `components/chat/chat-fab.tsx` — floating chat with:
  - Gold ripple animation (CSS `ripple-out` keyframe — no FM, no flicker)
  - Speech bubble popup on every page load (14s TTL, 2.8s delay)
  - Rule-based intent engine: greetings (once per session), FAQ, register, partner, support, venue, theme, schedule
  - Dynamic event data: pulls `venue_name`, `venue_address`, `event_date`, `event_time`, `theme_title`, `theme_scripture` from live DB event passed as prop from layout
  - Action CTA buttons after relevant replies (links to register, get-involved, etc.)
  - Auto-closes when user navigates to another page (`usePathname()`)
  - Chat title pulled from `SITE_NAME` constant

### Phase 10 — Partners Carousel ✅
- `components/home/partners-carousel.tsx` — client carousel:
  - Auto-scroll (mobile: always; desktop: only if >3 partners)
  - Prev/Next square controls (z-30, above card link overlay)
  - Dot indicators (mobile: always; desktop: only if >3 partners)
  - Card decorations (Code2/Terminal/Cpu/Braces for Brightex; Cake/UtensilsCrossed/Cookie for Glace; Brain/Heart/Smile for Calm Front) at 20–45% opacity
  - Pause on hover, resume on leave
- Partners: Brightex Solutions, Glace Confectionary, Calm Front (Debra Odiwuor — Psychology & Mental Wellness)

---

## Pre-Go-Live Checklist (MUST complete before merging dev → main)

- [ ] **Re-enable live page status gate** — disabled for testing in `app/(live)/live/[slug]/page.tsx` or related middleware. See memory: `project_greenhouse_restore_items.md`
- [ ] Verify `/api/health` returns `{ status: "ok" }` on production
- [ ] Verify Vercel Cron keep-alive is running (check Vercel dashboard)
- [ ] Confirm Session 02 event record in DB: `status = "published"`, correct `event_date`, `event_time`, `venue_name`, `theme_title`, `theme_scripture`
- [ ] Register site in Brightex dashboard (Brightex standard)
- [ ] Smoke test: register with email → PDF ticket in inbox
- [ ] Smoke test: register with phone only → link returned on success screen
- [ ] Smoke test: `/ticket/[token]` renders, PDF download works
- [ ] Check Cloudinary usage is within free tier after deploy

---

## Fixes Log

| Date | Fix | Files |
|---|---|---|
| 2026-06 | Safari video autoplay — programmatic `.play()` tied to user gesture | `components/gallery/gallery-videos.tsx` |
| 2026-06 | H.264 re-encode (`vc_h264,f_mp4`) for Ewe Yesu + Ebenezer — Safari codec incompatibility | `lib/constants.ts` |
| 2026-06 | Removed `fl_faststart` — Cloudinary 400 on existing uploads | `lib/constants.ts` |
| 2026-06 | Hydration warning from browser extension injecting `body` attributes | `components/mobile-scroll-fix.tsx` |
| 2026-06 | Video play button flicker — replaced Framer Motion rings with CSS `play-pulse` keyframe | `components/gallery/gallery-videos.tsx`, `components/events/event-highlight-video.tsx` |
| 2026-06 | FAB ripple flicker — replaced Framer Motion with CSS `ripple-out` keyframe | `components/chat/chat-fab.tsx` |
| 2026-06 | False WhatsApp ticket delivery claims removed from chat replies and registration form | `components/chat/chat-fab.tsx`, `components/registration/registration-form.tsx` |
| 2026-06 | Partners dot indicators showing on desktop with ≤3 cards | `components/home/partners-carousel.tsx` |
| 2026-06 | Partners prev/next buttons unclickable — card `<Link>` overlay at z-20 covered buttons at z-10; fixed to z-30 | `components/home/partners-carousel.tsx` |
| 2026-06 | Cloudinary credits nearly depleted — added `w_XXX,q_auto,f_auto` to all image URLs, `so_2,w_640,q_auto,f_jpg` to thumbnails, `preload="metadata"` on video modal | multiple files |
| 2026-06 | Calm Front + Brightex + Glace card icons barely visible — bumped opacity to 20–45% | `components/home/partners-carousel.tsx` |

---

## Known Constraints

- **Supabase free tier:** DB pauses after 7 days inactivity — keep-alive cron handles this. Storage limit is 1 GB — compress images before upload (Sharp server-side in upload API).
- **Cloudinary free tier:** 25 credits/month. Videos are the biggest drain (50–180 MB per play). Long-form video should move to YouTube. Always apply transforms to image URLs. See memory: `reference_cloudinary_optimization.md`.
- **Vercel Image Optimization quota:** Always use `unoptimized` on `<Image>` tags for Cloudinary/Supabase URLs. Use Supabase `/render/image/` transform endpoint instead.
- **Twilio / WhatsApp:** Dropped — paid service. Email-only ticket delivery. Do not re-introduce WhatsApp API calls.
- **Realtime (Supabase free):** 200 concurrent connections. Peak is ~102 (display + control + 100 attendees). Safe.

---

## Next Tasks (post-Session 02)

These are deferred post-launch — do not implement before June 26 unless explicitly asked:

- [ ] Move Session 01 videos to YouTube; swap `src` → `youtubeEmbedUrl` in `GalleryVideos` and `EventHighlightVideo` to eliminate Cloudinary video bandwidth
- [ ] Prayer/Reflection Wall — anonymous cards, admin moderation
- [ ] Mood check-in — emoji tap on live page, aggregate in admin
- [ ] "Bring a Friend" shareable card on registration success
- [ ] Church/neighbourhood dot map (attending churches across Nairobi)
- [ ] Song request voting during live session
- [ ] Attendance streaks + badges (3/6-session)
- [ ] Session recap email (post-event: photo + quote + attendance count)
- [ ] PWA — service worker caches live page + lyrics offline
- [ ] Web push notifications for attendees (opt-in on registration)
- [ ] Smart registration memory (pre-fill if same email/phone registered before)
- [ ] Swahili / English toggle on key pages
- [ ] Dark mode (essential for live page in dim venue)
- [ ] Automated post-event email sequence (24hr thank you + 7-day reminder)
- [ ] One-click event duplication from admin

---

## Project Complete?

**Core platform: YES** — all must-have features for Session 02 are built and in `dev`.
**Go-live: NOT YET** — pre-go-live checklist above must be cleared before merging to `main` and promoting to production.
**Phase 2 features (post-launch list above): NO** — deferred by design.
