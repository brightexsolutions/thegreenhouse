import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Login page must not go through the auth layout — it would create a redirect loop
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (pathname === "/admin/login") return <>{children}</>;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const adminSupa = createAdminClient();
  const { data: profile } = await adminSupa
    .from("admin_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-off-white">
      <AdminSidebar role={profile.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar fullName={profile.full_name} role={profile.role} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
