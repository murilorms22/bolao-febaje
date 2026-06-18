import { AdminMessage } from "@/components/admin/admin-message";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import {
  createParticipant,
  recreateAllUserAuthLogins,
  recreateParticipantAuthLogin,
  resetAllFebajePasswords,
  resetParticipantPassword,
  updateParticipant,
} from "../actions";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  role: "admin" | "user";
  initial_points: number;
  must_change_password: boolean;
};

export default async function ParticipantsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: participants } = await supabase
    .from("profiles")
    .select("id, username, display_name, role, initial_points, must_change_password")
    .order("display_name", { ascending: true })
    .returns<Profile[]>();

  return (
    <div className="space-y-6">
      <AdminMessage error={params.error} success={params.success} />

      <Card>
        <CardHeader>
          <CardTitle>Reparar logins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Use “Recriar logins” para usuários que foram montados manualmente no Supabase Auth e não conseguem entrar.
            Isso cria Auth corretamente via Admin API, preserva profiles e palpites, e define a senha 12345678.
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={recreateAllUserAuthLogins}>
              <SubmitButton pendingText="Recriando logins...">Recriar logins dos usuários</SubmitButton>
            </form>
            <form action={resetAllFebajePasswords}>
              <SubmitButton variant="outline" pendingText="Resetando senhas...">
                Resetar senhas para 12345678
              </SubmitButton>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criar participante</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createParticipant} className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" defaultValue="user">
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial_points">Pontuação</Label>
              <Input id="initial_points" name="initial_points" type="number" min="0" step="0.01" defaultValue="0" />
            </div>
            <div className="md:col-span-5">
              <SubmitButton pendingText="Criando...">Criar com senha 12345678</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Pontuação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(participants || []).map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    <form id={`participant-${participant.id}`} action={updateParticipant} className="space-y-2">
                      <input type="hidden" name="id" value={participant.id} />
                      <Input name="name" defaultValue={participant.display_name || ""} required />
                    </form>
                  </TableCell>
                  <TableCell>
                    <Input form={`participant-${participant.id}`} name="username" defaultValue={participant.username} required />
                  </TableCell>
                  <TableCell>
                    <Select form={`participant-${participant.id}`} name="role" defaultValue={participant.role}>
                      <option value="user">Usuário</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      form={`participant-${participant.id}`}
                      name="initial_points"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={participant.initial_points}
                    />
                  </TableCell>
                  <TableCell className="space-y-2">
                    <Badge variant={participant.role === "admin" ? "secondary" : "outline"}>
                      {participant.role === "admin" ? "Admin" : "Usuário"}
                    </Badge>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        form={`participant-${participant.id}`}
                        type="checkbox"
                        name="must_change_password"
                        defaultChecked={participant.must_change_password}
                      />
                      Trocar senha
                    </label>
                  </TableCell>
                  <TableCell className="space-y-2">
                    <SubmitButton form={`participant-${participant.id}`} size="sm" pendingText="Salvando...">
                      Salvar
                    </SubmitButton>
                    <form action={resetParticipantPassword}>
                      <input type="hidden" name="id" value={participant.id} />
                      <SubmitButton size="sm" variant="outline" pendingText="Resetando...">
                        Resetar senha
                      </SubmitButton>
                    </form>
                    <form action={recreateParticipantAuthLogin}>
                      <input type="hidden" name="id" value={participant.id} />
                      <SubmitButton size="sm" variant="outline" pendingText="Recriando...">
                        Recriar login
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
