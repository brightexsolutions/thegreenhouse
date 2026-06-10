import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui/page-header";
import { SongsLibrary } from "@/components/admin/library/songs-library";
import { EventPhotoUpload } from "@/components/admin/library/event-photo-upload";
import { AttendeePhotoApproval } from "@/components/admin/library/attendee-photo-approval";
import Link from "next/link";
import { Music2, Images, Palette, Camera } from "lucide-react";

export const dynamic = "force-dynamic";

type Tab = "songs" | "photos" | "themes" | "attendee-photos";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function LibraryPage({ searchParams }: Props) {
  const { tab = "songs" } = await searchParams;
  const activeTab = (["songs", "photos", "themes", "attendee-photos"].includes(tab) ? tab : "songs") as Tab;

  const supabase = createAdminClient();

  const [{ data: songs }, { data: events }] = await Promise.all([
    supabase
      .from("songs")
      .select("id, title, artist, lyrics, created_at")
      .is("deleted_at", null)
      .order("title", { ascending: true }),
    supabase
      .from("events")
      .select("id, title, slug, event_date, theme_title, theme_scripture, theme_description")
      .is("deleted_at", null)
      .order("event_date", { ascending: false }),
  ]);

  const eventsForPhotos = (events ?? []).map(e => ({
    id:         (e as { id: string }).id,
    title:      (e as { title: string }).title,
    event_date: (e as { event_date: string }).event_date,
  }));

  const TABS = [
    { key: "songs",           label: "Songs",           icon: Music2  },
    { key: "photos",          label: "Event Photos",    icon: Images  },
    { key: "attendee-photos", label: "Attendee Photos", icon: Camera  },
    { key: "themes",          label: "Themes",          icon: Palette },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Library"
        description="Manage songs, event photos, and themes"
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-mist p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/admin/library?tab=${key}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? "bg-forest text-cream shadow-sm" : "text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5"
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </div>

      {activeTab === "songs" && (
        <SongsLibrary initialSongs={(songs as unknown as Parameters<typeof SongsLibrary>[0]["initialSongs"]) ?? []} />
      )}
      {activeTab === "photos" && (
        <EventPhotoUpload events={(events as unknown as Parameters<typeof EventPhotoUpload>[0]["events"]) ?? []} />
      )}
      {activeTab === "attendee-photos" && (
        <AttendeePhotoApproval events={eventsForPhotos} />
      )}
      {activeTab === "themes" && (
        <div className="space-y-3">
          {(events ?? []).filter(e => (e as { theme_title?: string }).theme_title).map(ev => {
            const e = ev as { id: string; title: string; slug: string; event_date: string; theme_title?: string; theme_scripture?: string; theme_description?: string };
            return (
              <div key={e.id} className="bg-white rounded-2xl border border-mist p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-charcoal/40 mb-1">
                      {new Date(e.event_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{e.title.replace("The Green House — ", "")}
                    </p>
                    <h3 className="text-xl font-display font-semibold text-forest">{e.theme_title}</h3>
                    {e.theme_scripture && (
                      <p className="text-sm text-charcoal/50 mt-0.5 flex items-center gap-1.5">
                        <Music2 size={12} /> {e.theme_scripture}
                      </p>
                    )}
                    {e.theme_description && (
                      <p className="text-sm text-charcoal/60 mt-2 leading-relaxed">{e.theme_description}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/events/${e.id}`}
                    className="flex-shrink-0 text-xs text-forest bg-forest/8 hover:bg-forest/15 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Edit event
                  </Link>
                </div>
              </div>
            );
          })}
          {(events ?? []).filter(e => (e as { theme_title?: string }).theme_title).length === 0 && (
            <div className="bg-white rounded-2xl border border-mist p-12 text-center">
              <Palette size={24} className="text-charcoal/20 mx-auto mb-3" />
              <p className="text-sm text-charcoal/40">No themes yet</p>
              <p className="text-xs text-charcoal/25 mt-1">Add a theme when creating or editing an event</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
