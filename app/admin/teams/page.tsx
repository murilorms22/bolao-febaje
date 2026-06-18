import { AdminMessage } from "@/components/admin/admin-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { createTeam, deleteTeam, updateTeam } from "../actions";

type Team = {
  id: string;
  name: string;
  fifa_code: string | null;
  iso_code: string | null;
  flag_url: string | null;
  group_name: string | null;
};

export default async function TeamsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, fifa_code, iso_code, flag_url, group_name")
    .order("name")
    .returns<Team[]>();

  return (
    <div className="space-y-6">
      <AdminMessage error={params.error} success={params.success} />
      <Card>
        <CardHeader>
          <CardTitle>Criar time</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTeam} className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fifa_code">FIFA</Label>
              <Input id="fifa_code" name="fifa_code" maxLength={3} placeholder="BRA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iso_code">ISO</Label>
              <Input id="iso_code" name="iso_code" maxLength={2} placeholder="br" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group_name">Grupo</Label>
              <Input id="group_name" name="group_name" placeholder="A" />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="flag_url">Bandeira</Label>
              <Input id="flag_url" name="flag_url" placeholder="https://flagcdn.com/w80/br.png" />
            </div>
            <div className="flex items-end">
              <SubmitButton pendingText="Criando...">Criar</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Times</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bandeira</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>FIFA</TableHead>
                <TableHead>ISO</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(teams || []).map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    {team.flag_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="h-7 w-10 object-cover" src={team.flag_url} alt={`Bandeira ${team.name}`} />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <form id={`team-${team.id}`} action={updateTeam}>
                      <input type="hidden" name="id" value={team.id} />
                      <Input name="name" defaultValue={team.name} required />
                    </form>
                  </TableCell>
                  <TableCell>
                    <Input form={`team-${team.id}`} name="fifa_code" defaultValue={team.fifa_code || ""} maxLength={3} />
                  </TableCell>
                  <TableCell>
                    <Input form={`team-${team.id}`} name="iso_code" defaultValue={team.iso_code || ""} maxLength={2} />
                  </TableCell>
                  <TableCell>
                    <Input form={`team-${team.id}`} name="group_name" defaultValue={team.group_name || ""} />
                  </TableCell>
                  <TableCell>
                    <Input form={`team-${team.id}`} name="flag_url" defaultValue={team.flag_url || ""} />
                  </TableCell>
                  <TableCell className="space-y-2">
                    <SubmitButton form={`team-${team.id}`} size="sm" pendingText="Salvando...">
                      Salvar
                    </SubmitButton>
                    <form action={deleteTeam}>
                      <input type="hidden" name="id" value={team.id} />
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
