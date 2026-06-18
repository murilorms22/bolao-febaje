import { AdminMessage } from "@/components/admin/admin-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { confirmResult, recalculateResult, saveResult } from "../actions";

const statuses = [
  ["scheduled", "Agendado"],
  ["locked", "Travado"],
  ["finished", "Finalizado"],
  ["confirmed", "Confirmado"],
  ["cancelled", "Cancelado"],
];

type Round = { id: string; name: string };
type Match = {
  id: string;
  match_at: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  result_confirmed: boolean;
  rounds: { name: string } | null;
  home_team: { name: string; flag_url: string | null } | null;
  away_team: { name: string; flag_url: string | null } | null;
};

function dateText(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}

export default async function ResultsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const selectedRound = typeof params.round === "string" ? params.round : "";
  const selectedStatus = typeof params.status === "string" ? params.status : "";

  const { data: rounds } = await supabase.from("rounds").select("id, name").order("round_number").returns<Round[]>();

  let query = supabase
    .from("matches")
    .select(
      "id, match_at, status, home_score, away_score, result_confirmed, rounds(name), home_team:teams!matches_home_team_id_fkey(name, flag_url), away_team:teams!matches_away_team_id_fkey(name, flag_url)",
    )
    .order("match_at", { ascending: true });

  if (selectedRound) query = query.eq("round_id", selectedRound);
  if (selectedStatus) query = query.eq("status", selectedStatus);

  const { data: matches } = await query.returns<Match[]>();

  return (
    <div className="space-y-6">
      <AdminMessage error={params.error} success={params.success} />
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap gap-3">
            <Select name="round" defaultValue={selectedRound} className="max-w-56">
              <option value="">Todas as rodadas</option>
              {(rounds || []).map((round) => (
                <option key={round.id} value={round.id}>
                  {round.name}
                </option>
              ))}
            </Select>
            <Select name="status" defaultValue={selectedStatus} className="max-w-48">
              <option value="">Todos os status</option>
              {statuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Button variant="outline">Filtrar</Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rodada</TableHead>
                <TableHead>Jogo</TableHead>
                <TableHead>Data/hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placar salvo</TableHead>
                <TableHead>Novo placar</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(matches || []).map((match) => (
                <TableRow key={match.id}>
                  <TableCell>{match.rounds?.name || "-"}</TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {match.home_team?.name || "-"} x {match.away_team?.name || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{dateText(match.match_at)}</TableCell>
                  <TableCell className="space-y-2">
                    <Badge variant={match.status === "confirmed" ? "secondary" : "outline"}>{match.status}</Badge>
                    {match.result_confirmed ? <Badge variant="default">Confirmado</Badge> : null}
                  </TableCell>
                  <TableCell>
                    {match.home_score ?? "-"} x {match.away_score ?? "-"}
                  </TableCell>
                  <TableCell>
                    <form id={`result-${match.id}`} action={saveResult} className="flex gap-2">
                      <input type="hidden" name="id" value={match.id} />
                      <Input
                        className="w-20"
                        name="home_score"
                        type="number"
                        min="0"
                        max="99"
                        defaultValue={match.home_score ?? ""}
                        required
                      />
                      <Input
                        className="w-20"
                        name="away_score"
                        type="number"
                        min="0"
                        max="99"
                        defaultValue={match.away_score ?? ""}
                        required
                      />
                    </form>
                  </TableCell>
                  <TableCell className="space-y-2">
                    <SubmitButton form={`result-${match.id}`} size="sm" pendingText="Salvando...">
                      Salvar placar
                    </SubmitButton>
                    <form action={confirmResult}>
                      <input type="hidden" name="id" value={match.id} />
                      <SubmitButton size="sm" variant="outline" pendingText="Confirmando...">
                        Confirmar
                      </SubmitButton>
                    </form>
                    <form action={recalculateResult}>
                      <input type="hidden" name="id" value={match.id} />
                      <SubmitButton size="sm" variant="outline" pendingText="Recalculando...">
                        Recalcular
                      </SubmitButton>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
