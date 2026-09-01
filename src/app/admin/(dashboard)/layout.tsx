import { notFound, redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/features/admin/shell/admin-sidebar";
import { isSupabaseConfigured } from "@/shared/lib/supabase";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";
import { Providers } from "./providers";

function displayNameFrom(metadata: Record<string, unknown>): string | null {
  const name = metadata.full_name ?? metadata.name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

/**
 * Auth + role gate for every dashboard page.
 *
 * Layered defense: src/proxy.ts already 404s when Supabase is unconfigured
 * and redirects signed-out users; this layout re-checks both (getUser, not
 * getSession — the JWT is validated server-side) and adds the admin-role
 * check. RLS `is_admin()` remains the actual data-access boundary.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    // Revokes the session server-side; cookie clearing is a no-op in a
    // Server Component but the sign-in page will not see a valid user.
    await supabase.auth.signOut();
    redirect("/admin/sign-in?error=forbidden");
  }

  return (
    <Providers>
      <SidebarProvider
        style={{ "--sidebar-width": "240px" } as React.CSSProperties}
      >
        <AdminSidebar
          userEmail={user.email ?? null}
          userName={displayNameFrom(user.user_metadata)}
        />
        <main className="flex min-h-svh flex-1 flex-col bg-background">
          {children}
        </main>
      </SidebarProvider>
    </Providers>
  );
}
