import { AdminMessage } from "@/components/admin/admin-message";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { manualFixtures, scoreFixture, type ManualPrediction } from "@/lib/manual-fixtures";
import { createClient } from "@/lib/supabase/server";
import { savePrediction } from "./actions";

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
    <img className="h-8 w-11 rounded border object-cover" src={src} alt={`Bandeira ${name}`} />
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

  const [{ data: profile }, { data: predictions, error: predictionsError }] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", user?.id).single<Profile>(),
    supabase
      .from("manual_predictions")
      .select("fixture_key, home_score, away_score")
      .eq("user_id", user?.id)
      .returns<ManualPrediction[]>(),
  ]);

  const predictionsByFixture = new Map((predictions || []).map((prediction) => [prediction.fixture_key, prediction]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Palpites</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {profile?.display_name || profile?.username || "participante"}.
        </p>
      </div>

      <AdminMessage error={params.error || predictionsError?.message} success={params.success} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {manualFixtures.map((fixture) => {
          const prediction = predictionsByFixture.get(fixture.key);
          const score = scoreFixture(fixture, prediction);
          const isOpen = !fixture.result;

          return (
            <Card key={fixture.key} className={`relative h-full border-2 ${statusStyles[score.status]}`}>
              <Badge className="absolute right-2 top-2" variant="outline">
                +{score.points}
              </Badge>
              <CardHeader className="space-y-3 pb-3">
                <CardDescription className="pr-12 text-xs">{fixture.round}</CardDescription>
                <CardTitle className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                  <span className="flex min-w-0 flex-col items-center gap-2 text-center">
                    <Flag src={fixture.homeFlag} name={fixture.home} />
                    <span className="break-words leading-tight">{fixture.home}</span>
                  </span>
                  <span className="text-muted-foreground">x</span>
                  <span className="flex min-w-0 flex-col items-center gap-2 text-center">
                    <Flag src={fixture.awayFlag} name={fixture.away} />
                    <span className="break-words leading-tight">{fixture.away}</span>
                  </span>
                </CardTitle>
                <div className="text-center text-xl font-semibold">
                  {fixture.result ? `${fixture.result.home}x${fixture.result.away}` : "?x?"}
                </div>
                <p className="min-h-8 text-center text-xs text-muted-foreground">{statusText[score.status]}</p>
              </CardHeader>
              <CardContent>
                <form action={savePrediction} className="space-y-3">
                  <input type="hidden" name="fixture_key" value={fixture.key} />
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <Input
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
                  <SubmitButton className="w-full" size="sm" disabled={!isOpen} pendingText="Salvando...">
                    {prediction ? "Editar" : "Salvar"}
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
