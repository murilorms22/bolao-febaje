import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { manualFixtures, scoreFixture, type ManualPrediction } from "@/lib/manual-fixtures";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  initial_points: number;
};

type PredictionRow = ManualPrediction & {
  user_id: string;
};

export default async function RankingPage() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: predictions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, initial_points")
      .order("display_name")
      .returns<Profile[]>(),
    supabase
      .from("manual_predictions")
      .select("user_id, fixture_key, home_score, away_score")
      .returns<PredictionRow[]>(),
  ]);

  const predictionsByUser = new Map<string, Map<string, ManualPrediction>>();

  for (const prediction of predictions || []) {
    if (!predictionsByUser.has(prediction.user_id)) {
      predictionsByUser.set(prediction.user_id, new Map());
    }
    predictionsByUser.get(prediction.user_id)?.set(prediction.fixture_key, prediction);
  }

  const ranking = (profiles || [])
    .map((profile) => {
      const userPredictions = predictionsByUser.get(profile.id);
      let predictionPoints = 0;
      let exactPredictions = 0;
      let correctOutcomes = 0;

      for (const fixture of manualFixtures) {
        const score = scoreFixture(fixture, userPredictions?.get(fixture.key));
        predictionPoints += score.points;
        if (score.status === "exact") exactPredictions += 1;
        if (score.status === "outcome") correctOutcomes += 1;
      }

      return {
        id: profile.id,
        name: profile.display_name || profile.username,
        initialPoints: Number(profile.initial_points || 0),
        predictionPoints,
        totalPoints: Number(profile.initial_points || 0) + predictionPoints,
        exactPredictions,
        correctOutcomes,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactPredictions !== a.exactPredictions) return b.exactPredictions - a.exactPredictions;
      return b.correctOutcomes - a.correctOutcomes;
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ranking</h1>
        <p className="text-muted-foreground">Classificação recalculada a partir dos palpites e resultados definidos no código.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">#</th>
                  <th className="py-3 pr-4">Nome</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Palpites</th>
                  <th className="py-3 pr-4">Inicial</th>
                  <th className="py-3 pr-4">Exatos</th>
                  <th className="py-3">Resultados</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row, index) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">{index + 1}</td>
                    <td className="py-3 pr-4">{row.name}</td>
                    <td className="py-3 pr-4 font-semibold">{row.totalPoints}</td>
                    <td className="py-3 pr-4">{row.predictionPoints}</td>
                    <td className="py-3 pr-4">{row.initialPoints}</td>
                    <td className="py-3 pr-4">{row.exactPredictions}</td>
                    <td className="py-3">{row.correctOutcomes}</td>
                  </tr>
                ))}
                {!ranking.length ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      O ranking aparece aqui quando houver participantes.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
