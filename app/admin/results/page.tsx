import { AdminMessage } from "@/components/admin/admin-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  applyManualResults,
  manualFixtures,
  manualRounds,
  type ManualFixtureResult,
} from "@/lib/manual-fixtures";
import { createClient } from "@/lib/supabase/server";
import { saveManualFixtureResult } from "../actions";
import { ResultForm } from "./result-form";

export const dynamic = "force-dynamic";

function Flag({ src, name }: { src: string; name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="h-7 w-10 shrink-0 rounded border object-cover" src={src} alt={`Bandeira ${name}`} />
  );
}

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selectedRound = typeof params.round === "string" ? params.round : manualRounds[manualRounds.length - 1];
  const supabase = await createClient();
  const { data: manualResults } = await supabase
    .from("manual_fixture_results")
    .select("fixture_key, home_score, away_score")
    .returns<ManualFixtureResult[]>();

  const fixturesWithResults = applyManualResults(manualFixtures, manualResults || []);
  const fixtures = fixturesWithResults.filter((fixture) => fixture.round === selectedRound);

  return (
    <div className="space-y-6">
      <AdminMessage error={params.error} success={params.success} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Placares dos jogos</h2>
          <p className="text-sm text-muted-foreground">
            Salve aqui somente resultados oficiais. A pontuação do ranking é recalculada a partir destes placares.
          </p>
        </div>
        <form className="w-full sm:w-72">
          <Select name="round" defaultValue={selectedRound} aria-label="Selecionar rodada">
            {manualRounds.map((round) => (
              <option key={round} value={round}>
                {round}
              </option>
            ))}
          </Select>
          <Button className="mt-2 w-full" size="sm" variant="outline">
            Ver rodada
          </Button>
        </form>
      </div>

      {!fixtures.length ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Ainda não existem jogos cadastrados para esta rodada. A próxima rodada precisa ser colocada hardcoded em
            lib/manual-fixtures.ts antes dos placares aparecerem aqui.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {fixtures.map((fixture) => {
            const isSaved = Boolean(fixture.result);

            return (
              <Card key={fixture.id} className="border-2">
                <CardHeader className="space-y-3 p-4 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardDescription className="text-xs">{fixture.round}</CardDescription>
                    <Badge variant={isSaved ? "default" : "outline"}>{isSaved ? "Placar salvo" : "Sem placar"}</Badge>
                  </div>
                  <CardTitle className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                    <span className="flex min-w-0 flex-col items-center gap-2 text-center">
                      <Flag src={fixture.homeFlag} name={fixture.home} />
                      <span className="min-w-0 break-words leading-tight">{fixture.home}</span>
                    </span>
                    <span className="text-muted-foreground">x</span>
                    <span className="flex min-w-0 flex-col items-center gap-2 text-center">
                      <Flag src={fixture.awayFlag} name={fixture.away} />
                      <span className="min-w-0 break-words leading-tight">{fixture.away}</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ResultForm action={saveManualFixtureResult}>
                    <input type="hidden" name="fixture_key" value={fixture.id} />
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                      <Input
                        className="h-11 text-center text-base font-medium"
                        aria-label={`Placar ${fixture.home}`}
                        name="home_score"
                        type="number"
                        min="0"
                        max="99"
                        defaultValue={fixture.result?.home ?? ""}
                        disabled={isSaved}
                        required
                      />
                      <span className="text-muted-foreground">x</span>
                      <Input
                        className="h-11 text-center text-base font-medium"
                        aria-label={`Placar ${fixture.away}`}
                        name="away_score"
                        type="number"
                        min="0"
                        max="99"
                        defaultValue={fixture.result?.away ?? ""}
                        disabled={isSaved}
                        required
                      />
                    </div>
                    <SubmitButton
                      className={
                        isSaved
                          ? "w-full bg-blue-600 text-white opacity-100 hover:bg-blue-600 disabled:opacity-100"
                          : "w-full"
                      }
                      disabled={isSaved}
                      pendingText="Salvando..."
                    >
                      {isSaved ? "Placar salvo" : "Salvar placar correto"}
                    </SubmitButton>
                  </ResultForm>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
