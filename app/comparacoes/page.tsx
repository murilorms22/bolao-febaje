import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applyManualResults,
  manualFixtures,
  manualRounds,
  normalizeFixtureKey,
  type ManualFixtureResult,
} from "@/lib/manual-fixtures";
import {
  applyRound2FallbackRankingPredictions,
  type RankingPrediction,
  type RankingProfile,
} from "@/lib/ranking";
import { createAdminClient } from "@/lib/supabase/admin";
import { RoundSelect } from "./round-select";

export const dynamic = "force-dynamic";

function Flag({ src, name }: { src: string; name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="h-7 w-10 shrink-0 rounded border object-cover sm:h-8 sm:w-11" src={src} alt={`Bandeira ${name}`} />
  );
}

export default async function ComparacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selectedRound = typeof params.round === "string" ? params.round : manualRounds[manualRounds.length - 1];
  
  const admin = createAdminClient();

  const [
    { data: profiles },
    { data: rankingPredictions },
    { data: manualResults },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, username, display_name, initial_points, role")
      .order("display_name")
      .returns<RankingProfile[]>(),
    admin
      .from("manual_predictions")
      .select("user_id, fixture_key, home_score, away_score")
      .returns<RankingPrediction[]>(),
    admin
      .from("manual_fixture_results")
      .select("fixture_key, home_score, away_score")
      .returns<ManualFixtureResult[]>(),
  ]);

  const fixturesWithResults = applyManualResults(manualFixtures, manualResults || []);
  const rankingPredictionsWithFallback = applyRound2FallbackRankingPredictions(profiles || [], rankingPredictions || []);
  
  const visibleFixtures =
    selectedRound && selectedRound !== "all"
      ? fixturesWithResults.filter((fixture) => fixture.round === selectedRound)
      : fixturesWithResults;

  // Filter out admin users from comparison
  const participantProfiles = (profiles || []).filter(
    (p) => p.role !== "admin" && p.username !== "muriloadm"
  );
  const participantIds = new Set(participantProfiles.map((p) => p.id));
  
  const participantPredictions = rankingPredictionsWithFallback.filter((p) =>
    participantIds.has(p.user_id)
  );

  // Group predictions by fixture
  const predictionsByFixture = new Map<string, typeof participantPredictions>();
  for (const prediction of participantPredictions) {
    const key = normalizeFixtureKey(prediction.fixture_key);
    if (!predictionsByFixture.has(key)) {
      predictionsByFixture.set(key, []);
    }
    predictionsByFixture.get(key)?.push(prediction);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Comparações</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Veja a distribuição dos palpites dos participantes para cada jogo.
          </p>
        </div>
        <RoundSelect rounds={manualRounds} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visibleFixtures.map((fixture) => {
          const fixtureKey = normalizeFixtureKey(fixture.id);
          const fixturePredictions = predictionsByFixture.get(fixtureKey) || [];
          
          let homeWins = 0;
          let draws = 0;
          let awayWins = 0;

          for (const pred of fixturePredictions) {
            const homeScore = Number(pred.home_score);
            const awayScore = Number(pred.away_score);
            if (homeScore > awayScore) {
              homeWins++;
            } else if (homeScore < awayScore) {
              awayWins++;
            } else {
              draws++;
            }
          }

          const totalGuesses = homeWins + draws + awayWins;
          const homePct = totalGuesses > 0 ? (homeWins / totalGuesses) * 100 : 0;
          const drawPct = totalGuesses > 0 ? (draws / totalGuesses) * 100 : 0;
          const awayPct = totalGuesses > 0 ? (awayWins / totalGuesses) * 100 : 0;

          return (
            <Card key={fixture.id} className="relative h-full border-2 bg-card">
              <Badge className="absolute right-2 top-2 text-[11px]" variant="outline">
                {totalGuesses} {totalGuesses === 1 ? "palpite" : "palpites"}
              </Badge>
              <CardHeader className="space-y-2 p-3 pb-2 sm:space-y-3 sm:p-4 sm:pb-3">
                <CardDescription className="pr-20 text-[11px] leading-tight sm:text-xs">{fixture.round}</CardDescription>
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
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                {totalGuesses === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    Nenhum palpite registrado para este jogo.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted mt-2">
                      {homeWins > 0 && (
                        <div
                          style={{ width: `${homePct}%` }}
                          className="bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center transition-all"
                          title={`Vitória do ${fixture.home}: ${homeWins}`}
                        >
                          {homePct >= 10 && `${homePct.toFixed(0)}%`}
                        </div>
                      )}
                      {draws > 0 && (
                        <div
                          style={{ width: `${drawPct}%` }}
                          className="bg-yellow-500 text-[10px] font-bold text-black flex items-center justify-center transition-all"
                          title={`Empate: ${draws}`}
                        >
                          {drawPct >= 10 && `${drawPct.toFixed(0)}%`}
                        </div>
                      )}
                      {awayWins > 0 && (
                        <div
                          style={{ width: `${awayPct}%` }}
                          className="bg-red-500 text-[10px] font-bold text-white flex items-center justify-center transition-all"
                          title={`Vitória do ${fixture.away}: ${awayWins}`}
                        >
                          {awayPct >= 10 && `${awayPct.toFixed(0)}%`}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className="rounded bg-blue-50 dark:bg-blue-950/20 p-1.5 border border-blue-100 dark:border-blue-900/30">
                        <span className="text-[10px] text-muted-foreground block leading-tight font-medium">Casa</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 block mt-0.5">
                          {homeWins} ({homePct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="rounded bg-yellow-50 dark:bg-yellow-950/20 p-1.5 border border-yellow-100 dark:border-yellow-900/30">
                        <span className="text-[10px] text-muted-foreground block leading-tight font-medium">Empate</span>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-500 block mt-0.5">
                          {draws} ({drawPct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="rounded bg-red-50 dark:bg-red-950/20 p-1.5 border border-red-100 dark:border-red-900/30">
                        <span className="text-[10px] text-muted-foreground block leading-tight font-medium">Fora</span>
                        <span className="font-semibold text-red-600 dark:text-red-400 block mt-0.5">
                          {awayWins} ({awayPct.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
