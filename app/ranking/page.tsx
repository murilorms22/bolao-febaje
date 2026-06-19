import { applyManualResults, manualFixtures, manualRounds, type ManualFixtureResult } from "@/lib/manual-fixtures";
import { calculateRanking, type RankingPrediction, type RankingProfile } from "@/lib/ranking";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { RankingList } from "./ranking-list";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profiles }, { data: predictions }, { data: manualResults }] = await Promise.all([
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
  const ranking = calculateRanking(profiles || [], predictions || [], fixturesWithResults);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ranking</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Clique em um participante para ver os palpites resumidos por rodada.
        </p>
      </div>

      <RankingList
        ranking={ranking}
        fixtures={fixturesWithResults}
        rounds={manualRounds}
        predictions={predictions || []}
      />
    </div>
  );
}
