"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ranking", label: "Ranking" },
  { href: "/comparacoes", label: "Comparações" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const showNav = pathname !== "/auth";
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3" onClick={() => setIsOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="h-11 w-11 shrink-0 object-contain" src="/copa20262.png" alt="Copa 2026" />
            <span className="min-w-0 space-y-1">
              <p className="text-xl font-bold tracking-tight">FEBAJE</p>
              <p className="truncate text-sm text-muted-foreground">Bolão da Copa do Mundo 2026</p>
            </span>
          </Link>

          {showNav ? (
            <>
              <nav className="hidden items-center gap-2 text-sm md:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-center hover:bg-accent",
                      pathname.startsWith(link.href) ? "bg-accent text-accent-foreground" : null,
                    )}
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <Button
                className="md:hidden"
                variant="outline"
                size="icon"
                aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : null}
        </div>
      </header>

      {showNav && isOpen ? (
        <div className="fixed inset-0 z-30 bg-background md:hidden">
          <div className="flex h-full flex-col px-4 pb-6 pt-24">
            <nav className="grid gap-2 text-base">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  className={cn(
                    "rounded-md border px-4 py-3 hover:bg-accent",
                    pathname.startsWith(link.href) ? "bg-accent text-accent-foreground" : null,
                  )}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-2 border-t pt-4">
              <ThemeToggle />
              <SignOutButton className="justify-start" />
            </div>
          </div>
        </div>
      ) : null}

      {showNav ? (
        <div className="fixed bottom-4 left-4 z-30 hidden w-48 rounded-lg border bg-card p-2 shadow-sm md:block">
          <div className="space-y-1">
            <ThemeToggle />
            <SignOutButton className="justify-start" />
          </div>
        </div>
      ) : null}
    </>
  );
}
