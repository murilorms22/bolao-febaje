import { AdminMessage } from "@/components/admin/admin-message";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { createClient } from "@/lib/supabase/server";
import { savePrediction } from "./actions";

export const dynamic = "force-dynamic";

type Match = {
  id: string;
  match_at: string | null;
  status: string;
  rounds: {
    name: string;
    prediction_deadline: string | null;
  } | null;
  home_team: {
    name: string;
    flag_url: string | null;
  } | null;
  away_team: {
    name: string;
    flag_url: string | null;
  } | null;
};

type Prediction = {
  match_id: string;
  home_score: number;
  away_score: number;
};

function dateText(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Data a definir";
}

function isPredictionOpen(match: Match) {
  const deadline = match.rounds?.prediction_deadline || match.match_at;
  return match.status === "scheduled" && (!deadline || new Date(deadline).getTime() > Date.now());
}

function Flag({ src, name }: { src?: string | null; name?: string }) {
  if (!src) {
    return <div className="h-8 w-11 rounded border bg-muted" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="h-8 w-11 rounded border object-cover" src={src} alt={`Bandeira ${name || "seleção"}`} />
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: matches }, { data: predictions }] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", user?.id).single(),
    supabase
      .from("matches")
      .select(
        "id, match_at, status, rounds(name, prediction_deadline), home_team:teams!matches_home_team_id_fkey(name, flag_url), away_team:teams!matches_away_team_id_fkey(name, flag_url)",
      )
      .order("match_at", { ascending: true })
      .returns<Match[]>(),
    supabase.from("predictions").select("match_id, home_score, away_score").eq("user_id", user?.id).returns<Prediction[]>(),
  ]);

  const predictionsByMatch = new Map((predictions || []).map((prediction) => [prediction.match_id, prediction]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Palpites</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {profile?.display_name || profile?.username || "participante"}.
        </p>
      </div>

      <AdminMessage error={params.error} success={params.success} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(matches || []).map((match) => {
          const prediction = predictionsByMatch.get(match.id);
          const open = isPredictionOpen(match);

          return (
            <Card key={match.id} className="h-full">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={open ? "secondary" : "outline"}>{open ? "Aberto" : "Fechado"}</Badge>
                  <span className="text-xs text-muted-foreground">{match.rounds?.name || "Rodada"}</span>
                </div>
                <CardTitle className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-base">
                  <span className="flex min-w-0 flex-col items-center gap-2 text-center">
                    <Flag src={match.home_team?.flag_url} name={match.home_team?.name} />
                    <span className="break-words">{match.home_team?.name || "Mandante"}</span>
                  </span>
                  <span className="text-muted-foreground">x</span>
                  <span className="flex min-w-0 flex-col items-center gap-2 text-center">
                    <Flag src={match.away_team?.flag_url} name={match.away_team?.name} />
                    <span className="break-words">{match.away_team?.name || "Visitante"}</span>
                  </span>
                </CardTitle>
                <CardDescription>
                  Jogo: {dateText(match.match_at)}
                  <br />
                  Prazo: {dateText(match.rounds?.prediction_deadline || match.match_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={savePrediction} className="space-y-4">
                  <input type="hidden" name="match_id" value={match.id} />
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <Input
                      aria-label={`Palpite ${match.home_team?.name || "mandante"}`}
                      name="home_score"
                      type="number"
                      min="0"
                      max="99"
                      defaultValue={prediction?.home_score ?? ""}
                      disabled={!open}
                      required
                    />
                    <span className="text-muted-foreground">x</span>
                    <Input
                      aria-label={`Palpite ${match.away_team?.name || "visitante"}`}
                      name="away_score"
                      type="number"
                      min="0"
                      max="99"
                      defaultValue={prediction?.away_score ?? ""}
                      disabled={!open}
                      required
                    />
                  </div>
                  <SubmitButton className="w-full" disabled={!open} pendingText="Salvando...">
                    {prediction ? "Editar palpite" : "Salvar palpite"}
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!matches?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum jogo cadastrado</CardTitle>
            <CardDescription>Assim que o admin cadastrar os jogos da rodada, os cards de palpite aparecem aqui.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
