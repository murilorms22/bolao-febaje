"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  async function signOut() {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  return (
    <Button className={cn("w-full sm:w-auto", className)} variant="ghost" size="sm" onClick={signOut} disabled={isLoading}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {isLoading ? "Saindo..." : "Sair"}
    </Button>
  );
}
