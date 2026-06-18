import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user?.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {profile?.display_name || profile?.username || "participante"}.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Base pronta</CardTitle>
          <CardDescription>
            As proximas fases podem preencher jogos, palpites e administracao completa.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nesta etapa nao ha integracao externa. Jogos e resultados serao cadastrados manualmente
          pelo admin.
        </CardContent>
      </Card>
    </div>
  );
}
