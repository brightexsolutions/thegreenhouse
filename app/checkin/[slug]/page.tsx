import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { CheckinPanel } from "@/components/checkin/checkin-panel";
import { Calendar, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> };

export const metadata: Metadata = {
  title: "Check-in",
  robots: { index: false },
};

export default async function CheckinPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { t: token } = await searchParams;

  if (!token) redirect("/");

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, event_date, venue_name, checkin_token, status")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!event) notFound();
  if ((event as { checkin_token: string | null }).checkin_token !== token) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <p className="text-3xl mb-4">🔒</p>
          <h1 className="font-display text-xl font-semibold text-forest mb-2">Invalid token</h1>
          <p className="text-sm text-charcoal/50">This check-in link is no longer valid. Ask the event admin for an updated link.</p>
        </div>
      </main>
    );
  }

  const { data: registrants } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, email, phone, role, ticket_token, checked_in")
    .eq("event_id", (event as { id: string }).id)
    .is("deleted_at", null)
    .order("first_name", { ascending: true });

  const list = (registrants as Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    role: string;
    ticket_token: string | null;
    checked_in: boolean;
  }>) ?? [];

  const formattedDate = new Date((event as { event_date: string }).event_date).toLocaleDateString("en-KE", {
    weekday: "short", day: "numeric", month: "short",
  });

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-forest px-4 pt-10 pb-6">
        <div className="max-w-lg mx-auto">
          <p className="label-caps text-gold/70 text-[9px] mb-1">Check-in</p>
          <h1 className="font-display text-2xl font-semibold text-cream leading-tight">
            {(event as { title: string }).title}
          </h1>
          <div className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-cream/50">
              <Calendar size={11} />
              <span>{formattedDate}</span>
            </div>
            {(event as { venue_name: string | null }).venue_name && (
              <div className="flex items-center gap-1.5 text-xs text-cream/50">
                <MapPin size={11} />
                <span>{(event as { venue_name: string | null }).venue_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <CheckinPanel
          registrants={list}
          eventSlug={slug}
          checkinToken={token}
        />
      </div>
    </main>
  );
}
