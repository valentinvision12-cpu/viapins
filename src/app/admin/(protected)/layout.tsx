import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/sidebar";
import { adminAuthBypassEnabled } from "@/lib/site-brand";

export const metadata = {
  title: {
    template: "%s | Контролен Панел",
    default: "Контролен Панел",
  },
};

/**
 * Protected admin layout.
 * This layout ONLY covers routes inside (protected)/ — i.e. /admin and nested pages.
 * The login page at /admin/login sits OUTSIDE this group and has no auth check.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // DEV bypass — local development only (never in production)
  const devBypass = adminAuthBypassEnabled();

  if (!devBypass) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/admin/login");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, full_name, email, avatar_url")
      .eq("id", user.id)
      .single();

  // Same rule in the React layout (middleware is the primary gate).
  if (!profile?.is_admin) {
    redirect("/admin/login?error=not_admin");
  }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[oklch(0.97_0.004_260/0.5)]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
