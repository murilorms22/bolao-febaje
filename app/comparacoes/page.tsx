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
import { FixtureComparisonCard } from "./fixture-comparison-card";

export const dynamic = "force-dynamic";

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

          return (
            <FixtureComparisonCard
              key={fixture.id}
              fixture={fixture}
              fixturePredictions={fixturePredictions}
              profiles={profiles || []}
            />
          );
        })}
      </div>
    </div>
  );
}
