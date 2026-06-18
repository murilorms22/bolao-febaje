import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  { href: "/admin/participants", title: "Participantes", text: "Crie usuários, altere roles e resete senhas." },
  { href: "/admin/teams", title: "Times", text: "Cadastre seleções, códigos FIFA e bandeiras." },
  { href: "/admin/rounds", title: "Rodadas", text: "Organize fases, prazos e ordem do bolão." },
  { href: "/admin/matches", title: "Jogos", text: "Monte a tabela manual da Copa 2026." },
  { href: "/admin/results", title: "Resultados", text: "Lance placares e recalcule pontuações." },
  { href: "/admin/initial-points", title: "Pontuação inicial", text: "Ajuste pontos anteriores e importe CSV." },
];

export default function AdminPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Link key={card.href} href={card.href}>
          <Card className="h-full transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{card.text}</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
