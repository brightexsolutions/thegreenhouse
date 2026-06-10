/* eslint-disable react/no-unescaped-entities */
import {
  BookOpen, Calendar, Users, MessageSquare, Monitor,
  Music, Settings2, Radio, QrCode, CheckSquare,
  ChevronRight, Info, Leaf, Zap, Shield,
} from "lucide-react";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    id:    "overview",
    icon:  Leaf,
    title: "Platform overview",
    color: "bg-forest/10 text-forest",
    content: (
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>The Green House platform manages the full event lifecycle — from creating a session and opening registration, through the night itself (live projection display, check-in), to post-event follow-up.</p>
        <p>The admin is split into two levels:</p>
        <ul className="space-y-1 pl-4 list-disc">
          <li><strong className="text-charcoal">Admin</strong> — day-to-day operations: events, program, registrants, comms, display control.</li>
          <li><strong className="text-charcoal">Super Admin</strong> — everything above, plus system logs, trash recovery, admin user management, and site settings.</li>
        </ul>
        <p>The database is hosted on Supabase (free tier). A daily keep-alive cron runs at 6 am EAT to prevent the database from pausing.</p>
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
        <p>Every session moves through these stages. Change the status on the event Details tab.</p>

        <div className="space-y-2">
          {[
            { status: "Draft",     dot: "bg-charcoal/30", desc: "Not visible to the public. Work in progress. Safe to experiment." },
            { status: "Published", dot: "bg-gold",        desc: "Visible on the public events page. Registration is open. Set this when you're ready to accept sign-ups." },
            { status: "Live",      dot: "bg-green-500",   desc: "Session is happening right now. A green 'Live' banner appears in the sidebar and on the public event card. The projection display and control panel activate." },
            { status: "Past",      dot: "bg-charcoal/30", desc: "Registration closes. A 'Session has ended' pill shows on the public page. Set this after the night wraps up." },
            { status: "Cancelled", dot: "bg-red-400",     desc: "Shows a cancellation notice on the public page. Registrations are preserved for records." },
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
          <p className="text-xs font-semibold text-amber-700 mb-1">Tip: day-of workflow</p>
          <p className="text-xs text-charcoal/60">Morning of event → change to <strong>Published</strong> if not already. 30 min before → change to <strong>Live</strong> to activate the display and green indicator. After the night → change to <strong>Past</strong>.</p>
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
        <p>Go to <strong>Events → New event</strong>. The event detail page is tabbed:</p>

        <div className="space-y-3 pl-1">
          <Step n={1} title="Details tab">
            Fill in the core fields: title, date/time, venue, status, description. The <strong>Cover image</strong> section at the top uploads directly to Supabase Storage. Add the theme title + scripture and dress code here too.
          </Step>
          <Step n={2} title="Program tab">
            Add sections (worship, prayer, teaching, etc.) and drag to reorder. Inside each section, add songs with title, artist, and lyrics. Lyrics are split into verses by blank lines — each verse advances one step on the projection display.
          </Step>
          <Step n={3} title="Registrants tab">
            Real-time list of everyone who has registered. Filter by attendance, search by name or contact. Download CSV or PDF.
          </Step>
          <Step n={4} title="Tools tab">
            Quick access to the projection display, check-in link (for the door team), QR code, and the comms broadcast panel.
          </Step>
        </div>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">The event form autosaves each section when you tab away. Cover image uploads happen immediately on file selection — no need to submit the form first.</p>
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
        <p>Visitors register via the modal on the public event page. The form collects:</p>
        <ul className="pl-4 list-disc space-y-1">
          <li>First and last name (required)</li>
          <li>Email <em>or</em> phone — at least one required</li>
          <li>How they heard about the event</li>
          <li>Their role (Guest, Vocalist, Vision Carrier, etc.)</li>
          <li>Photo / filming consent</li>
          <li>WhatsApp opt-in for broadcast messages</li>
        </ul>
        <p>After successful registration:</p>
        <ul className="pl-4 list-disc space-y-1">
          <li><strong>Email</strong> — a PDF ticket is attached and emailed via Resend.</li>
          <li><strong>Phone only</strong> — a WhatsApp message with the ticket link is sent via Twilio.</li>
          <li>Both channels receive confirmation if the attendee provides both.</li>
        </ul>
        <p>The ticket page at <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/ticket/[token]</code> is always publicly accessible. It shows a printable ticket card with a reference number.</p>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">Duplicate prevention: a second registration with the same email or phone for the same event is rejected gracefully, and the existing ticket link is resent.</p>
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
        <p>The <strong>Program tab</strong> of any event is the set-list builder. It has a Spotify-like layout:</p>

        <div className="space-y-2 pl-1">
          <Step n={1} title="Add sections">
            Click "Add section". Give it a name (e.g. "Opening Worship") and a type. Sections appear as draggable dark cards.
          </Step>
          <Step n={2} title="Reorder sections">
            Drag the grip handle (⋮⋮) on the left of each card to reorder. Order saves immediately.
          </Step>
          <Step n={3} title="Add songs">
            Expand a section (↓) and click "Add song" inside the dark track list. Enter song title, artist, and optionally paste the full lyrics.
          </Step>
          <Step n={4} title="Edit lyrics">
            Click any song row to expand it. A dark lyrics panel appears — click "Edit" to type. Separate verses/sections with one blank line. The display screen shows one verse at a time.
          </Step>
        </div>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">Lyrics blur-save automatically. During the session, the worship leader advances verses one at a time from their phone via the control panel.</p>
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
        <p>The display system has two linked pages that sync in real time via Supabase Realtime:</p>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-[#1b3a2a]/6 rounded-xl p-4">
            <p className="text-xs font-semibold text-forest mb-2 uppercase tracking-wider">Display screen</p>
            <p className="text-xs text-charcoal/60"><code>/live/[slug]/display</code> — open on a laptop connected to the projector. It auto-enters fullscreen. The cursor hides after 3 seconds. It shows whatever scene the worship leader has selected.</p>
          </div>
          <div className="bg-gold/8 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wider">Control panel</p>
            <p className="text-xs text-charcoal/60"><code>/live/[slug]/control</code> — open on the worship leader's phone. Requires admin login. Use it to switch scenes, advance lyrics, select songs, and push custom text.</p>
          </div>
        </div>

        <p className="font-medium text-charcoal text-xs uppercase tracking-wider pt-1">9 Available scenes</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            ["Branding", "Logo + event title + date. Use before the session starts."],
            ["Countdown", "Live countdown timer to the event_time. Auto-updates every second."],
            ["Now Playing", "Large song title + artist. Switch to this when starting a song."],
            ["Lyrics", "Current verse of the active song. Use the control panel to advance."],
            ["Program", "Full order of service list, numbered."],
            ["Theme", "Theme title + scripture + description."],
            ["Prayer", "Full-screen prompt — defaults to 'Close your eyes. Be still.' or your custom text."],
            ["Community", "Live count of registered attendees from the database."],
            ["Custom", "Push any text you type in the control panel instantly to the screen."],
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
          <p className="text-xs text-red-600">Panic button on the control panel instantly returns to <strong>Branding</strong> if something unexpected appears on screen.</p>
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
        <p>The check-in system lets the door team mark attendees as present without needing admin login credentials.</p>
        <div className="space-y-2 pl-1">
          <Step n={1} title="Generate check-in link">
            Go to the event's <strong>Tools tab</strong> → "Check-in link" panel. Click <strong>Generate link</strong>. A unique URL is created.
          </Step>
          <Step n={2} title="Share with door team">
            Copy the link or tap the WhatsApp share button. The link is valid until you regenerate it.
          </Step>
          <Step n={3} title="Door team use">
            The door team opens the link on their phones. No login required. They see the full registrant list with a "Mark Present" button per person. Search and filter work in real time.
          </Step>
          <Step n={4} title="Multiple devices">
            Several door team members can use the same link simultaneously — all their views sync live via Supabase Realtime. One person marking someone as present immediately reflects on all other screens.
          </Step>
        </div>
        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">If the link is compromised, click "Regenerate token" in the Tools tab. The old URL immediately stops working.</p>
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
      <div className="space-y-3 text-sm text-charcoal/70 leading-relaxed">
        <p>Send bulk emails or WhatsApp messages to registrants from the event's <strong>Tools tab</strong> or from the global <strong>Comms</strong> page.</p>
        <ul className="pl-4 list-disc space-y-1">
          <li>Choose channel: Email or WhatsApp</li>
          <li>Choose scope: All registrants, or WhatsApp opt-ins only</li>
          <li>Write the message — preview before sending</li>
          <li>All sends are logged to the communications log</li>
        </ul>
        <p>Individual ticket emails are sent automatically on registration. The comms broadcast is for announcements like "Venue change — we've moved to X" or "Session starts in 30 minutes!".</p>
        <p>The <strong>Comms</strong> page in the main nav shows a log of all emails and WhatsApp messages sent, with status (sent / failed) and timestamps.</p>
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
        <p>Every event has a QR code that links to the public event page. Find it in the event's <strong>Tools tab</strong>.</p>
        <ul className="pl-4 list-disc space-y-1">
          <li>Download the QR as a PNG for printing on flyers or screens</li>
          <li>Copy the public event URL to share directly</li>
          <li>The QR always points to <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/events/[slug]</code></li>
        </ul>
        <p>The live page QR (<code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]</code>) can be shown on the projection screen for attendees to access the program and lyrics on their phones during the session.</p>
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
          <li><strong>Site Identity</strong> — site name and tagline used in email footers and meta tags.</li>
          <li><strong>Contact</strong> — the contact email (used in confirmation emails) and WhatsApp number (used for broadcast messages).</li>
          <li><strong>Social Links</strong> — Instagram handle, Twitter/X handle, Facebook URL shown in the public footer.</li>
          <li><strong>Platform Behaviour</strong> — global registration open/closed toggle, default capacity for new events.</li>
        </ul>
        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">Changes are applied globally and immediately — no deploy needed. All values are stored in the <code>site_settings</code> table in Supabase.</p>
        </div>
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
        <p>Super Admin only. Available under the <strong>System</strong> section in the sidebar.</p>
        <div className="space-y-2">
          {[
            ["Logs", "Full audit trail — email sends, WhatsApp messages, cron job runs, auth events, errors. Filterable by level (info / warn / error) and category."],
            ["Trash", "Soft-deleted records: events, sessions, songs, registrations. Click Restore to recover any item. Soft deletes are the only kind — the UI never permanently deletes data."],
            ["Admins", "Add new admin accounts, remove existing ones, promote/demote between admin and super_admin roles."],
            ["Settings", "Global site configuration — see above."],
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
        <p>The <strong>keep-alive cron</strong> runs daily at 6 am EAT via Vercel Cron. It pings the database with a lightweight query to prevent the Supabase free tier from pausing after 7 days of inactivity. Check the Logs page to confirm it's running.</p>
      </div>
    ),
  },
  {
    id:    "full-journey",
    icon:  Radio,
    title: "Full admin journey — session night",
    color: "bg-forest/10 text-forest",
    content: (
      <div className="space-y-4 text-sm text-charcoal/70 leading-relaxed">
        <p className="font-medium text-charcoal">End-to-end checklist for a session night.</p>

        <div className="space-y-4">
          <JourneyPhase title="2–4 weeks before" color="border-gold/40">
            <JourneyStep done>Create event (Events → New event). Status: <strong>Draft</strong>.</JourneyStep>
            <JourneyStep done>Fill in all details: title, date, venue, theme, dress code, description.</JourneyStep>
            <JourneyStep done>Upload cover image.</JourneyStep>
            <JourneyStep done>Build the program in the Program tab. Add sections and songs.</JourneyStep>
            <JourneyStep done>Add lyrics to every song (one blank line per verse break).</JourneyStep>
            <JourneyStep done>Change status to <strong>Published</strong> when ready to open registration.</JourneyStep>
            <JourneyStep done>Share the public event link and QR code on social media / WhatsApp.</JourneyStep>
          </JourneyPhase>

          <JourneyPhase title="Day of the session" color="border-forest/40">
            <JourneyStep>Confirm venue details are accurate on the event Details tab.</JourneyStep>
            <JourneyStep>Generate the check-in link (Tools tab) and share with the door team.</JourneyStep>
            <JourneyStep>Open <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]/display</code> on the projector laptop and enter fullscreen.</JourneyStep>
            <JourneyStep>Open <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]/control</code> on the worship leader's phone.</JourneyStep>
            <JourneyStep>Tap <strong>Initialise display</strong> on the control panel if prompted.</JourneyStep>
            <JourneyStep>Set display to <strong>Branding</strong> or <strong>Countdown</strong> as guests arrive.</JourneyStep>
            <JourneyStep>Change event status to <strong>Live</strong> when the session begins.</JourneyStep>
          </JourneyPhase>

          <JourneyPhase title="During the session" color="border-blue-300">
            <JourneyStep>Use scene switcher to navigate: Branding → Countdown → Now Playing → Lyrics → Program → Theme → Prayer → Community → Custom.</JourneyStep>
            <JourneyStep>Select a song from the dropdown before switching to Now Playing or Lyrics.</JourneyStep>
            <JourneyStep>Use Prev / Next buttons to advance through verses.</JourneyStep>
            <JourneyStep>Tap the ⚡ Panic button to immediately return to Branding if anything goes wrong.</JourneyStep>
            <JourneyStep>Door team marks attendees present on their phones via the check-in link.</JourneyStep>
          </JourneyPhase>

          <JourneyPhase title="After the session" color="border-charcoal/20">
            <JourneyStep>Change event status to <strong>Past</strong>.</JourneyStep>
            <JourneyStep>Download the registrant CSV / PDF from the Registrants tab.</JourneyStep>
            <JourneyStep>Send a thank-you broadcast from the Tools tab → Comms.</JourneyStep>
            <JourneyStep>Review attendance rate on the Dashboard.</JourneyStep>
          </JourneyPhase>
        </div>
      </div>
    ),
  },
] as const;

