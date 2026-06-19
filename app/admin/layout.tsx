import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: isAdmin } = await supabase.rpc("has_role", { role_name: "admin" });

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground">Gerencie usuários, placares e ajustes manuais de pontuação.</p>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
