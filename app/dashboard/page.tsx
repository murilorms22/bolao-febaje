import { AdminMessage } from "@/components/admin/admin-message";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getFixturePrediction,
  manualFixtures,
  manualRounds,
  normalizeFixtureKey,
  scoreFixture,
  type ManualPrediction,
} from "@/lib/manual-fixtures";
import { calculateRanking, type RankingPrediction, type RankingProfile } from "@/lib/ranking";
import { createClient } from "@/lib/supabase/server";
import { savePrediction } from "./actions";
import { RoundSelect } from "./round-select";

export const dynamic = "force-dynamic";

type Profile = {
  username: string;
  display_name: string | null;
};

const statusStyles = {
  pending: "border-muted bg-card",
  exact: "border-blue-500 bg-blue-50",
  outcome: "border-green-500 bg-green-50",
  wrong: "border-red-500 bg-red-50",
  "no-prediction": "border-muted bg-card",
};

const statusText = {
  pending: "Confronto ainda não realizado",
  exact: "Placar exato",
  outcome: "Vencedor/empate correto",
  wrong: "Palpite errado",
  "no-prediction": "Sem palpite",
};

function Flag({ src, name }: { src: string; name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="h-7 w-10 shrink-0 rounded border object-cover sm:h-8 sm:w-11" src={src} alt={`Bandeira ${name}`} />
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selectedRound = typeof params.round === "string" ? params.round : manualRounds[manualRounds.length - 1];
  const visibleFixtures =
    selectedRound && selectedRound !== "all"
      ? manualFixtures.filter((fixture) => fixture.round === selectedRound)
      : manualFixtures;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: predictions, error: predictionsError },
    { data: profiles },
    { data: rankingPredictions },
  ] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", user?.id).single<Profile>(),
    supabase
      .from("manual_predictions")
      .select("fixture_key, home_score, away_score")
      .eq("user_id", user?.id)
      .returns<ManualPrediction[]>(),
    supabase
      .from("profiles")
      .select("id, username, display_name, initial_points, role")
      .order("display_name")
      .returns<RankingProfile[]>(),
    supabase
      .from("manual_predictions")
      .select("user_id, fixture_key, home_score, away_score")
      .returns<RankingPrediction[]>(),
  ]);

  const predictionsByFixture = new Map(
    (predictions || []).map((prediction) => [normalizeFixtureKey(prediction.fixture_key), prediction]),
  );
  const ranking = calculateRanking(profiles || [], rankingPredictions || []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Palpites</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Bem-vindo, {profile?.display_name || profile?.username || "participante"}.
          </p>
        </div>
        <RoundSelect rounds={manualRounds} />
      </div>

      <AdminMessage error={params.error || predictionsError?.message} success={params.success} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visibleFixtures.map((fixture) => {
            const prediction = getFixturePrediction(fixture, predictionsByFixture.get(normalizeFixtureKey(fixture.id)));
            const score = scoreFixture(fixture, prediction);
            const isOpen = !fixture.result;

            return (
              <Card key={fixture.id} className={`relative h-full border-2 ${statusStyles[score.status]}`}>
                <Badge className="absolute right-2 top-2 text-[11px]" variant="outline">
                  +{score.points}
                </Badge>
                <CardHeader className="space-y-2 p-3 pb-2 sm:space-y-3 sm:p-4 sm:pb-3">
                  <CardDescription className="pr-12 text-[11px] leading-tight sm:text-xs">{fixture.round}</CardDescription>
                  <CardTitle className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs sm:text-sm">
                    <span className="flex min-w-0 items-center gap-2 sm:flex-col sm:text-center">
                      <Flag src={fixture.homeFlag} name={fixture.home} />
                      <span className="min-w-0 break-words leading-tight">{fixture.home}</span>
                    </span>
                    <span className="text-muted-foreground">x</span>
                    <span className="flex min-w-0 flex-row-reverse items-center gap-2 text-right sm:flex-col sm:text-center">
                      <Flag src={fixture.awayFlag} name={fixture.away} />
                      <span className="min-w-0 break-words leading-tight">{fixture.away}</span>
                    </span>
                  </CardTitle>
                  <div className="text-center text-lg font-semibold sm:text-xl">
                    {fixture.result ? `${fixture.result.home}x${fixture.result.away}` : "?x?"}
                  </div>
                  <p className="min-h-5 text-center text-[11px] text-muted-foreground sm:min-h-8 sm:text-xs">
                    {statusText[score.status]}
                  </p>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                  <form action={savePrediction} className="space-y-3">
                    <input type="hidden" name="fixture_key" value={fixture.id} />
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                      <Input
                        className="h-11 text-center text-base"
                        aria-label={`Palpite ${fixture.home}`}
                        name="home_score"
                        type="number"
                        min="0"
                        max="99"
                        defaultValue={prediction?.home_score ?? ""}
                        disabled={!isOpen}
                        required
                      />
                      <span className="text-muted-foreground">x</span>
                      <Input
                        className="h-11 text-center text-base"
                        aria-label={`Palpite ${fixture.away}`}
                        name="away_score"
                        type="number"
                        min="0"
                        max="99"
                        defaultValue={prediction?.away_score ?? ""}
                        disabled={!isOpen}
                        required
                      />
                    </div>
                    <SubmitButton className="h-10 w-full" size="sm" disabled={!isOpen} pendingText="Salvando...">
                      {prediction ? "Editar" : "Salvar"}
                    </SubmitButton>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <aside className="xl:sticky xl:top-4 xl:self-start">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle>Ranking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-2">
              {ranking.map((row, index) => (
                <div key={row.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">#{index + 1}</p>
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {row.exactPredictions} exatos · {row.correctOutcomes} resultados
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{row.totalPoints}</p>
                    <p className="text-[11px] text-muted-foreground">pts</p>
                  </div>
                </div>
              ))}
              {!ranking.length ? <p className="text-sm text-muted-foreground">Nenhum participante no ranking.</p> : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
