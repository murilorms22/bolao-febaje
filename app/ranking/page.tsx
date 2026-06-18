import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateRanking, type RankingPrediction, type RankingProfile } from "@/lib/ranking";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: predictions }] = await Promise.all([
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

  const ranking = calculateRanking(profiles || [], predictions || []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ranking</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Classificação recalculada a partir dos palpites e resultados definidos no código.
        </p>
      </div>

      <div className="space-y-3 md:hidden">
        {ranking.map((row, index) => (
          <Card key={row.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">#{index + 1}</p>
                <p className="truncate font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.exactPredictions} exatos · {row.correctOutcomes} resultados
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold">{row.totalPoints}</p>
                <p className="text-xs text-muted-foreground">pts</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden md:block">
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
