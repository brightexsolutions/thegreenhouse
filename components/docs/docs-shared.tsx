/* eslint-disable react/no-unescaped-entities */
import {
  BookOpen, Calendar, Users, MessageSquare, Monitor,
  Music, Settings2, Radio, QrCode, CheckSquare,
  ChevronRight, Info, Leaf, Zap, Shield, Images,
  Rocket, Globe, Mail, Server, SearchCode, Sparkles, Palette,
} from "lucide-react";

/* ── Helper components ─────────────────────────────────────── */

export function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-5 h-5 rounded-full bg-forest/10 flex items-center justify-center text-[9px] font-bold text-forest flex-shrink-0 mt-0.5">{n}</span>
      <div>
        <span className="font-semibold text-charcoal">{title} — </span>
        <span className="text-charcoal/60">{children}</span>
      </div>
    </div>
  );
}

export function JourneyPhase({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`border-l-2 pl-4 ${color}`}>
      <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export function JourneyStep({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-[12px] text-charcoal/65">
      <span className={`mt-0.5 flex-shrink-0 ${done ? "text-green-500" : "text-charcoal/25"}`}>
        {done ? "✓" : "□"}
      </span>
      <span>{children}</span>
    </div>
  );
}

export function DeploySection({
  n, icon: Icon, title, subtitle, children,
}: {
  n: number;
  icon: typeof Rocket;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-mist rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-off-white border-b border-mist">
        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{n}</span>
        <Icon size={14} className="text-indigo-500 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-charcoal">{title}</p>
          <p className="text-[10px] text-charcoal/45">{subtitle}</p>
        </div>
      </div>
      <div className="px-4 py-3 text-sm text-charcoal/70 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

/* ── Sections array ────────────────────────────────────────── */

export const SECTIONS = [
  {
    id:    "overview",
    icon:  Leaf,
    title: "Platform overview",
    color: "bg-forest/10 text-forest",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>The Green House platform manages the full event lifecycle — from creating a gathering and opening registration, through the night itself (live projection display, door check-in, attendee feedback), to post-event follow-up.</p>
        <p>The admin is split into two access levels:</p>
        <ul className="space-y-1 pl-4 list-disc">
          <li><strong className="text-charcoal">Admin</strong> — day-to-day operations: events, program, registrants, comms, display control, check-in.</li>
          <li><strong className="text-charcoal">Super Admin</strong> — everything above, plus system logs, trash recovery, admin user management, and site settings.</li>
        </ul>
        <p>The database is hosted on Supabase (free tier). A daily keep-alive cron runs at 6 am EAT to prevent the database from pausing. The site is hosted on Vercel with automatic deployments from the connected GitHub repo.</p>
      </div>
    ),
  },
  {
    id:    "event-lifecycle",
    icon:  Calendar,
    title: "Event lifecycle",
    color: "bg-gold/10 text-amber-700",
    content: (
      <div className="space-y-4 text-sm text-charcoal/70 leading-relaxed">
        <p>Every gathering moves through these stages. Change the status on the event Details tab.</p>

        <div className="space-y-2">
          {[
            { status: "Draft",     dot: "bg-charcoal/30", desc: "Not visible to the public. Work in progress." },
            { status: "Published", dot: "bg-gold",        desc: "Visible on the public events page. Registration is open." },
            { status: "Live",      dot: "bg-green-500",   desc: "Gathering is happening now. A green Live banner appears on the site. The projection display and control panel activate." },
            { status: "Past",      dot: "bg-charcoal/30", desc: "Registration closes. A 'Session has ended' pill shows on the public page." },
            { status: "Cancelled", dot: "bg-red-400",     desc: "Shows a cancellation notice. Registrations are preserved for records." },
          ].map(({ status, dot, desc }) => (
            <div key={status} className="flex items-start gap-3">
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
              <div>
                <span className="font-semibold text-charcoal">{status}</span>
                <span className="text-charcoal/50"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gold/8 border border-gold/20 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Day-of workflow</p>
          <p className="text-xs text-charcoal/60">Morning → confirm Published. 30 min before → set to <strong>Live</strong>. After the night → set to <strong>Past</strong>.</p>
        </div>
      </div>
    ),
  },
  {
    id:    "creating-event",
    icon:  Calendar,
    title: "Creating & editing an event",
    color: "bg-blue-50 text-blue-600",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>Go to <strong>Events → New event</strong>. Each event has four tabs:</p>

        <div className="space-y-3 pl-1">
          <Step n={1} title="Details tab">
            Core fields: title, date/time, venue, status, description, theme title + scripture, dress code. The <strong>Cover image</strong> section uploads to Supabase Storage on file selection.
          </Step>
          <Step n={2} title="Program tab">
            Add sections (worship, prayer, teaching, etc.) and drag to reorder. Inside each section, add songs with title, artist, and lyrics. Lyrics split into verses by blank lines — each verse advances one step on the projection display.
          </Step>
          <Step n={3} title="Registrants tab">
            Real-time list of everyone who has signed up. Filter, search, download CSV or PDF, or share the list by email.
          </Step>
          <Step n={4} title="Tools tab">
            Quick access to: projection display link, check-in link for the door team, QR code, and the comms broadcast panel.
          </Step>
        </div>
      </div>
    ),
  },
  {
    id:    "registration-tickets",
    icon:  Users,
    title: "Registration & tickets",
    color: "bg-purple-50 text-purple-600",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>Visitors register via the modal on the public event page. The compact overlay appears above all other page elements. The form collects name, email or phone, how they heard about the event, their role, and consent preferences.</p>
        <p>After successful registration:</p>
        <ul className="pl-4 list-disc space-y-1">
          <li><strong>Email provided</strong> — a PDF ticket is emailed via Resend. The success screen stays open (no auto-close) with quick links to About, Gallery, and Get Involved.</li>
        </ul>
        <p>The ticket page at <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/ticket/[token]</code> is always publicly accessible and printable.</p>

        <div className="bg-forest/6 border border-forest/15 rounded-xl px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-forest">Support contact on the form</p>
          <p className="text-xs text-charcoal/60">The registration form and success screen both show a WhatsApp and call link for attendees who have trouble signing up or receiving their ticket. The number is set in <code className="bg-charcoal/6 px-1 rounded">lib/constants.ts</code> → <code className="bg-charcoal/6 px-1 rounded">REGISTRATION_SUPPORT_WA</code>.</p>
        </div>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">Duplicate prevention: a second sign-up with the same email for the same event is rejected and the ticket is resent to that email address.</p>
        </div>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50"><strong className="text-charcoal">Resend ticket from admin</strong> — on the Registrants table, every row with an email address has a small send icon. Clicking it immediately re-sends the PDF ticket email to that person. Useful when someone says they never received it.</p>
        </div>
      </div>
    ),
  },
  {
    id:    "program-lyrics",
    icon:  Music,
    title: "Program & lyrics builder",
    color: "bg-green-50 text-green-700",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>The <strong>Program tab</strong> is the set-list builder — a Spotify-like layout with dark draggable cards.</p>

        <div className="space-y-2 pl-1">
          <Step n={1} title="Add sections">
            Click &quot;Add section&quot;. Name it and set the type. Sections appear as dark draggable cards.
          </Step>
          <Step n={2} title="Reorder sections">
            Drag the grip handle (⋮⋮) to reorder. Order saves immediately.
          </Step>
          <Step n={3} title="Add songs">
            Expand a section and click &quot;Add song&quot;. Enter title, artist, and lyrics.
          </Step>
          <Step n={4} title="Edit lyrics">
            Click a song row to expand it. Separate verses with one blank line. The display shows one verse at a time; the worship leader advances them from the control panel.
          </Step>
        </div>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">The same song library is available across all events. When you add a song to a section, you can pick from the library or create a new one.</p>
        </div>
      </div>
    ),
  },
  {
    id:    "library",
    icon:  Images,
    title: "Library",
    color: "bg-amber-50 text-amber-700",
    content: (
      <div className="space-y-4 text-sm text-charcoal/70 leading-relaxed">
        <p>The Library (<strong>sidebar → Library</strong>) is a shared media and content store that spans all events. It has five tabs:</p>

        <div className="space-y-3">
          <div className="border border-mist rounded-xl p-4">
            <p className="text-xs font-semibold text-charcoal mb-1.5">Event Photos</p>
            <p className="text-xs text-charcoal/60 mb-2">Upload and manage photos for each session. These appear in the Gallery scene on the projection display and on the public Gallery page.</p>
            <ul className="text-xs text-charcoal/55 space-y-1 pl-3 list-disc">
              <li>Select an event using the <strong>card picker</strong> at the top. Each card shows the session name, date (Past / Upcoming badge), and — once loaded — the photo count and total storage size for that event.</li>
              <li>Drag photos into the upload zone or click to browse. Multiple files can be queued. JPEG, PNG, or WebP, max 15 MB each.</li>
              <li>Add an optional caption before uploading — it applies to all photos in that batch.</li>
              <li>Each uploaded photo is auto-compressed server-side (max 1200 px wide, 80% JPEG quality, EXIF rotation applied).</li>
              <li>Each photo in the grid shows its file size and pixel dimensions. Click the <strong>↗</strong> icon to open the full-resolution image; click the trash icon to permanently delete it.</li>
            </ul>
          </div>

          <div className="border border-mist rounded-xl p-4">
            <p className="text-xs font-semibold text-charcoal mb-1.5">Songs</p>
            <p className="text-xs text-charcoal/60">A searchable library of all songs used across sessions. Add new songs here or inline when building the program. Songs are reusable — adding a song to Session 03&apos;s program does not duplicate it.</p>
          </div>

          <div className="border border-mist rounded-xl p-4">
            <p className="text-xs font-semibold text-charcoal mb-1.5">Themes</p>
            <p className="text-xs text-charcoal/60">Create and manage reusable themes (title, scripture, description). Themes can be assigned to events from the event details page. The active theme appears on the Theme scene of the projection display and on the attendee live page.</p>
          </div>

          <div className="border border-mist rounded-xl p-4">
            <p className="text-xs font-semibold text-charcoal mb-1.5">Attendee Photos</p>
            <p className="text-xs text-charcoal/60">Attendees can submit their own photos from the live page during the gathering. This tab shows submitted photos pending approval. Approve photos to make them appear in the public gallery; reject to discard.</p>
          </div>

          <div className="border border-mist rounded-xl p-4">
            <p className="text-xs font-semibold text-charcoal mb-1.5">Trivia</p>
            <p className="text-xs text-charcoal/60">Build the question bank used during live trivia rounds. See the <strong>Trivia</strong> section below for the full workflow.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id:    "live-display",
    icon:  Monitor,
    title: "Projection display system",
    color: "bg-charcoal/8 text-charcoal",
    content: (
      <div className="space-y-4 text-sm text-charcoal/70 leading-relaxed">
        <p>Two linked pages that sync in real time via Supabase Realtime (sub-second latency, WebSocket connection):</p>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-[#1b3a2a]/6 rounded-xl p-4">
            <p className="text-xs font-semibold text-forest mb-2 uppercase tracking-wider">Display screen</p>
            <p className="text-xs text-charcoal/60"><code>/live/[slug]/display</code> — open on the laptop connected to the projector. It auto-requests fullscreen. The cursor hides after 3 s of inactivity.</p>
          </div>
          <div className="bg-gold/8 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wider">Control panel</p>
            <p className="text-xs text-charcoal/60"><code>/live/[slug]/control</code> — open on the worship leader&apos;s phone (admin login required). Controls scene, lyrics, feedback projection, and theme.</p>
          </div>
        </div>

        <p className="font-medium text-charcoal text-xs uppercase tracking-wider pt-1">10 scenes available</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            ["Branding",    "Logo + event title + date. Use as guests arrive and between segments."],
            ["Countdown",   "Live countdown to the event start time. Shows 'We're on. Session is live.' once the time passes."],
            ["Now Playing", "Large song title + artist name. Switch here when beginning a song."],
            ["Lyrics",      "Current verse of the active song. Advance verse-by-verse from the control panel."],
            ["Program",     "Tonight's full program — numbered sections for the evening's flow."],
            ["Theme",       "Theme title + scripture + description."],
            ["Prayer",      "Full-screen prompt ('Close your eyes. Be still.' or your custom text)."],
            ["Community",   "Live count of checked-in attendees. Updates in real time as the door team marks people present."],
            ["Gallery",     "Animated image collage — uploaded event photos at various angles. Falls back to nature placeholders if no images are uploaded."],
            ["Custom",      "Push any text you type in the control panel instantly to the screen."],
          ].map(([name, desc]) => (
            <div key={name} className="flex items-start gap-2">
              <ChevronRight size={12} className="text-forest/50 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-charcoal">{name}</span>
                <span className="text-[11px] text-charcoal/50"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2">
          <Zap size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">The ⚡ Panic button on the control panel instantly returns to <strong>Branding</strong> and clears any projected feedback.</p>
        </div>
      </div>
    ),
  },
  {
    id:    "attendee-live-page",
    icon:  Radio,
    title: "Attendee live page",
    color: "bg-green-50 text-green-700",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>Every event has a live companion page at <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]</code> — designed for attendees&apos; phones during the gathering.</p>

        <p>Attendees reach it by:</p>
        <ul className="pl-4 list-disc space-y-1">
          <li>Scanning the QR code shown on the projection screen (control panel → &quot;Show QR code&quot;)</li>
          <li>Opening the link directly: <strong>greenhousews.co.ke/live/session-02</strong></li>
          <li>From a WhatsApp message or Instagram story you&apos;ve shared</li>
        </ul>

        <p>The page shows:</p>
        <ul className="pl-4 list-disc space-y-1">
          <li>The full evening program in expandable sections</li>
          <li>Song lyrics per section — tap a song to expand, tap again to collapse</li>
          <li>Tonight&apos;s theme card (title, scripture, description)</li>
          <li>A feedback form at the bottom</li>
        </ul>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">After an attendee expands two or more sections, a contextual prompt appears nudging them to share a thought. The prompts vary to feel natural, not repetitive.</p>
        </div>
      </div>
    ),
  },
  {
    id:    "feedback",
    icon:  MessageSquare,
    title: "Attendee feedback system",
    color: "bg-blue-50 text-blue-600",
    content: (
      <div className="space-y-4 text-sm text-charcoal/70 leading-relaxed">
        <p>Attendees can submit a message (up to 280 characters) from the live page during the gathering. They can post anonymously or include their name.</p>

        <div className="space-y-2 pl-1">
          <Step n={1} title="Attendees submit">
            Via the feedback form on <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]</code>. Toggle &quot;Post anonymously&quot; on/off. Tap &quot;Send message&quot;. A confirmation replaces the form.
          </Step>
          <Step n={2} title="Control panel receives">
            The worship leader&apos;s control panel polls for new feedback every 10 seconds. Messages appear in a scrollable list under &quot;Attendee feedback&quot;, newest first.
          </Step>
          <Step n={3} title="Project to display">
            Tap the <strong>TV icon</strong> next to any message to send it to the projection screen as a full-screen glass overlay. The message animates in word by word. A gold chip at the top of the control panel confirms what&apos;s currently being shown.
          </Step>
          <Step n={4} title="Dismiss">
            Tap the <strong>✕ icon</strong> next to the currently projected message (or use the ⚡ panic button) to remove it from the display.
          </Step>
        </div>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">Only one message can be projected at a time. Projecting a new one automatically replaces the current overlay on the display.</p>
        </div>
      </div>
    ),
  },
  {
    id:    "gallery-scene",
    icon:  Images,
    title: "Gallery scene",
    color: "bg-amber-50 text-amber-700",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>The Gallery scene shows a full-screen animated image collage — ideal during worship, transitions, or the community segment.</p>

        <p><strong>To use your own images:</strong></p>
        <div className="space-y-2 pl-1">
          <Step n={1} title="Upload photos">
            Go to <strong>Library → Event Photos</strong>. Select the event using the card picker at the top (cards show photo count and total storage size). Drop or browse photos — JPEG, PNG, or WebP up to 15 MB each. Multiple files can be queued at once. Each image is auto-compressed server-side (max 1200 px wide, 80% quality) before storing.
          </Step>
          <Step n={2} title="Activate the scene">
            On the control panel, tap <strong>Gallery</strong> in the scene switcher. The display switches to the collage view with your uploaded photos floating at different angles.
          </Step>
        </div>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">If no images have been uploaded for the event, the gallery falls back to a set of tasteful nature placeholder images automatically.</p>
        </div>
      </div>
    ),
  },
  {
    id:    "check-in",
    icon:  CheckSquare,
    title: "Door check-in",
    color: "bg-blue-50 text-blue-600",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>The check-in system lets the door team mark attendees as present — and add walk-in guests — without needing admin credentials.</p>
        <div className="space-y-2 pl-1">
          <Step n={1} title="Generate check-in link">
            Event&apos;s <strong>Tools tab</strong> → Check-in link panel → <strong>Generate link</strong>.
          </Step>
          <Step n={2} title="Share with door team">
            Copy the URL or tap WhatsApp share. The link is valid until you regenerate it.
          </Step>
          <Step n={3} title="Mark attendees present">
            Door team opens the link on their phones. No login required. Full registrant list with &quot;Mark Present&quot; per row. Search and filter work in real time. Multiple devices sync live.
          </Step>
          <Step n={4} title="Add walk-in guests">
            Tap <strong>&quot;Add walk-in attendee&quot;</strong> at the top of the check-in list. Enter first name, last name, and optionally phone. They are added to the attendee list and marked present immediately. Walk-in records appear with a gold &quot;Walk-in&quot; badge.
          </Step>
        </div>

        <div className="bg-forest/6 border border-forest/15 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-forest mb-1">Community scene + check-in</p>
          <p className="text-xs text-charcoal/60">The Community display scene shows the <strong>checked-in count</strong> (not total registrations). It updates live as the door team marks people present — including walk-ins. This means the number on the projector reflects who&apos;s actually in the room.</p>
        </div>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">If the link is compromised, click &quot;Regenerate token&quot; — the old URL immediately stops working.</p>
        </div>
      </div>
    ),
  },
  {
    id:    "comms",
    icon:  MessageSquare,
    title: "Communications",
    color: "bg-pink-50 text-pink-600",
    content: (
      <div className="space-y-4 text-sm text-charcoal/70 leading-relaxed">

        <div>
          <p className="font-medium text-charcoal mb-1">Sending a broadcast</p>
          <p>Open <strong>Send broadcast</strong> from the Comms page header or an event&apos;s Tools tab. The dialog has:</p>
          <ul className="pl-4 list-disc space-y-1 mt-1">
            <li><strong>Event</strong> — dropdown to pick which event&apos;s registrant list to message.</li>
            <li><strong>Channel</strong> — button toggle: <strong>Email</strong> or <strong>WhatsApp</strong>. Email shows a Subject field; WhatsApp does not.</li>
            <li><strong>Send to</strong> — button toggle: <strong>All registrants</strong> (everyone on that event&apos;s list) or <strong>Opted-in only</strong> (registrants who ticked &ldquo;Keep me updated&rdquo; at sign-up). Use &quot;Opted-in only&quot; for ongoing news and community updates; use &quot;All registrants&quot; for event-specific announcements like a venue change.</li>
            <li>Write the message, then tap <strong>Send message</strong>. A green banner confirms how many recipients were reached; red if something failed.</li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-charcoal mb-1">Automatic post-event emails</p>
          <p>A cron job runs after each event ends and sends two batches automatically — no manual action needed:</p>
          <ul className="pl-4 list-disc space-y-1 mt-1">
            <li><strong>Thank-you email</strong> — sent to every registrant who was checked in as present.</li>
            <li><strong>Missed-you email</strong> — sent to registrants who were not checked in. Encourages them to join the next session.</li>
          </ul>
          <p>Both are logged in the Comms log with status and timestamps. The event is marked <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">post_event_email_sent = true</code> once both batches complete, so they are never sent twice.</p>
        </div>

        <div>
          <p className="font-medium text-charcoal mb-1">Message log</p>
          <p>The Comms page shows a scrollable, filterable table of every message ever sent — automatic or manual.</p>
          <ul className="pl-4 list-disc space-y-1 mt-1">
            <li><strong>Channel tabs</strong> at the top — All / Email / WhatsApp — with live counts.</li>
            <li><strong>Status dropdown</strong> — filter to Sent, Failed, or Pending.</li>
            <li><strong>Event dropdown</strong> — filter by a specific event title.</li>
            <li>20 rows per page with Previous / Next pagination. Total result count shown in the footer.</li>
            <li>Table header sticks to the top and casts a shadow once you scroll.</li>
          </ul>
        </div>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">Individual ticket emails are sent automatically on registration and are also logged here. Use broadcasts for event-wide announcements: venue change, session start reminder, post-event community update.</p>
        </div>
      </div>
    ),
  },
  {
    id:    "qr",
    icon:  QrCode,
    title: "QR code & sharing",
    color: "bg-charcoal/6 text-charcoal/60",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>Two distinct QR codes exist for each event:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <ChevronRight size={12} className="text-forest/50 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs font-semibold text-charcoal">Event QR (Tools tab)</span>
              <span className="text-[11px] text-charcoal/50"> — links to <code>/events/[slug]</code>. Use on flyers and social media to drive pre-event registration.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ChevronRight size={12} className="text-forest/50 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs font-semibold text-charcoal">Live QR (display screen)</span>
              <span className="text-[11px] text-charcoal/50"> — links to <code>/live/[slug]</code>. Shown on the projector during the gathering. Attendees scan to follow the program, read lyrics, and drop feedback — all on their phones.</span>
            </div>
          </div>
        </div>
        <p>Show the live QR via the control panel → &quot;Show QR code on display&quot;. It appears in the bottom-right corner over whatever scene is active.</p>
      </div>
    ),
  },
  {
    id:    "settings",
    icon:  Settings2,
    title: "Site settings",
    color: "bg-off-white text-charcoal/60",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>Super Admin only. Found at <strong>System → Settings</strong>.</p>
        <ul className="pl-4 list-disc space-y-1">
          <li><strong>Site Identity</strong> — site name and tagline used in email footers.</li>
          <li><strong>Contact</strong> — the contact email and WhatsApp number for broadcast messages.</li>
          <li><strong>Social Links</strong> — Instagram, Twitter/X, Facebook shown in the public footer.</li>
          <li><strong>Platform Behaviour</strong> — global registration toggle, default event capacity.</li>
        </ul>
        <p>All values live in the <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">site_settings</code> table. Changes are immediate — no redeploy needed.</p>
      </div>
    ),
  },
  {
    id:    "system",
    icon:  Shield,
    title: "System & maintenance",
    color: "bg-red-50 text-red-500",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>Super Admin only. Under the <strong>System</strong> section in the sidebar.</p>
        <div className="space-y-2">
          {[
            ["Logs",     "Full audit trail — email sends, WhatsApp messages, cron runs, auth events, errors. Filterable by level and category."],
            ["Trash",    "Soft-deleted records (events, sessions, songs, registrations). Click Restore to recover. The UI never permanently deletes data."],
            ["Admins",   "Add/remove admin accounts, promote to super_admin or demote."],
            ["Settings", "Global configuration — see above."],
          ].map(([name, desc]) => (
            <div key={name} className="flex items-start gap-3">
              <ChevronRight size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-charcoal">{name}</span>
                <span className="text-[11px] text-charcoal/50"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
        <p>The <strong>keep-alive cron</strong> runs daily at 6 am EAT via Vercel Cron to prevent the Supabase free-tier database from pausing. Verify it&apos;s firing in the Logs page.</p>
      </div>
    ),
  },
  {
    id:    "full-journey",
    icon:  Radio,
    title: "Full admin journey — gathering night",
    color: "bg-forest/10 text-forest",
    content: (
      <div className="space-y-4 text-sm text-charcoal/70 leading-relaxed">
        <p className="font-medium text-charcoal">End-to-end checklist for a gathering night.</p>

        <div className="space-y-4">
          <JourneyPhase title="2–4 weeks before" color="border-gold/40">
            <JourneyStep done>Create event → status: <strong>Draft</strong>.</JourneyStep>
            <JourneyStep done>Fill in details: title, date, venue, theme, dress code.</JourneyStep>
            <JourneyStep done>Upload cover image + any gallery photos.</JourneyStep>
            <JourneyStep done>Build the program: sections and songs with lyrics.</JourneyStep>
            <JourneyStep done>Change status to <strong>Published</strong> when ready for sign-ups.</JourneyStep>
            <JourneyStep done>Share the event link and QR on social / WhatsApp.</JourneyStep>
          </JourneyPhase>

          <JourneyPhase title="Day of the gathering" color="border-forest/40">
            <JourneyStep>Confirm all event details are accurate.</JourneyStep>
            <JourneyStep>Generate the check-in link (Tools tab) and share with the door team.</JourneyStep>
            <JourneyStep>Open <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]/display</code> on the projector laptop and enter fullscreen.</JourneyStep>
            <JourneyStep>Open <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]/control</code> on the worship leader&apos;s phone.</JourneyStep>
            <JourneyStep>Tap <strong>Initialise display</strong> on the control panel if prompted.</JourneyStep>
            <JourneyStep>Set display to <strong>Branding</strong> or <strong>Countdown</strong> as guests arrive.</JourneyStep>
            <JourneyStep>Change event status to <strong>Live</strong> when the gathering begins.</JourneyStep>
          </JourneyPhase>

          <JourneyPhase title="During the gathering" color="border-blue-300">
            <JourneyStep>Switch scenes: Branding → Countdown → Now Playing → Lyrics → Program → Theme → Prayer → Community → Gallery → Custom.</JourneyStep>
            <JourneyStep>Select a song from the dropdown before switching to Now Playing or Lyrics. Use Prev / Next to advance verses.</JourneyStep>
            <JourneyStep>Show the QR code on screen (control → QR toggle) so attendees can follow along on their phones.</JourneyStep>
            <JourneyStep>Check the feedback panel — project compelling messages or questions to the display as the discussion unfolds.</JourneyStep>
            <JourneyStep>Door team marks attendees present and adds walk-ins via the check-in link.</JourneyStep>
            <JourneyStep>Switch to Community scene to show the live in-room count.</JourneyStep>
            <JourneyStep>⚡ Panic button instantly returns to Branding if anything unexpected appears.</JourneyStep>
          </JourneyPhase>

          <JourneyPhase title="After the gathering" color="border-charcoal/20">
            <JourneyStep>Change event status to <strong>Past</strong>.</JourneyStep>
            <JourneyStep>The post-event email cron runs automatically — a thank-you to checked-in attendees and a missed-you to absentees. No action needed; check the Comms log to confirm delivery.</JourneyStep>
            <JourneyStep>Upload session photos via <strong>Library → Event Photos</strong> for the gallery and next session&apos;s display.</JourneyStep>
            <JourneyStep>Download registrant CSV / PDF from the Registrants tab.</JourneyStep>
            <JourneyStep>Send any additional broadcast from Tools → Comms (community update, next session teaser, etc.).</JourneyStep>
            <JourneyStep>Review attendance rate on the Dashboard.</JourneyStep>
          </JourneyPhase>
        </div>
      </div>
    ),
  },
  {
    id:    "trivia",
    icon:  Sparkles,
    title: "Trivia — live interactive questions",
    color: "bg-amber-50 text-amber-700",
    content: (
      <div className="space-y-4 text-sm text-charcoal/70 leading-relaxed">
        <p>
          Trivia lets you run live interactive question rounds during a session. Attendees answer on their phones via the live page — no extra app or account needed. The projection display shows the question, a real-time response count, and a QR code to invite latecomers to join.
        </p>

        <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-amber-700">Two question types</p>
          <ul className="text-xs text-charcoal/60 space-y-1 pl-3 list-disc">
            <li><strong className="text-charcoal">Multiple choice</strong> — 2–4 options, one marked as correct. Results shown as percentage bars on reveal. Attendees see if they got it right.</li>
            <li><strong className="text-charcoal">Open response</strong> — Free-text input. No right/wrong — good for reflections, opinions, or ice-breakers.</li>
          </ul>
        </div>

        <div className="space-y-3 pl-1">
          <Step n={1} title="Build your question library">
            Go to <strong>Library → Trivia</strong>. Click <strong>New question</strong>. Write the question, choose a type, add options (MC), mark the correct answer by tapping the letter, set a category and point value, and optionally add a hint. Questions are reusable across all events.
          </Step>
          <Step n={2} title="Launch a round during the event">
            Open the <strong>control panel</strong> on your phone. Scroll to the <strong>Trivia</strong> section. Pick a question from the dropdown. Optionally set a countdown timer (30 s – 2 min). Tap <strong>Launch</strong>. The display switches instantly to the Trivia scene and the attendee live page shows the question card.
          </Step>
          <Step n={3} title="Attendees answer">
            Attendees on the live page (<code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]</code>) see a dark interactive card slide in at the top. They can optionally enter their name (stored on-device for the session — no re-typing for the next round). For MC, they tap an option and press <strong>Lock in answer</strong>. For open response, they type and submit.
          </Step>
          <Step n={4} title="Reveal the answer">
            When you&apos;re ready, tap <strong>Reveal answer</strong> on the control panel. The display animates the correct option (glows green), shows percentage bars for all choices, and displays how many got it right. Attendees on their phones see whether they were correct with a celebration or sympathetic animation.
          </Step>
          <Step n={5} title="End the round">
            Tap <strong>End round</strong>. The display returns to Branding and the trivia card disappears from the attendee page. You can launch another question immediately.
          </Step>
        </div>

        <div className="bg-forest/6 border border-forest/15 rounded-xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-forest">Tips</p>
          <ul className="text-xs text-charcoal/60 space-y-1 pl-3 list-disc">
            <li>Use trivia during transitions — between worship sets, before the teaching, or as an ice-breaker while guests arrive.</li>
            <li>The <strong>Community category</strong> questions build connection (e.g., &quot;What one word describes tonight?&quot;).</li>
            <li>The <strong>Scripture category</strong> works well paired with the theme — quiz people on the key verse.</li>
            <li>Attendee names are remembered in their browser for the full session — they only need to type once.</li>
            <li>Only one round can be active at a time. Launching a new round automatically closes any open one.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id:    "design-system",
    icon:  Palette,
    title: "Design system & brand guide",
    color: "bg-gold/10 text-amber-700",
    content: (
      <div className="space-y-6 text-sm text-charcoal/70 leading-relaxed">

        <p>Use this guide when creating posters, social media graphics, slides, or any visual material for The Green House. Consistency makes the brand instantly recognisable across sessions.</p>

        {/* ── Colour palette ── */}
        <div>
          <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">Colour palette</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: "Forest",     hex: "#1b3a2a", css: "--forest",     usage: "Primary green — headlines, buttons, backgrounds",    dark: true },
              { name: "Gold",       hex: "#c9a24a", css: "--gold",       usage: "Accent — decorative lines, highlights, active states", dark: false },
              { name: "Moss",       hex: "#2d5240", css: "--moss",       usage: "Secondary green — hover states, gradients",           dark: true },
              { name: "Sage",       hex: "#4e7a5e", css: "--sage",       usage: "Mid-tone green — supporting elements",                dark: true },
              { name: "Cream",      hex: "#f7f2e8", css: "--cream",      usage: "Background / text on dark — never use pure white",    dark: false },
              { name: "Charcoal",   hex: "#1a1a18", css: "--charcoal",   usage: "Body text — use instead of pure black",               dark: true },
              { name: "Gold Light", hex: "#e4c97e", css: "--gold-light", usage: "Softer gold — secondary accents, divider lines",      dark: false },
              { name: "Gold Pale",  hex: "#f5edce", css: "--gold-pale",  usage: "Very faint gold tint — section backgrounds",          dark: false },
              { name: "Bark",       hex: "#5c4a35", css: "--bark",       usage: "Warm brown — earthy details, occasional text",        dark: true },
            ].map(({ name, hex, css, usage, dark }) => (
              <div key={hex} className="rounded-xl overflow-hidden border border-mist">
                <div
                  className="h-12 w-full flex items-end px-2.5 pb-1.5"
                  style={{ backgroundColor: hex }}
                >
                  <span className={`text-[9px] font-mono font-bold ${dark ? "text-white/60" : "text-black/40"}`}>{hex}</span>
                </div>
                <div className="px-2.5 py-2 bg-white">
                  <p className="text-[11px] font-semibold text-charcoal">{name}</p>
                  <p className="text-[9px] font-mono text-charcoal/40 mt-0.5">{css}</p>
                  <p className="text-[10px] text-charcoal/50 mt-1 leading-snug">{usage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Typography ── */}
        <div>
          <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">Typography</p>
          <div className="space-y-3">
            <div className="border border-mist rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-charcoal mb-1">Cormorant Garamond — Display / Headings</p>
                  <p className="text-xs text-charcoal/50 mb-3">Elegant, high-contrast serif. Use for event titles, section headings, hero text, pull quotes, and poster headlines. Feels timeless and warm.</p>
                  <p className="font-display text-4xl font-light text-charcoal leading-none">The Green House</p>
                  <p className="font-display text-xl font-semibold text-charcoal/60 italic mt-1">Session 02 — Delusion</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-mist grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-charcoal/50">
                <div><span className="font-display font-light text-charcoal text-sm">Light 300</span> — large text</div>
                <div><span className="font-display font-normal text-charcoal text-sm">Regular 400</span> — subheads</div>
                <div><span className="font-display font-semibold text-charcoal text-sm">Semi 600</span> — titles</div>
                <div><span className="font-display font-bold italic text-charcoal text-sm">Bold Italic</span> — emphasis</div>
              </div>
            </div>
            <div className="border border-mist rounded-xl p-4">
              <div>
                <p className="text-xs font-semibold text-charcoal mb-1">DM Sans — Body / UI</p>
                <p className="text-xs text-charcoal/50 mb-3">Clean, geometric sans-serif. Use for body text, captions, labels, buttons, and all UI elements. Highly legible at small sizes.</p>
                <p className="text-charcoal text-base font-normal leading-relaxed">A cross-church worship community in Nairobi — quarterly gatherings for real connection.</p>
                <p className="text-charcoal/50 text-xs font-medium uppercase tracking-widest mt-2">Section Label · Event Name · Caption Text</p>
              </div>
              <div className="mt-3 pt-3 border-t border-mist grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-charcoal/50">
                <div><span className="font-medium text-charcoal text-sm">Light 300</span> — captions</div>
                <div><span className="font-medium text-charcoal text-sm">Regular 400</span> — body</div>
                <div><span className="font-semibold text-charcoal text-sm">Medium 500</span> — labels</div>
                <div><span className="font-bold text-charcoal text-sm">Bold 700</span> — buttons</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Poster guide ── */}
        <div>
          <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">Poster & social graphics guide</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-forest/6 border border-forest/15 rounded-xl p-4">
              <p className="text-xs font-semibold text-forest mb-2">✓ Do</p>
              <ul className="text-xs text-charcoal/65 space-y-1.5 pl-3 list-disc">
                <li>Use <strong>Forest (#1b3a2a)</strong> or <strong>Charcoal (#1a1a18)</strong> as the primary background — they feel warm and intentional, not generic.</li>
                <li>Use <strong>Gold (#c9a24a)</strong> sparingly as an accent — a single line, a date chip, or a divider. Don&apos;t fill with it.</li>
                <li>Use <strong>Cormorant Garamond</strong> for the event name and theme — it&apos;s what makes the brand feel distinct.</li>
                <li>Use <strong>Cream (#f7f2e8)</strong> for text on dark backgrounds — never pure white (#ffffff).</li>
                <li>Add a subtle grain texture or dot-grid overlay at 5–8% opacity to give depth.</li>
                <li>Include: event name, date, time, venue, and registration link or QR code.</li>
                <li>Keep the layout minimal — one bold headline, supporting details small.</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-600 mb-2">✕ Avoid</p>
              <ul className="text-xs text-charcoal/65 space-y-1.5 pl-3 list-disc">
                <li>Bright or saturated colours not in the palette (neon greens, electric blues) — they break the aesthetic.</li>
                <li>Pure black (#000000) or pure white (#ffffff) backgrounds — use Forest or Cream instead.</li>
                <li>Too many fonts — stick to Cormorant Garamond for headings and DM Sans for everything else.</li>
                <li>Cluttered layouts with too much text — let the design breathe.</li>
                <li>Low-contrast text — dark text on dark background, or light text on light background.</li>
                <li>Misaligned or inconsistent logo placement — logo should always be clearly readable.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Colour combos ── */}
        <div>
          <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">Recommended colour combinations</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { bg: "#1b3a2a", text: "#f7f2e8", accent: "#c9a24a", label: "Forest + Cream + Gold",  note: "Primary — most posters"        },
              { bg: "#1a1a18", text: "#f7f2e8", accent: "#c9a24a", label: "Charcoal + Cream + Gold", note: "Strong, bold events"            },
              { bg: "#f7f2e8", text: "#1b3a2a", accent: "#c9a24a", label: "Cream + Forest + Gold",   note: "Light variant — daytime events" },
            ].map(({ bg, text, accent, label, note }) => (
              <div key={label} className="rounded-xl overflow-hidden border border-mist">
                <div className="h-20 px-3 py-2.5 flex flex-col justify-between" style={{ backgroundColor: bg }}>
                  <span className="font-display text-xl font-semibold leading-none" style={{ color: text }}>The Green</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: accent }}>House · Session</span>
                </div>
                <div className="px-3 py-2 bg-white">
                  <p className="text-[11px] font-semibold text-charcoal">{label}</p>
                  <p className="text-[10px] text-charcoal/45 mt-0.5">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CSS variables reference ── */}
        <div className="bg-charcoal/4 rounded-xl p-4">
          <p className="text-xs font-semibold text-charcoal mb-2">CSS variables (for developers)</p>
          <div className="font-mono text-[11px] text-charcoal/60 grid grid-cols-2 gap-x-6 gap-y-0.5">
            {[
              ["--forest",     "#1b3a2a"],
              ["--moss",       "#2d5240"],
              ["--sage",       "#4e7a5e"],
              ["--sage-light", "#7fa98a"],
              ["--gold",       "#c9a24a"],
              ["--gold-light", "#e4c97e"],
              ["--gold-pale",  "#f5edce"],
              ["--cream",      "#f7f2e8"],
              ["--charcoal",   "#1a1a18"],
              ["--bark",       "#5c4a35"],
            ].map(([v, h]) => (
              <div key={v} className="flex gap-2">
                <span className="text-charcoal/40">{v}:</span>
                <span className="text-charcoal">{h}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    ),
  },
  {
    id:    "deployment",
    icon:  Rocket,
    title: "Deployment & setup guide",
    color: "bg-indigo-50 text-indigo-600",
    content: (
      <div className="space-y-5 text-sm text-charcoal/70 leading-relaxed">

        <DeploySection
          n={1}
          icon={Mail}
          title="Verify your sending domain in Resend"
          subtitle="Required before registration emails will deliver"
        >
          <div className="space-y-2">
            <p>You have a Resend API key. Now verify the domain so emails arrive from <em>@greenhousews.co.ke</em> and don&apos;t land in spam.</p>
            <div className="space-y-1.5 pl-1">
              <Step n={1} title="Go to resend.com/domains">Click &quot;Add Domain&quot; and enter <strong>greenhousews.co.ke</strong>.</Step>
              <Step n={2} title="Copy the DNS records">Resend gives you 3–4 records: an MX record, a DKIM TXT, and an SPF TXT.</Step>
              <Step n={3} title="Add them at your registrar">Open your domain registrar (e.g. Namecheap, GoDaddy, or wherever you bought the domain). Go to DNS settings and add each record exactly as shown.</Step>
              <Step n={4} title="Click Verify in Resend">DNS propagates in 15 min – 48 hours. Once verified, status turns green. Send a test email to confirm delivery.</Step>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-amber-700">Your <code>RESEND_FROM_EMAIL</code> in Vercel env vars must use your verified domain: <code>The Green House &lt;hello@greenhousews.co.ke&gt;</code></p>
            </div>
          </div>
        </DeploySection>

        <DeploySection
          n={2}
          icon={Server}
          title="Push code to GitHub"
          subtitle="Vercel auto-deploys from your repo on every push"
        >
          <div className="space-y-1.5 pl-1">
            <Step n={1} title="Create a GitHub repo">Go to github.com → New repository. Name it <strong>greenhouse-website</strong> (or similar). Keep it private.</Step>
            <Step n={2} title="Push the project">
              <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded block mt-1">
                git remote add origin https://github.com/your-org/greenhouse-website.git{"\n"}
                git push -u origin main
              </code>
            </Step>
          </div>
        </DeploySection>

        <DeploySection
          n={3}
          icon={Globe}
          title="Deploy on Vercel"
          subtitle="One-click deploy with automatic HTTPS and CDN"
        >
          <div className="space-y-2">
            <div className="space-y-1.5 pl-1">
              <Step n={1} title="Import project">Go to vercel.com → New Project → Import Git Repository. Select your repo. Framework is auto-detected as Next.js.</Step>
              <Step n={2} title="Add environment variables">Before clicking Deploy, expand &quot;Environment Variables&quot; and add all of the following:</Step>
            </div>
            <div className="bg-charcoal/4 rounded-xl p-3 font-mono text-[11px] text-charcoal/70 space-y-1">
              <p>NEXT_PUBLIC_SUPABASE_URL=https://eperecxwzmxsoiudkucb.supabase.co</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=<span className="text-charcoal/40">[your anon key]</span></p>
              <p>SUPABASE_SERVICE_ROLE_KEY=<span className="text-charcoal/40">[your service role key]</span></p>
              <p>NEXT_PUBLIC_SITE_URL=https://greenhousews.co.ke</p>
              <p>RESEND_API_KEY=<span className="text-charcoal/40">[your Resend key]</span></p>
              <p>RESEND_FROM_EMAIL=The Green House &lt;hello@greenhousews.co.ke&gt;</p>
              <p>CRON_SECRET=<span className="text-charcoal/40">[generate a strong random string]</span></p>
              <p>TWILIO_ACCOUNT_SID=<span className="text-charcoal/40">[from Twilio console]</span></p>
              <p>TWILIO_AUTH_TOKEN=<span className="text-charcoal/40">[from Twilio console]</span></p>
              <p>TWILIO_WHATSAPP_FROM=whatsapp:+14155238886</p>
            </div>
            <div className="space-y-1.5 pl-1">
              <Step n={3} title="Deploy">Click Deploy. Vercel builds and serves the site. Note the *.vercel.app URL — this is your staging URL.</Step>
              <Step n={4} title="Add your custom domain">Project Settings → Domains → Add Domain → enter <strong>greenhousews.co.ke</strong>. Follow the instructions to add a CNAME/A record at your registrar. HTTPS is automatic.</Step>
              <Step n={5} title="Update NEXT_PUBLIC_SITE_URL">Once the domain resolves, update the <code>NEXT_PUBLIC_SITE_URL</code> env var in Vercel to <code>https://greenhousews.co.ke</code> (no trailing slash). Trigger a redeploy.</Step>
            </div>
          </div>
        </DeploySection>

        <DeploySection
          n={4}
          icon={Shield}
          title="Configure Supabase auth for production"
          subtitle="Allows admin login from your live domain"
        >
          <div className="space-y-1.5 pl-1">
            <Step n={1} title="Open Supabase project">supabase.com → your project → Authentication → URL Configuration.</Step>
            <Step n={2} title="Add redirect URLs">
              Under &quot;Redirect URLs&quot;, add:<br />
              <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">https://greenhousews.co.ke/auth/callback</code><br />
              <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">https://your-project.vercel.app/auth/callback</code>
            </Step>
            <Step n={3} title="Set Site URL">In the same section, set <strong>Site URL</strong> to <code>https://greenhousews.co.ke</code>.</Step>
          </div>
        </DeploySection>

        <DeploySection
          n={5}
          icon={Server}
          title="Verify the keep-alive cron"
          subtitle="Prevents the free-tier database from pausing"
        >
          <div className="space-y-2">
            <p>The <code>vercel.json</code> already configures a daily cron at 3 am UTC (6 am EAT) that hits <code>/api/cron/keep-alive</code>.</p>
            <p>After deploy: Vercel Dashboard → your project → Cron Jobs tab. Confirm the job is listed. After the first 6 am EAT trigger, go to Admin → System → Logs and verify a &quot;cron.keep_alive&quot; entry appears.</p>
          </div>
        </DeploySection>

        <DeploySection
          n={6}
          icon={SearchCode}
          title="Submit to Google Search Console"
          subtitle="Gets your public pages indexed and ranked"
        >
          <div className="space-y-2">
            <div className="space-y-1.5 pl-1">
              <Step n={1} title="Add property">Go to search.google.com/search-console → Add property → URL prefix → enter <code>https://greenhousews.co.ke</code>.</Step>
              <Step n={2} title="Verify ownership — HTML file method">
                Google gives you a file like <code>googleXXXXXX.html</code>. Download it and place it in the project&apos;s <code>/public</code> folder. Push to GitHub — Vercel auto-deploys. Click Verify in Search Console.
              </Step>
              <Step n={3} title="Submit your sitemap">In Search Console → Sitemaps → enter <code>https://greenhousews.co.ke/sitemap.xml</code> → Submit. This tells Google about all your public pages including event detail pages.</Step>
              <Step n={4} title="Request indexing for key pages">
                Go to the URL Inspection tool. Enter each of these URLs and click &quot;Request indexing&quot;:
                <ul className="pl-4 list-disc space-y-0.5 mt-1">
                  <li><code>https://greenhousews.co.ke/</code></li>
                  <li><code>https://greenhousews.co.ke/about</code></li>
                  <li><code>https://greenhousews.co.ke/events</code></li>
                  <li><code>https://greenhousews.co.ke/gallery</code></li>
                  <li><code>https://greenhousews.co.ke/get-involved</code></li>
                  <li>Each published event: <code>/events/session-02</code> etc.</li>
                </ul>
              </Step>
            </div>
            <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
              <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-charcoal/50">Google typically crawls and indexes within a few days of the sitemap submission. The site already has Open Graph tags, JSON-LD structured data on event pages, and a <code>robots.txt</code> that allows the public routes — all good signals for ranking.</p>
            </div>
          </div>
        </DeploySection>

        <DeploySection
          n={7}
          icon={Leaf}
          title="Register in Brightex Dashboard"
          subtitle="Standard across all Brightex projects"
        >
          <p>Once the site is live, add it to the Brightex project dashboard. The <code>/api/health</code> endpoint returns <code>{"{ status: 'ok', project: 'greenhouse' }"}</code> — use it as the health-check URL when registering.</p>
        </DeploySection>

      </div>
    ),
  },
] as const;

/* suppress unused import warnings — BookOpen is used by consumers */
export { BookOpen };
