import Link from "next/link";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin/participants", label: "Participantes" },
  { href: "/admin/results", label: "Placares" },
  { href: "/admin/initial-points", label: "Pontuação inicial" },
];

export function AdminNav() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <nav className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Button key={link.href} asChild variant="outline" size="sm">
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </nav>
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard">Voltar ao dashboard</Link>
      </Button>
    </div>
  );
}
