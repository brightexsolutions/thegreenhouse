import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { FadeIn } from "@/components/motion/fade-in";
import { Music2, BookOpen, Heart, Wifi } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Live — Session ${slug}`, robots: { index: false } };
}

const SESSION_ICONS: Record<string, typeof Music2> = {
  worship:  Music2,
  prayer:   Heart,
  teaching: BookOpen,
};

export default async function LiveEventPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("*, event_sessions(*, session_songs(*, songs(*)))")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!event) notFound();

  const sessions = ((event as { event_sessions?: unknown[] }).event_sessions ?? []) as Array<{
    id: string;
    title: string;
    type: string;
    duration_min: number | null;
    sort_order: number;
    session_songs: Array<{
      id: string;
      sort_order: number;
      songs: { id: string; title: string; artist: string | null; lyrics: string | null } | null;
    }>;
  }>;

  sessions.sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="min-h-screen bg-cream">
      {/* Live banner */}
      {(event as { status: string }).status === "live" && (
        <div className="bg-green-600 text-white text-center py-2 text-xs font-medium flex items-center justify-center gap-2">
          <Wifi size={12} className="animate-pulse" />
          This session is live right now
        </div>
      )}

      {/* Header */}
      <div className="bg-forest pt-20 pb-10 px-4">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <span className="label-caps text-gold/70 text-[9px]">Live Program</span>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream mt-1">
              {(event as { title: string }).title}
            </h1>
            {(event as { theme_title: string | null }).theme_title && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30">
                <span className="text-[10px] label-caps text-gold/70">Theme</span>
                <span className="text-xs text-gold">{(event as { theme_title: string }).theme_title}</span>
                {(event as { theme_scripture: string | null }).theme_scripture && (
                  <span className="text-[10px] text-gold/60">· {(event as { theme_scripture: string }).theme_scripture}</span>
                )}
              </div>
            )}
          </FadeIn>
        </div>
      </div>

      {/* Sessions */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {sessions.length === 0 ? (
          <FadeIn>
            <div className="text-center py-16 text-charcoal/30">
              <Music2 size={32} className="mx-auto mb-3" />
              <p className="text-sm">Program coming soon</p>
            </div>
          </FadeIn>
        ) : (
          sessions.map((session, i) => {
            const Icon = SESSION_ICONS[session.type] ?? Music2;
            return (
              <FadeIn key={session.id} delay={i * 0.04}>
                <div className="bg-white rounded-3xl border border-mist overflow-hidden">
                  {/* Session header */}
                  <div className="px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-forest/8 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-forest" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal">{session.title}</p>
                      <p className="text-[10px] text-charcoal/40 capitalize mt-0.5">
                        {session.type}{session.duration_min ? ` · ${session.duration_min} min` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] text-charcoal/20 font-medium">#{i + 1}</span>
                  </div>

                  {/* Songs + lyrics */}
                  {session.session_songs.length > 0 && (
                    <div className="border-t border-mist">
                      {session.session_songs
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((ss) => ss.songs ? (
                          <SongAccordion key={ss.id} song={ss.songs} />
                        ) : null)}
                    </div>
                  )}
                </div>
              </FadeIn>
            );
          })
        )}

        {/* Theme card */}
        {(event as { theme_title: string | null }).theme_title && (
          <FadeIn delay={sessions.length * 0.04 + 0.05}>
            <div className="bg-forest rounded-3xl p-6 text-cream relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_0%,rgba(201,162,74,0.12),transparent)]" />
              <div className="relative">
                <span className="label-caps text-gold/70 text-[9px]">Tonight&apos;s Theme</span>
                <h3 className="font-display text-2xl font-semibold mt-1 mb-2">
                  {(event as { theme_title: string }).theme_title}
                </h3>
                {(event as { theme_scripture: string | null }).theme_scripture && (
                  <p className="text-gold/80 text-sm flex items-center gap-1.5">
                    <BookOpen size={12} />
                    {(event as { theme_scripture: string }).theme_scripture}
                  </p>
                )}
                {(event as { theme_description: string | null }).theme_description && (
                  <p className="text-cream/60 text-sm mt-3 leading-relaxed">
                    {(event as { theme_description: string }).theme_description}
                  </p>
                )}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Feedback link */}
        {(event as { feedback_url: string | null }).feedback_url && (
          <FadeIn>
            <Link
              href={`/feedback/${slug}`}
              className="block w-full text-center py-3.5 rounded-full border border-mist text-sm text-charcoal/60 hover:border-forest/30 hover:text-forest transition-all"
            >
              Share feedback →
            </Link>
          </FadeIn>
        )}
      </div>
    </div>
  );
}

function SongAccordion({ song }: { song: { title: string; artist: string | null; lyrics: string | null } }) {
  return (
    <details className="group border-b border-mist last:border-none">
      <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer list-none hover:bg-off-white transition-colors">
        <Music2 size={12} className="text-charcoal/25 flex-shrink-0" />
        <span className="text-xs font-medium text-charcoal flex-1">{song.title}</span>
        {song.artist && <span className="text-[10px] text-charcoal/30">{song.artist}</span>}
        <span className="text-[10px] text-charcoal/30 group-open:rotate-90 transition-transform">›</span>
      </summary>
      {song.lyrics && (
        <div className="px-5 pb-4 pt-1">
          <pre className="text-xs text-charcoal/60 whitespace-pre-wrap font-sans leading-relaxed">
            {song.lyrics}
          </pre>
        </div>
      )}
    </details>
  );
}
