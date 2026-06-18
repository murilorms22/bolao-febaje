"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut}>
      <LogOut className="h-4 w-4" />
      Sair
    </Button>
  );
}
