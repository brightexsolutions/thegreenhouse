import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
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
    <div className="flex h-screen overflow-hidden bg-off-white">
      <AdminSidebar
        role={profile.role}
        liveSlug={live?.slug ?? null}
        liveName={live?.title ?? null}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar fullName={profile.full_name} role={profile.role} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </main>
      </div>
    </div>
  );
}