export default function AdminDocsPage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-forest/8 flex items-center justify-center">
            <BookOpen size={16} className="text-forest" />
          </div>
          <h1 className="text-xl font-semibold text-charcoal">Platform Documentation</h1>
        </div>
        <p className="text-sm text-charcoal/50 ml-12">
          Everything you need to know about running The Green House platform. Covers the full admin journey from creating an event through to post-session wrap-up.
        </p>
      </div>

      {/* Quick nav */}
      <div className="bg-white rounded-2xl border border-mist p-4 mb-8">
        <p className="text-[10px] font-semibold text-charcoal/40 uppercase tracking-wider mb-3">Jump to section</p>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(({ id, title }) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-xs text-charcoal/60 hover:text-forest bg-charcoal/4 hover:bg-forest/8 px-3 py-1.5 rounded-full transition-colors"
            >
              {title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 pb-12">
        {SECTIONS.map(({ id, icon: Icon, title, color, content }) => (
          <div key={id} id={id} className="bg-white rounded-2xl border border-mist overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-mist bg-off-white/50">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={15} />
              </div>
              <h2 className="text-sm font-semibold text-charcoal">{title}</h2>
            </div>
            <div className="px-5 py-4">
              {content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
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

function JourneyPhase({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`border-l-2 pl-4 ${color}`}>
      <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function JourneyStep({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-[12px] text-charcoal/65">
      <span className={`mt-0.5 flex-shrink-0 ${done ? "text-green-500" : "text-charcoal/25"}`}>
        {done ? "✓" : "□"}
      </span>
      <span>{children}</span>
    </div>
  );
}
