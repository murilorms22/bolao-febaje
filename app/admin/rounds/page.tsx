import { AdminMessage } from "@/components/admin/admin-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { createRound, deleteRound, updateRound } from "../actions";

const phases = [
  ["group_stage", "Fase de grupos"],
  ["round_of_32", "32 avos"],
  ["round_of_16", "Oitavas"],
  ["quarter_final", "Quartas"],
  ["semi_final", "Semifinal"],
  ["third_place", "Terceiro lugar"],
  ["final", "Final"],
];

type Round = {
  id: string;
  name: string;
  phase: string;
  round_number: number;
  starts_at: string | null;
  prediction_deadline: string | null;
};

function dateValue(value: string | null) {
  return value ? value.slice(0, 16) : "";
}

export default async function RoundsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, name, phase, round_number, starts_at, prediction_deadline")
    .order("round_number")
    .returns<Round[]>();

  return (
    <div className="space-y-6">
      <AdminMessage error={params.error} success={params.success} />
      <Card>
        <CardHeader>
          <CardTitle>Criar rodada</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRound} className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phase">Fase</Label>
              <Select id="phase" name="phase" defaultValue="group_stage">
                {phases.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="round_number">Número</Label>
              <Input id="round_number" name="round_number" type="number" min="0" defaultValue="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="starts_at">Início</Label>
              <Input id="starts_at" name="starts_at" type="datetime-local" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="prediction_deadline">Prazo de palpites</Label>
              <Input id="prediction_deadline" name="prediction_deadline" type="datetime-local" />
            </div>
            <div className="flex items-end">
              <SubmitButton pendingText="Criando...">Criar</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rodadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(rounds || []).map((round) => (
                <TableRow key={round.id}>
                  <TableCell>
                    <form id={`round-${round.id}`} action={updateRound}>
                      <input type="hidden" name="id" value={round.id} />
                      <Input name="name" defaultValue={round.name} required />
                    </form>
                  </TableCell>
                  <TableCell>
                    <Select form={`round-${round.id}`} name="phase" defaultValue={round.phase}>
                      {phases.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input form={`round-${round.id}`} name="round_number" type="number" min="0" defaultValue={round.round_number} />
                  </TableCell>
                  <TableCell>
                    <Input form={`round-${round.id}`} name="starts_at" type="datetime-local" defaultValue={dateValue(round.starts_at)} />
                  </TableCell>
                  <TableCell>
                    <Input
                      form={`round-${round.id}`}
                      name="prediction_deadline"
                      type="datetime-local"
                      defaultValue={dateValue(round.prediction_deadline)}
                    />
                  </TableCell>
                  <TableCell className="space-y-2">
                    <SubmitButton form={`round-${round.id}`} size="sm" pendingText="Salvando...">
                      Salvar
                    </SubmitButton>
                    <form action={deleteRound}>
                      <input type="hidden" name="id" value={round.id} />
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
