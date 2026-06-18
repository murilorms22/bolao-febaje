"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function scoreValue(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  return Number.isInteger(value) ? value : Number.NaN;
}

function redirectBack(type: "success" | "error", message: string): never {
  redirect(`/dashboard?${type}=${encodeURIComponent(message)}`);
}

export async function savePrediction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const matchId = text(formData, "match_id");
  const homeScore = scoreValue(formData, "home_score");
  const awayScore = scoreValue(formData, "away_score");

  if (!matchId) {
    redirectBack("error", "Jogo inválido.");
  }

  if (homeScore < 0 || awayScore < 0 || homeScore > 99 || awayScore > 99) {
    redirectBack("error", "O palpite deve ter placares de 0 a 99.");
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, status, match_at, rounds(prediction_deadline)")
    .eq("id", matchId)
    .single<{
      id: string;
      status: string;
      match_at: string | null;
      rounds: { prediction_deadline: string | null } | null;
    }>();

  if (matchError || !match) {
    redirectBack("error", "Jogo não encontrado.");
  }

  const deadline = match.rounds?.prediction_deadline || match.match_at;
  const isOpen = match.status === "scheduled" && (!deadline || new Date(deadline).getTime() > Date.now());

  if (!isOpen) {
    redirectBack("error", "O prazo para editar este palpite já encerrou.");
  }

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) {
    redirectBack("error", error.message);
  }

  revalidatePath("/dashboard");
  redirectBack("success", "Palpite salvo.");
}
