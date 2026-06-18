import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("has_role", { role_name: "admin" });

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">Area reservada para cadastro manual nas proximas fases.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Painel em preparacao</CardTitle>
          <CardDescription>
            A base de banco, RLS e permissoes ja esta pronta para receber os formularios.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nao ha API externa configurada. O fluxo planejado e cadastro manual de times, rodadas,
          jogos, resultados e ajustes do bolao.
        </CardContent>
      </Card>
    </div>
  );
}
