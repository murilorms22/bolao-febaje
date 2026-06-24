"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { manualFixtures, normalizeFixtureKey } from "@/lib/manual-fixtures";
import { createClient } from "@/lib/supabase/server";

const lockedPredictionRounds = new Set(["Fase de Grupos - Rodada 2"]);

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
  redirectBack("error", "Os palpites estão trancados no site. Os envios agora são manuais.");
}
