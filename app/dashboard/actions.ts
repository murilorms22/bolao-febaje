"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { manualFixtures } from "@/lib/manual-fixtures";
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

  const fixtureKey = text(formData, "fixture_key");
  const homeScore = scoreValue(formData, "home_score");
  const awayScore = scoreValue(formData, "away_score");
  const fixture = manualFixtures.find((item) => item.key === fixtureKey);

  if (!fixture) {
    redirectBack("error", "Jogo inválido.");
  }

  if (fixture.result) {
    redirectBack("error", "Este confronto já foi realizado e não aceita novos palpites.");
  }

  if (homeScore < 0 || awayScore < 0 || homeScore > 99 || awayScore > 99) {
    redirectBack("error", "O palpite deve ter placares de 0 a 99.");
  }

  const { error } = await supabase.from("manual_predictions").upsert(
    {
      user_id: user.id,
      fixture_key: fixtureKey,
      home_score: homeScore,
      away_score: awayScore,
    },
    { onConflict: "user_id,fixture_key" },
  );

  if (error) {
    redirectBack("error", error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/ranking");
  redirectBack("success", "Palpite salvo.");
}
