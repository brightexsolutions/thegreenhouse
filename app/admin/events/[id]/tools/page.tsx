import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { CheckinLinkPanel } from "@/components/admin/checkin-link-panel";
import { ControlLinksPanel } from "@/components/admin/control-links-panel";
import { QrSharePanel } from "@/components/admin/qr-share-panel";
import { CommsSendDialog } from "@/components/admin/comms-send-dialog";
import { SongContributionPanel } from "@/components/admin/song-contribution-panel";
import { ContributionLinkPanel } from "@/components/admin/contribution-link-panel";
import { PostEventEmailPanel } from "@/components/admin/post-event-email-panel";
import Link from "next/link";
import { ExternalLink, Download, Tv2 } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EventToolsPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: event }, { count: registrantCount }, { count: emailCount }, { data: controlLinks }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, slug, status, checkin_token, post_event_email_sent")
      .eq("id", id)
      .is("deleted_at", null)
      .single(),
    supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id)
      .is("deleted_at", null),
    supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id)
      .not("email", "is", null)
      .is("deleted_at", null),
    supabase
      .from("control_links")
      .select("id, label, permissions, token, created_at")
      .eq("event_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!event) notFound();

  // Fetch contribution tokens — gracefully handles pre-migration state
  const { data: tokenRow } = await supabase
    .from("events")
    .select("song_submission_token, theme_contribution_token, trivia_contribution_token")
    .eq("id", id)
    .single();
  const tokens = tokenRow as { song_submission_token?: string; theme_contribution_token?: string; trivia_contribution_token?: string } | null;
  const songSubmissionToken      = tokens?.song_submission_token      ?? null;
  const themeContributionToken   = tokens?.theme_contribution_token   ?? null;
  const triviaContributionToken  = tokens?.trivia_contribution_token  ?? null;

  const isPreviewOnly = event.status !== "live" && event.status !== "published";

  return (
    <div className="space-y-6">

      {/* Live display — always visible to admins; labelled as preview when not yet published */}
      <div className="bg-white rounded-2xl border border-mist p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-semibold text-charcoal">Projection Display</h3>
          {isPreviewOnly && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-gold/15 text-gold/80 px-2 py-0.5 rounded-full">Preview mode</span>
          )}
        </div>
        <p className="text-xs text-charcoal/50 mb-4">
          {isPreviewOnly
            ? "Event is not yet published. These links are available for testing — the display and control panel will work as normal."
            : "Open the display screen on a projector and use the control panel on your phone to manage scenes, lyrics, and messages in real time."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/live/${event.slug}/display`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors"
          >
            <Tv2 size={14} /> Open display screen
          </Link>
          <Link
            href={`/live/${event.slug}/control`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-forest/30 text-forest text-sm font-semibold hover:bg-forest/5 transition-colors"
          >
            <ExternalLink size={14} /> Control panel
          </Link>
        </div>
      </div>

      {/* Check-in + QR */}
      <div className="grid sm:grid-cols-2 gap-4">
        <CheckinLinkPanel eventId={id} eventSlug={event.slug} checkinToken={event.checkin_token} />
        <QrSharePanel eventId={id} eventSlug={event.slug} />
      </div>

      {/* Control panel access links */}
      <ControlLinksPanel
        eventId={id}
        eventSlug={event.slug}
        initial={(controlLinks ?? []) as Parameters<typeof ControlLinksPanel>[0]["initial"]}
      />

      {/* Song contributions */}
      {songSubmissionToken && (
        <SongContributionPanel
          eventId={id}
          eventTitle={event.title}
          songSubmissionToken={songSubmissionToken}
        />
      )}

      {/* Theme + Trivia contributions */}
      <ContributionLinkPanel
        eventTitle={event.title}
        themeContributionToken={themeContributionToken}
        triviaContributionToken={triviaContributionToken}
      />

      {/* Export & broadcast */}
      <div className="bg-white rounded-2xl border border-mist p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-charcoal">Export & Communicate</h3>
          {(registrantCount ?? 0) === 0 && (
            <span className="text-[10px] text-charcoal/35 bg-charcoal/5 px-2 py-0.5 rounded-full">No registrants yet</span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {(registrantCount ?? 0) > 0 ? (
            <>
              <a
                href={`/api/admin/events/${id}/export?format=csv`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-mist text-sm text-charcoal/70 font-medium hover:border-forest/30 hover:text-forest transition-all"
              >
                <Download size={14} /> Download CSV
              </a>
              <a
                href={`/api/admin/events/${id}/export?format=pdf`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-mist text-sm text-charcoal/70 font-medium hover:border-forest/30 hover:text-forest transition-all"
              >
                <Download size={14} /> Download PDF list
              </a>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-mist text-sm text-charcoal/25 font-medium cursor-not-allowed">
                <Download size={14} /> Download CSV
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-mist text-sm text-charcoal/25 font-medium cursor-not-allowed">
                <Download size={14} /> Download PDF list
              </span>
            </>
          )}
        </div>

        <div className="pt-2 border-t border-mist">
          <CommsSendDialog events={[{ id, title: event.title }]} />
        </div>
      </div>

      {/* Post-event email — only shown for past events */}
      {event.status === "past" && (
        <PostEventEmailPanel
          eventId={id}
          alreadySent={(event as { post_event_email_sent?: boolean }).post_event_email_sent ?? false}
          emailCount={emailCount ?? 0}
        />
      )}
    </div>
  );
}
