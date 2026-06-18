import { AdminMessage } from "@/components/admin/admin-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { round2Fixtures } from "@/lib/world-cup-round2";
import { createMatch, deleteMatch, importRound2Fixtures, updateMatch } from "../actions";
import { CatalogMatchForm } from "./catalog-match-form";

const phases = [
  ["group_stage", "Fase de grupos", 1],
  ["round_of_32", "32 avos", 2],
  ["round_of_16", "Oitavas", 2],
  ["quarter_final", "Quartas", 2],
  ["semi_final", "Semifinal", 2],
  ["third_place", "Terceiro lugar", 2],
  ["final", "Final", 3],
] as const;

const statuses = [
  ["scheduled", "Agendado"],
  ["locked", "Travado"],
  ["finished", "Finalizado"],
  ["confirmed", "Confirmado"],
  ["cancelled", "Cancelado"],
];

type Team = { id: string; name: string; flag_url: string | null };
type Round = { id: string; name: string; phase: string };
type Match = {
  id: string;
  round_id: string;
  home_team_id: string;
  away_team_id: string;
  match_at: string | null;
  status: string;
  phase: string;
  weight: number;
  rounds: { name: string } | null;
  home_team: { name: string; flag_url: string | null } | null;
  away_team: { name: string; flag_url: string | null } | null;
};

function dateValue(value: string | null) {
  return value ? value.slice(0, 16) : "";
}

export default async function MatchesAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const selectedRound = typeof params.round === "string" ? params.round : "";
  const selectedStatus = typeof params.status === "string" ? params.status : "";

  const [{ data: teams }, { data: rounds }] = await Promise.all([
    supabase.from("teams").select("id, name, flag_url").order("name").returns<Team[]>(),
    supabase.from("rounds").select("id, name, phase").order("round_number").returns<Round[]>(),
  ]);

  let query = supabase
    .from("matches")
    .select(
      "id, round_id, home_team_id, away_team_id, match_at, status, phase, weight, rounds(name), home_team:teams!matches_home_team_id_fkey(name, flag_url), away_team:teams!matches_away_team_id_fkey(name, flag_url)",
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
          <CardTitle>Rodada 2 - cadastrar jogos com seleções da lista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={importRound2Fixtures}>
            <SubmitButton pendingText="Importando...">Importar todos os 24 jogos da Rodada 2</SubmitButton>
          </form>
          <CatalogMatchForm rounds={rounds || []} />
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            {round2Fixtures.map(([homeTeam, awayTeam]) => (
              <div key={`${homeTeam}-${awayTeam}`} className="rounded-md border px-3 py-2">
                {homeTeam} x {awayTeam}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criar jogo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMatch} className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="round_id">Rodada</Label>
              <Select id="round_id" name="round_id" required>
                <option value="">Selecione</option>
                {(rounds || []).map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_team_id">Mandante</Label>
              <Select id="home_team_id" name="home_team_id" required>
                <option value="">Selecione</option>
                {(teams || []).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="away_team_id">Visitante</Label>
              <Select id="away_team_id" name="away_team_id" required>
                <option value="">Selecione</option>
                {(teams || []).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="starts_at">Data/hora</Label>
              <Input id="starts_at" name="starts_at" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phase">Fase</Label>
              <Select id="phase" name="phase" defaultValue="group_stage">
                {phases.map(([value, label, weight]) => (
                  <option key={value} value={value}>
                    {label} (peso {weight})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso</Label>
              <Input id="weight" name="weight" type="number" min="0.01" step="0.01" defaultValue="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue="scheduled">
                {statuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <SubmitButton pendingText="Criando...">Criar</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jogos</CardTitle>
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
                <TableHead>Mandante</TableHead>
                <TableHead>Visitante</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(matches || []).map((match) => (
                <TableRow key={match.id}>
                  <TableCell>
                    <form id={`match-${match.id}`} action={updateMatch}>
                      <input type="hidden" name="id" value={match.id} />
                      <Select name="round_id" defaultValue={match.round_id}>
                        {(rounds || []).map((round) => (
                          <option key={round.id} value={round.id}>
                            {round.name}
                          </option>
                        ))}
                      </Select>
                    </form>
                  </TableCell>
                  <TableCell>
                    <Select form={`match-${match.id}`} name="home_team_id" defaultValue={match.home_team_id}>
                      {(teams || []).map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select form={`match-${match.id}`} name="away_team_id" defaultValue={match.away_team_id}>
                      {(teams || []).map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input form={`match-${match.id}`} name="starts_at" type="datetime-local" defaultValue={dateValue(match.match_at)} />
                  </TableCell>
                  <TableCell>
                    <Select form={`match-${match.id}`} name="status" defaultValue={match.status}>
                      {statuses.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                    <Badge className="mt-2" variant="outline">
                      {match.home_team?.name} x {match.away_team?.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select form={`match-${match.id}`} name="phase" defaultValue={match.phase}>
                      {phases.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input form={`match-${match.id}`} name="weight" type="number" min="0.01" step="0.01" defaultValue={match.weight} />
                  </TableCell>
                  <TableCell className="space-y-2">
                    <SubmitButton form={`match-${match.id}`} size="sm" pendingText="Salvando...">
                      Salvar
                    </SubmitButton>
                    <form action={deleteMatch}>
                      <input type="hidden" name="id" value={match.id} />
                      <SubmitButton size="sm" variant="outline" pendingText="Excluindo...">
                        Excluir
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
