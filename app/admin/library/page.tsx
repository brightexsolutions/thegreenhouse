import { createAdminClient } from "@/lib/supabase/server";
import { SongsLibrary } from "@/components/admin/library/songs-library";
import { EventPhotoUpload } from "@/components/admin/library/event-photo-upload";
import { AttendeePhotoApproval } from "@/components/admin/library/attendee-photo-approval";
import { TriviaLibrary } from "@/components/admin/library/trivia-library";
import { ThemesLibrary } from "@/components/admin/library/themes-library";
import Link from "next/link";
import { Music2, Images, Palette, Camera, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

type Tab = "songs" | "photos" | "themes" | "attendee-photos" | "trivia";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function LibraryPage({ searchParams }: Props) {
  const { tab = "songs" } = await searchParams;
  const activeTab = (["songs", "photos", "themes", "attendee-photos", "trivia"].includes(tab) ? tab : "songs") as Tab;

  const supabase = createAdminClient();

  const [{ data: songs }, { data: events }, { data: themes }] = await Promise.all([
    supabase
      .from("songs")
      .select("id, title, artist, lyrics, key, created_at")
      .is("deleted_at", null)
      .order("title", { ascending: true }),
    supabase
      .from("events")
      .select("id, title, slug, event_date, theme_title, theme_scripture, theme_description, theme_id")
      .is("deleted_at", null)
      .order("event_date", { ascending: false }),
    supabase
      .from("themes")
      .select("id, title, scripture, description, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const eventsForPhotos = (events ?? []).map(e => ({
    id:         (e as { id: string }).id,
    title:      (e as { title: string }).title,
    event_date: (e as { event_date: string }).event_date,
  }));

  const eventsForThemes = (events ?? []).map(e => ({
    id:         (e as { id: string }).id,
    title:      (e as { title: string }).title,
    event_date: (e as { event_date: string }).event_date,
    theme_id:   (e as { theme_id?: string | null }).theme_id ?? null,
  }));

  const TABS = [
    { key: "songs",           label: "Songs",           icon: Music2  },
    { key: "photos",          label: "Event Photos",    icon: Images  },
    { key: "attendee-photos", label: "Attendee Photos", icon: Camera  },
    { key: "themes",          label: "Themes",          icon: Palette  },
    { key: "trivia",          label: "Trivia",           icon: Sparkles },
  ] as const;

  return (
    <div className="flex flex-col h-full -m-6 overflow-hidden">

      {/* ── Pinned header: title + tabs ── */}
      <div className="flex-shrink-0 bg-off-white border-b border-mist px-6 pt-6 pb-3">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-charcoal leading-none">Library</h1>
          <p className="text-sm text-charcoal/40 mt-1">Manage songs, event photos, and themes</p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-white rounded-2xl border border-mist p-1 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <Link
              key={key}
              href={`/admin/library?tab=${key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === key
                  ? "bg-forest text-cream shadow-sm"
                  : "text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5"
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>

      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === "songs" && (
          <SongsLibrary initialSongs={(songs as unknown as Parameters<typeof SongsLibrary>[0]["initialSongs"]) ?? []} />
        )}
        {activeTab === "photos" && (
          <EventPhotoUpload events={(events as unknown as Parameters<typeof EventPhotoUpload>[0]["events"]) ?? []} />
        )}
        {activeTab === "attendee-photos" && (
          <AttendeePhotoApproval events={eventsForPhotos} />
        )}
        {activeTab === "trivia" && <TriviaLibrary />}
        {activeTab === "themes" && (
          <ThemesLibrary
            initialThemes={(themes as unknown as Parameters<typeof ThemesLibrary>[0]["initialThemes"]) ?? []}
            events={eventsForThemes}
          />
        )}
      </div>
    </div>
  );
}
