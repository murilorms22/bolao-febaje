import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type RankingRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  total_points: number;
  exact_predictions: number;
  correct_outcomes: number;
};

export default async function RankingPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("ranking_view").select("*").returns<RankingRow[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ranking</h1>
        <p className="text-muted-foreground">Classificacao calculada a partir dos palpites encerrados.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">#</th>
                  <th className="py-3 pr-4">Nome</th>
                  <th className="py-3 pr-4">Pontos</th>
                  <th className="py-3 pr-4">Exatos</th>
                  <th className="py-3">Resultados</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((row, index) => (
                  <tr key={row.user_id} className="border-b last:border-0">
                    <td className="py-3 pr-4">{index + 1}</td>
                    <td className="py-3 pr-4">{row.display_name || row.username}</td>
                    <td className="py-3 pr-4 font-semibold">{row.total_points}</td>
                    <td className="py-3 pr-4">{row.exact_predictions}</td>
                    <td className="py-3">{row.correct_outcomes}</td>
                  </tr>
                ))}
                {!data?.length ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      O ranking aparece aqui quando houver resultados cadastrados.
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
