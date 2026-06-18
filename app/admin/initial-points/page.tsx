import { AdminMessage } from "@/components/admin/admin-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { importInitialPoints, updateInitialPoint } from "../actions";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  initial_points: number;
};

export default async function InitialPointsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: participants } = await supabase
    .from("profiles")
    .select("id, username, display_name, initial_points")
    .order("display_name")
    .returns<Profile[]>();

  return (
    <div className="space-y-6">
      <AdminMessage error={params.error} success={params.success} />
      <Card>
        <CardHeader>
          <CardTitle>Importar pontuação inicial</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={importInitialPoints} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv">CSV: nome,username,pontuacao_inicial</Label>
              <Textarea id="csv" name="csv" placeholder={"Maria,maria,12\nJoão,joao,8"} />
            </div>
            <SubmitButton pendingText="Importando...">Importar CSV</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pontuação inicial</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Pontuação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(participants || []).map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>{participant.display_name || participant.username}</TableCell>
                  <TableCell>{participant.username}</TableCell>
                  <TableCell>
                    <form id={`points-${participant.id}`} action={updateInitialPoint}>
                      <input type="hidden" name="id" value={participant.id} />
                      <Input
                        className="max-w-36"
                        name="initial_points"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={participant.initial_points}
                      />
                    </form>
                  </TableCell>
                  <TableCell>
                    <SubmitButton form={`points-${participant.id}`} size="sm" pendingText="Salvando...">
                      Salvar
                    </SubmitButton>
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
