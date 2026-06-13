import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { LiveAttendeeView } from "@/components/live/live-attendee-view";
import { PreEventView } from "@/components/live/pre-event-view";
import { DonationPrompt } from "@/components/live/donation-prompt";
import { Wifi } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("slug", slug)
    .single();
  const title = event ? `${(event as { title: string }).title} — Live` : "Live Program";
  return { title, robots: { index: false } };
}

export default async function LiveAttendeePageWrapper({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const [{ data: event }, { data: givingSettings }] = await Promise.all([
    supabase
      .from("events")
      .select("*, event_sessions(*, session_songs(*, songs(*)))")
      .eq("slug", slug)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["giving_paybill", "giving_account", "giving_till", "giving_phone"]),
  ]);

  const giving = Object.fromEntries(
    (givingSettings ?? []).map((r: { key: string; value: string }) => [r.key.replace("giving_", ""), r.value])
  ) as { paybill?: string; account?: string; till?: string; phone?: string };

  if (!event) notFound();

  const typedEvent = event as {
    id:                string;
    title:             string;
    subtitle:          string | null;
    status:            string;
    event_date:        string;
    event_time:        string;
    venue_name:        string | null;
    theme_title:       string | null;
    theme_scripture:   string | null;
    theme_description: string | null;
    event_sessions:    Array<{
      id:           string;
      title:        string;
      type:         string;
      duration_min: number | null;
      sort_order:   number;
      session_songs: Array<{
        id:         string;
        sort_order: number;
        vocalist:   string | null;
        item_type:  string;
        item_text:  string | null;
        songs:      { id: string; title: string; artist: string | null; lyrics: string | null } | null;
      }>;
    }>;
  };

  const sessions = [...(typedEvent.event_sessions ?? [])]
    .filter(s => !(s as { deleted_at?: string | null }).deleted_at)
    .sort((a, b) => a.sort_order - b.sort_order);

  // TESTING: status gate disabled — re-enable before go-live
  // if (typedEvent.status !== "live") {
  //   return (
  //     <PreEventView
  //       eventTitle={typedEvent.title}
  //       eventDate={typedEvent.event_date}
  //       eventTime={typedEvent.event_time}
  //       venueName={typedEvent.venue_name}
  //       themeTitle={typedEvent.theme_title}
  //       themeScripture={typedEvent.theme_scripture}
  //       isPast={typedEvent.status === "past"}
  //     />
  //   );
  // }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-green-600 text-white text-center py-2.5 text-xs font-medium flex items-center justify-center gap-2">
        <Wifi size={12} className="animate-pulse" />
        This session is live right now — you&apos;re in the right place
      </div>

      <div className="bg-forest pt-10 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <span className="label-caps text-gold/70 text-[9px]">Tonight&apos;s Program</span>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream mt-1">
              {typedEvent.title}
            </h1>
            {typedEvent.theme_title && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/30">
                <span className="text-[10px] label-caps text-gold/70">Theme</span>
                <span className="text-xs text-gold">{typedEvent.theme_title}</span>
                {typedEvent.theme_scripture && (
                  <span className="text-[10px] text-gold/60">· {typedEvent.theme_scripture}</span>
                )}
              </div>
            )}
          </FadeIn>
        </div>
      </div>

      <LiveAttendeeView
        eventId={typedEvent.id}
        sessions={sessions}
        slug={slug}
        theme={{
          title:       typedEvent.theme_title,
          scripture:   typedEvent.theme_scripture,
          description: typedEvent.theme_description,
        }}
      />

      {/* TESTING: remove delayMs before go-live */}
      <DonationPrompt eventId={typedEvent.id} giving={giving} delayMs={5000} />
    </div>
  );
}
