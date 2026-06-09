import { BookOpen, Calendar, Users, MessageSquare, Monitor, Music, Shield, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const sections = [
  {
    icon: Calendar,
    title: "Events",
    id: "events",
    items: [
      {
        q: "How do I create an event?",
        a: "Go to Events → click 'New event'. Fill in the title, date, time, venue, and set a status of 'Draft' while editing. When ready, change the status to 'Published' to open registration.",
      },
      {
        q: "What do the status options mean?",
        a: "Draft — not visible to the public. Published — visible, registration open. Live — session is happening now (activates the Live banner). Past — session complete, registration closed. Cancelled — hidden from listings.",
      },
      {
        q: "How do I add a cover image?",
        a: "On the event edit page, click 'Choose image' in the cover image section. Images are automatically optimised and stored in Supabase Storage. Recommended size: 1200×630px.",
      },
      {
        q: "How does the capacity limit work?",
        a: "Leave capacity blank for unlimited. If set, the registration API rejects new registrations once the limit is reached and shows a 'Session is full' message.",
      },
    ],
  },
  {
    icon: Users,
    title: "Registration & Tickets",
    id: "registration",
    items: [
      {
        q: "What happens when someone registers?",
        a: "They receive: (1) a PDF ticket via email if they provided one, (2) a WhatsApp message with their ticket link if they provided a phone number. If both, they get both. The ticket page at /ticket/[token] is always accessible.",
      },
      {
        q: "Can someone register with just a phone number?",
        a: "Yes. If no email is provided, they receive a WhatsApp message with the link to their ticket page. They won't get the PDF attachment — only attendees with email get that.",
      },
      {
        q: "How do I check attendance at the door?",
        a: "Open the event → copy the check-in link from the Check-in panel → share it with the door team via WhatsApp. They open the link on their phones — no admin login required. They can search names and tap 'Mark present'.",
      },
      {
        q: "How do I export the registrant list?",
        a: "Go to the event's Registrants page. Use 'Download CSV' for a spreadsheet, or 'Download PDF' for a printable list. Use 'Share list' to email a CSV copy to any address.",
      },
    ],
  },
  {
    icon: Music,
    title: "Program & Lyrics",
    id: "program",
    items: [
      {
        q: "How do I build a session program?",
        a: "Open an event → Sessions tab. Add sessions in order (Worship, Prayer, Teaching, etc.). Drag the handle (⠿) to reorder. Each session can have songs with full lyrics attached.",
      },
      {
        q: "How do I add songs?",
        a: "Within a session, click 'Add song'. Songs are stored in a shared library — search for existing ones or create new. Lyrics use plain text with line breaks preserved.",
      },
      {
        q: "Who can see the program and lyrics?",
        a: "Anyone who visits /live/[slug]. The live page shows the ordered program, and each song has an expandable lyrics section. No login required for attendees.",
      },
    ],
  },
  {
    icon: Monitor,
    title: "Projection Display",
    id: "display",
    items: [
      {
        q: "How do I use the projection display?",
        a: "On event day: (1) Open /live/[slug]/display on the projector — it goes fullscreen automatically. (2) Open /live/[slug]/control on your phone. (3) Use the control panel to switch between 9 scenes in real-time.",
      },
      {
        q: "What are the available scenes?",
        a: "Branding (logo + date), Countdown (time until session), Now Playing (song title), Lyrics (verse-by-verse), Program (order of service), Theme (scripture), Prayer (custom prompt), Community (attendee count), Interlude (ambient), Custom (type anything).",
      },
      {
        q: "How do I advance lyrics line by line?",
        a: "On the control panel, select the active song. Use the Prev/Next buttons to advance through verses. The display updates instantly.",
      },
    ],
  },
  {
    icon: MessageSquare,
    title: "Communications",
    id: "comms",
    items: [
      {
        q: "How do I send a broadcast?",
        a: "Go to Communications → 'Send broadcast'. Choose an event, channel (Email or WhatsApp), and scope (All registrants or WhatsApp opt-in only). Write your message and confirm.",
      },
      {
        q: "What is WhatsApp opt-in?",
        a: "During registration, attendees can opt in to receive WhatsApp updates. Use 'Opt-in only' scope for promotional messages and 'All' only for essential event updates.",
      },
      {
        q: "How do I set up a feedback link?",
        a: "On the event edit page, paste any URL in the Feedback URL field (Google Form, Typeform, etc.). After the session, attendees who visit /feedback/[slug] are redirected there automatically.",
      },
    ],
  },
  {
    icon: Clock,
    title: "Keep-Alive & Database",
    id: "keepalive",
    items: [
      {
        q: "What is the keep-alive cron?",
        a: "Supabase free tier databases pause after 7 days of inactivity. A Vercel Cron job fires every day at 6am EAT and runs a lightweight database query to prevent this. It's automatic — nothing to configure.",
      },
      {
        q: "How do I verify it's running?",
        a: "Visit /api/health — it should return {status: 'ok'}. If the database is paused, it will return a 503. You can also check the Vercel Functions dashboard for the /api/cron/keep-alive route.",
      },
      {
        q: "How much storage can I use?",
        a: "Supabase free tier provides 1GB. With images compressed to ~200KB each, that's ~5,000 images. Check the System → Overview page for current storage usage.",
      },
    ],
  },
  {
    icon: Shield,
    title: "Admin Roles",
    id: "roles",
    items: [
      {
        q: "What is the difference between Admin and Super Admin?",
        a: "Admins can do all day-to-day operations: create events, manage registrants, send broadcasts, run check-in, control the display. Super Admins additionally have access to System pages: logs, trash, admin accounts, and site settings.",
      },
      {
        q: "How do I add a new admin?",
        a: "System → Admin Accounts → Add admin. Enter their email and choose a role. They'll receive a password reset email to set their password.",
      },
      {
        q: "How do I remove an admin?",
        a: "System → Admin Accounts → click the trash icon next to the admin. They immediately lose dashboard access. Their registration records are unaffected.",
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center">
            <BookOpen size={16} className="text-forest" />
          </div>
          <h1 className="text-2xl font-semibold text-forest">Documentation</h1>
        </div>
        <p className="text-sm text-charcoal/50">How everything works — from events to projection display</p>
      </div>

      {/* Jump links */}
      <nav className="flex flex-wrap gap-2 mb-10">
        {sections.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-mist text-xs font-medium text-charcoal/60 hover:text-forest hover:border-forest/30 transition-colors"
          >
            <s.icon size={11} />
            {s.title}
          </a>
        ))}
      </nav>

      {/* Sections */}
      <div className="space-y-10">
        {sections.map(section => (
          <section key={section.id} id={section.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-forest/8 flex items-center justify-center">
                <section.icon size={15} className="text-forest/70" />
              </div>
              <h2 className="text-lg font-semibold text-forest">{section.title}</h2>
            </div>

            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-mist p-5">
                  <p className="text-sm font-semibold text-forest mb-2">{item.q}</p>
                  <p className="text-sm text-charcoal/60 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-mist text-center">
        <p className="text-xs text-charcoal/30">
          The Green House · Admin documentation · Built with care
        </p>
      </div>
    </div>
  );
}
