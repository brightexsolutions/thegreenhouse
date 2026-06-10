/* eslint-disable react/no-unescaped-entities */
import {
  BookOpen, Calendar, Users, MessageSquare, Monitor,
  Music, Settings2, Radio, QrCode, CheckSquare,
  ChevronRight, Info, Leaf, Zap, Shield, Images,
  Rocket, Globe, Mail, Server, SearchCode,
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
          <li><strong>Email provided</strong> — a PDF ticket is emailed via Resend.</li>
          <li><strong>Phone only</strong> — a WhatsApp message with the ticket link is sent via Twilio.</li>
          <li>Both if the attendee provided both.</li>
        </ul>
        <p>The ticket page at <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/ticket/[token]</code> is always publicly accessible and printable.</p>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">Duplicate prevention: a second sign-up with the same email or phone for the same event is rejected and the existing ticket link is resent.</p>
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
            Click "Add section". Name it and set the type. Sections appear as dark draggable cards.
          </Step>
          <Step n={2} title="Reorder sections">
            Drag the grip handle (⋮⋮) to reorder. Order saves immediately.
          </Step>
          <Step n={3} title="Add songs">
            Expand a section and click "Add song". Enter title, artist, and lyrics.
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
            <p className="text-xs text-charcoal/60"><code>/live/[slug]/control</code> — open on the worship leader's phone (admin login required). Controls scene, lyrics, feedback projection, and theme.</p>
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
        <p>Every event has a live companion page at <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]</code> — designed for attendees' phones during the gathering.</p>

        <p>Attendees reach it by:</p>
        <ul className="pl-4 list-disc space-y-1">
          <li>Scanning the QR code shown on the projection screen (control panel → "Show QR code")</li>
          <li>Opening the link directly: <strong>thegreenhouseke.com/live/session-02</strong></li>
          <li>From a WhatsApp message or Instagram story you've shared</li>
        </ul>

        <p>The page shows:</p>
        <ul className="pl-4 list-disc space-y-1">
          <li>The full evening program in expandable sections</li>
          <li>Song lyrics per section — tap a song to expand, tap again to collapse</li>
          <li>Tonight's theme card (title, scripture, description)</li>
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
            Via the feedback form on <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]</code>. Toggle "Post anonymously" on/off. Tap "Send message". A confirmation replaces the form.
          </Step>
          <Step n={2} title="Control panel receives">
            The worship leader's control panel polls for new feedback every 10 seconds. Messages appear in a scrollable list under "Attendee feedback", newest first.
          </Step>
          <Step n={3} title="Project to display">
            Tap the <strong>TV icon</strong> next to any message to send it to the projection screen as a full-screen glass overlay. The message animates in word by word. A gold chip at the top of the control panel confirms what's currently being shown.
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
            Go to the event's <strong>Details tab</strong> → <strong>Gallery Images</strong> section. Upload photos (JPGs/PNGs). They are compressed and stored in Supabase Storage. Set a sort order to control the collage layout.
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
            Event's <strong>Tools tab</strong> → Check-in link panel → <strong>Generate link</strong>.
          </Step>
          <Step n={2} title="Share with door team">
            Copy the URL or tap WhatsApp share. The link is valid until you regenerate it.
          </Step>
          <Step n={3} title="Mark attendees present">
            Door team opens the link on their phones. No login required. Full registrant list with "Mark Present" per row. Search and filter work in real time. Multiple devices sync live.
          </Step>
          <Step n={4} title="Add walk-in guests">
            Tap <strong>"Add walk-in attendee"</strong> at the top of the check-in list. Enter first name, last name, and optionally phone. They are added to the attendee list and marked present immediately. Walk-in records appear with a gold "Walk-in" badge.
          </Step>
        </div>

        <div className="bg-forest/6 border border-forest/15 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-forest mb-1">Community scene + check-in</p>
          <p className="text-xs text-charcoal/60">The Community display scene shows the <strong>checked-in count</strong> (not total registrations). It updates live as the door team marks people present — including walk-ins. This means the number on the projector reflects who's actually in the room.</p>
        </div>

        <div className="bg-off-white border border-mist rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={13} className="text-charcoal/40 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/50">If the link is compromised, click "Regenerate token" — the old URL immediately stops working.</p>
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
        <p>Send bulk emails or WhatsApp messages from an event's <strong>Tools tab</strong> or the global <strong>Comms</strong> page.</p>
        <ul className="pl-4 list-disc space-y-1">
          <li>Choose channel: Email or WhatsApp</li>
          <li>Choose scope: All registrants, or WhatsApp opt-ins only</li>
          <li>Write and preview the message before sending</li>
          <li>All sends are logged with status and timestamps</li>
        </ul>
        <p>Individual ticket emails are sent automatically on registration. The broadcast is for announcements: venue change, session start reminder, post-event thank you.</p>
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
        <p>Show the live QR via the control panel → "Show QR code on display". It appears in the bottom-right corner over whatever scene is active.</p>
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
        <p>The <strong>keep-alive cron</strong> runs daily at 6 am EAT via Vercel Cron to prevent the Supabase free-tier database from pausing. Verify it's firing in the Logs page.</p>
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
            <JourneyStep>Open <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">/live/[slug]/control</code> on the worship leader's phone.</JourneyStep>
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
            <JourneyStep>Download registrant CSV / PDF from the Registrants tab.</JourneyStep>
            <JourneyStep>Send a thank-you broadcast from Tools → Comms.</JourneyStep>
            <JourneyStep>Review attendance rate on the Dashboard.</JourneyStep>
          </JourneyPhase>
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

        {/* Step 1 — Resend */}
        <DeploySection
          n={1}
          icon={Mail}
          title="Verify your sending domain in Resend"
          subtitle="Required before registration emails will deliver"
        >
          <div className="space-y-2">
            <p>You have a Resend API key. Now verify the domain so emails arrive from <em>@greenhousews.co.ke</em> and don't land in spam.</p>
            <div className="space-y-1.5 pl-1">
              <Step n={1} title="Go to resend.com/domains">Click "Add Domain" and enter <strong>greenhousews.co.ke</strong>.</Step>
              <Step n={2} title="Copy the DNS records">Resend gives you 3–4 records: an MX record, a DKIM TXT, and an SPF TXT.</Step>
              <Step n={3} title="Add them at your registrar">Open your domain registrar (e.g. Namecheap, GoDaddy, or wherever you bought the domain). Go to DNS settings and add each record exactly as shown.</Step>
              <Step n={4} title="Click Verify in Resend">DNS propagates in 15 min – 48 hours. Once verified, status turns green. Send a test email to confirm delivery.</Step>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-amber-700">Your <code>RESEND_FROM_EMAIL</code> in Vercel env vars must use your verified domain: <code>The Green House &lt;hello@greenhousews.co.ke&gt;</code></p>
            </div>
          </div>
        </DeploySection>

        {/* Step 2 — GitHub */}
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

        {/* Step 3 — Vercel */}
        <DeploySection
          n={3}
          icon={Globe}
          title="Deploy on Vercel"
          subtitle="One-click deploy with automatic HTTPS and CDN"
        >
          <div className="space-y-2">
            <div className="space-y-1.5 pl-1">
              <Step n={1} title="Import project">Go to vercel.com → New Project → Import Git Repository. Select your repo. Framework is auto-detected as Next.js.</Step>
              <Step n={2} title="Add environment variables">Before clicking Deploy, expand "Environment Variables" and add all of the following:</Step>
            </div>
            <div className="bg-charcoal/4 rounded-xl p-3 font-mono text-[11px] text-charcoal/70 space-y-1">
              <p>NEXT_PUBLIC_SUPABASE_URL=https://eperecxwzmxsoiudkucb.supabase.co</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=<span className="text-charcoal/40">[your anon key]</span></p>
              <p>SUPABASE_SERVICE_ROLE_KEY=<span className="text-charcoal/40">[your service role key]</span></p>
              <p>NEXT_PUBLIC_SITE_URL=https://thegreenhouseke.com</p>
              <p>RESEND_API_KEY=<span className="text-charcoal/40">[your Resend key]</span></p>
              <p>RESEND_FROM_EMAIL=The Green House &lt;hello@greenhousews.co.ke&gt;</p>
              <p>CRON_SECRET=<span className="text-charcoal/40">[generate a strong random string]</span></p>
              <p>TWILIO_ACCOUNT_SID=<span className="text-charcoal/40">[from Twilio console]</span></p>
              <p>TWILIO_AUTH_TOKEN=<span className="text-charcoal/40">[from Twilio console]</span></p>
              <p>TWILIO_WHATSAPP_FROM=whatsapp:+14155238886</p>
            </div>
            <div className="space-y-1.5 pl-1">
              <Step n={3} title="Deploy">Click Deploy. Vercel builds and serves the site. Note the *.vercel.app URL — this is your staging URL.</Step>
              <Step n={4} title="Add your custom domain">Project Settings → Domains → Add Domain → enter <strong>thegreenhouseke.com</strong>. Follow the instructions to add a CNAME/A record at your registrar. HTTPS is automatic.</Step>
              <Step n={5} title="Update NEXT_PUBLIC_SITE_URL">Once the domain resolves, update the <code>NEXT_PUBLIC_SITE_URL</code> env var in Vercel to <code>https://thegreenhouseke.com</code> (no trailing slash). Trigger a redeploy.</Step>
            </div>
          </div>
        </DeploySection>

        {/* Step 4 — Supabase Auth */}
        <DeploySection
          n={4}
          icon={Shield}
          title="Configure Supabase auth for production"
          subtitle="Allows admin login from your live domain"
        >
          <div className="space-y-1.5 pl-1">
            <Step n={1} title="Open Supabase project">supabase.com → your project → Authentication → URL Configuration.</Step>
            <Step n={2} title="Add redirect URLs">
              Under "Redirect URLs", add:<br />
              <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">https://thegreenhouseke.com/auth/callback</code><br />
              <code className="text-xs bg-charcoal/6 px-1.5 py-0.5 rounded">https://your-project.vercel.app/auth/callback</code>
            </Step>
            <Step n={3} title="Set Site URL">In the same section, set <strong>Site URL</strong> to <code>https://thegreenhouseke.com</code>.</Step>
          </div>
        </DeploySection>

        {/* Step 5 — Cron verification */}
        <DeploySection
          n={5}
          icon={Server}
          title="Verify the keep-alive cron"
          subtitle="Prevents the free-tier database from pausing"
        >
          <div className="space-y-2">
            <p>The <code>vercel.json</code> already configures a daily cron at 3 am UTC (6 am EAT) that hits <code>/api/cron/keep-alive</code>.</p>
            <p>After deploy: Vercel Dashboard → your project → Cron Jobs tab. Confirm the job is listed. After the first 6 am EAT trigger, go to Admin → System → Logs and verify a "cron.keep_alive" entry appears.</p>
          </div>
        </DeploySection>

        {/* Step 6 — Google Search Console */}
        <DeploySection
          n={6}
          icon={SearchCode}
          title="Submit to Google Search Console"
          subtitle="Gets your public pages indexed and ranked"
        >
          <div className="space-y-2">
            <div className="space-y-1.5 pl-1">
              <Step n={1} title="Add property">Go to search.google.com/search-console → Add property → URL prefix → enter <code>https://thegreenhouseke.com</code>.</Step>
              <Step n={2} title="Verify ownership — HTML file method">
                Google gives you a file like <code>googleXXXXXX.html</code>. Download it and place it in the project's <code>/public</code> folder. Push to GitHub — Vercel auto-deploys. Click Verify in Search Console.
              </Step>
              <Step n={3} title="Submit your sitemap">In Search Console → Sitemaps → enter <code>https://thegreenhouseke.com/sitemap.xml</code> → Submit. This tells Google about all your public pages including event detail pages.</Step>
              <Step n={4} title="Request indexing for key pages">
                Go to the URL Inspection tool. Enter each of these URLs and click "Request indexing":
                <ul className="pl-4 list-disc space-y-0.5 mt-1">
                  <li><code>https://thegreenhouseke.com/</code></li>
                  <li><code>https://thegreenhouseke.com/about</code></li>
                  <li><code>https://thegreenhouseke.com/events</code></li>
                  <li><code>https://thegreenhouseke.com/gallery</code></li>
                  <li><code>https://thegreenhouseke.com/get-involved</code></li>
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

        {/* Step 7 — Brightex Dashboard */}
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

export default function AdminDocsPage() {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-forest/8 flex items-center justify-center">
            <BookOpen size={16} className="text-forest" />
          </div>
          <h1 className="text-xl font-semibold text-charcoal">Platform Documentation</h1>
        </div>
        <p className="text-sm text-charcoal/50 ml-12">
          Full reference for running The Green House platform — from creating a gathering to deploying the site and getting it on Google.
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

/* ── helpers ─────────────────────────────────────────────── */

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

function DeploySection({
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
