import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  { href: "/admin/participants", title: "Participantes", text: "Crie usuários, altere roles e resete senhas." },
  { href: "/admin/initial-points", title: "Pontuação inicial", text: "Ajuste pontos manualmente caso ocorra algum problema." },
];

export default function AdminPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
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
