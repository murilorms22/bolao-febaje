import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard" className="space-y-1">
          <p className="text-xl font-bold tracking-tight">FEBAJE</p>
          <p className="text-sm text-muted-foreground">Bolao da Copa do Mundo 2026</p>
        </Link>
        {user ? (
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link className="rounded-md px-3 py-2 hover:bg-accent" href="/dashboard">
              Dashboard
            </Link>
            <Link className="rounded-md px-3 py-2 hover:bg-accent" href="/ranking">
              Ranking
            </Link>
            <Link className="rounded-md px-3 py-2 hover:bg-accent" href="/admin">
              Admin
            </Link>
            <SignOutButton />
          </nav>
        ) : null}
      </div>
    </header>
  );
}
