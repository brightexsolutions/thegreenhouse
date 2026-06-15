import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/layout/admin-shell";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (pathname === "/admin/login") return <>{children}</>;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const adminSupa = createAdminClient();
  const [{ data: profile }, { data: liveEvent }] = await Promise.all([
    adminSupa.from("admin_profiles").select("full_name, role").eq("id", user.id).single(),
    adminSupa.from("events").select("slug, title").eq("status", "live").is("deleted_at", null).limit(1).maybeSingle(),
  ]);

  if (!profile) redirect("/admin/login");

  const live = liveEvent as { slug: string; title: string } | null;

  return (
    <AdminShell
      role={profile.role}
      liveSlug={live?.slug ?? null}
      liveName={live?.title ?? null}
      fullName={profile.full_name}
    >
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </AdminShell>
  );
}
