"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { usernameToEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCatalogTeam, round2Fixtures, round2StartDateTime, round2Teams } from "@/lib/world-cup-round2";

const phaseWeights: Record<string, number> = {
  group_stage: 1,
  round_of_32: 2,
  round_of_16: 2,
  quarter_final: 2,
  semi_final: 2,
  third_place: 2,
  final: 3,
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: isAdmin } = await supabase.rpc("has_role", { role_name: "admin" });

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return supabase;
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = text(formData, key);
  return value === "" ? fallback : Number(value);
}

function redirectBack(path: string, type: "success" | "error", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function getAdminClientOrRedirect(path: string) {
  try {
    return createAdminClient();
  } catch (error) {
    redirectBack(path, "error", error instanceof Error ? error.message : "Configure a service role.");
  }
}

export async function createParticipant(formData: FormData) {
  const path = "/admin/participants";
  await requireAdmin();

  const name = text(formData, "name");
  const username = text(formData, "username").toLowerCase();
  const role = text(formData, "role") === "admin" ? "admin" : "user";
  const initialPoints = numberValue(formData, "initial_points");

  if (!name) redirectBack(path, "error", "Informe o nome.");
  if (!username) redirectBack(path, "error", "Informe o usuário.");
  if (initialPoints < 0) redirectBack(path, "error", "Pontuação inicial não pode ser negativa.");

  const admin = getAdminClientOrRedirect(path);
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password: "12345678",
    email_confirm: true,
    user_metadata: { username, display_name: name },
  });

  if (error || !data.user) {
    redirectBack(path, "error", error?.message || "Não foi possível criar o usuário Auth.");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      username,
      display_name: name,
      role,
      initial_points: initialPoints,
      must_change_password: true,
    })
    .eq("id", data.user.id);

  if (profileError) {
    redirectBack(path, "error", profileError.message);
  }

  revalidatePath(path);
  redirectBack(path, "success", "Participante criado.");
}

export async function updateParticipant(formData: FormData) {
  const path = "/admin/participants";
  await requireAdmin();

  const id = text(formData, "id");
  const name = text(formData, "name");
  const username = text(formData, "username").toLowerCase();
  const role = text(formData, "role") === "admin" ? "admin" : "user";
  const initialPoints = numberValue(formData, "initial_points");
  const mustChangePassword = formData.get("must_change_password") === "on";

  if (!id) redirectBack(path, "error", "Participante inválido.");
  if (!name) redirectBack(path, "error", "Informe o nome.");
  if (!username) redirectBack(path, "error", "Informe o usuário.");
  if (initialPoints < 0) redirectBack(path, "error", "Pontuação inicial não pode ser negativa.");

  const admin = getAdminClientOrRedirect(path);
  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    email: usernameToEmail(username),
    user_metadata: { username, display_name: name },
  });

  if (authError) redirectBack(path, "error", authError.message);

  const { error } = await admin
    .from("profiles")
    .update({
      username,
      display_name: name,
      role,
      initial_points: initialPoints,
      must_change_password: mustChangePassword,
    })
    .eq("id", id);

  if (error) {
    redirectBack(path, "error", error.message);
  }

  revalidatePath(path);
  redirectBack(path, "success", "Participante salvo.");
}

export async function resetParticipantPassword(formData: FormData) {
  const path = "/admin/participants";
  await requireAdmin();
  const id = text(formData, "id");

  const admin = getAdminClientOrRedirect(path);
  const { error: authError } = await admin.auth.admin.updateUserById(id, { password: "12345678" });
  if (authError) redirectBack(path, "error", authError.message);

  const { error } = await admin.from("profiles").update({ must_change_password: true }).eq("id", id);
  if (error) redirectBack(path, "error", error.message);

  revalidatePath(path);
  redirectBack(path, "success", "Senha resetada para 12345678.");
}

export async function createTeam(formData: FormData) {
  const path = "/admin/teams";
  const supabase = await requireAdmin();
  const name = text(formData, "name");
  const fifaCode = nullableText(formData, "fifa_code")?.toUpperCase() || null;
  const isoCode = nullableText(formData, "iso_code")?.toLowerCase() || null;
  const flagUrl = nullableText(formData, "flag_url") || (isoCode ? `https://flagcdn.com/w80/${isoCode}.png` : null);

  if (!name) redirectBack(path, "error", "Informe o nome do time.");

  const { error } = await supabase.from("teams").insert({
    name,
    fifa_code: fifaCode,
    iso_code: isoCode,
    flag_url: flagUrl,
    group_name: nullableText(formData, "group_name"),
  });

  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  redirectBack(path, "success", "Time criado.");
}

export async function updateTeam(formData: FormData) {
  const path = "/admin/teams";
  const supabase = await requireAdmin();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const fifaCode = nullableText(formData, "fifa_code")?.toUpperCase() || null;
  const isoCode = nullableText(formData, "iso_code")?.toLowerCase() || null;
  const flagUrl = nullableText(formData, "flag_url") || (isoCode ? `https://flagcdn.com/w80/${isoCode}.png` : null);

  if (!name) redirectBack(path, "error", "Informe o nome do time.");

  const { error } = await supabase
    .from("teams")
    .update({ name, fifa_code: fifaCode, iso_code: isoCode, flag_url: flagUrl, group_name: nullableText(formData, "group_name") })
    .eq("id", id);

  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  redirectBack(path, "success", "Time salvo.");
}

export async function deleteTeam(formData: FormData) {
  const path = "/admin/teams";
  const supabase = await requireAdmin();
  const id = text(formData, "id");

  const { count } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .or(`home_team_id.eq.${id},away_team_id.eq.${id}`);

  if (count) redirectBack(path, "error", "Não é possível excluir time vinculado a jogos.");

  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  redirectBack(path, "success", "Time excluído.");
}

export async function createRound(formData: FormData) {
  const path = "/admin/rounds";
  const supabase = await requireAdmin();
  const name = text(formData, "name");
  const phase = text(formData, "phase") || "group_stage";
  const roundNumber = numberValue(formData, "round_number");

  if (!name) redirectBack(path, "error", "Informe o nome da rodada.");
  if (roundNumber < 0) redirectBack(path, "error", "Número da rodada não pode ser negativo.");

  const { error } = await supabase.from("rounds").insert({
    name,
    phase,
    round_number: roundNumber,
    sort_order: roundNumber,
    weight: phaseWeights[phase] || 1,
    starts_at: nullableText(formData, "starts_at"),
    prediction_deadline: nullableText(formData, "prediction_deadline"),
  });

  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  redirectBack(path, "success", "Rodada criada.");
}

export async function updateRound(formData: FormData) {
  const path = "/admin/rounds";
  const supabase = await requireAdmin();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const phase = text(formData, "phase") || "group_stage";
  const roundNumber = numberValue(formData, "round_number");

  if (!name) redirectBack(path, "error", "Informe o nome da rodada.");
  if (roundNumber < 0) redirectBack(path, "error", "Número da rodada não pode ser negativo.");

  const { error } = await supabase
    .from("rounds")
    .update({
      name,
      phase,
      round_number: roundNumber,
      sort_order: roundNumber,
      weight: phaseWeights[phase] || 1,
      starts_at: nullableText(formData, "starts_at"),
      prediction_deadline: nullableText(formData, "prediction_deadline"),
    })
    .eq("id", id);

  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  redirectBack(path, "success", "Rodada salva.");
}

export async function deleteRound(formData: FormData) {
  const path = "/admin/rounds";
  const supabase = await requireAdmin();
  const id = text(formData, "id");
  const { count } = await supabase.from("matches").select("id", { count: "exact", head: true }).eq("round_id", id);

  if (count) redirectBack(path, "error", "Não é possível excluir rodada com jogos.");

  const { error } = await supabase.from("rounds").delete().eq("id", id);
  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  redirectBack(path, "success", "Rodada excluída.");
}

export async function createMatch(formData: FormData) {
  const path = "/admin/matches";
  const supabase = await requireAdmin();
  const roundId = text(formData, "round_id");
  const homeTeamId = text(formData, "home_team_id");
  const awayTeamId = text(formData, "away_team_id");
  const phase = text(formData, "phase") || "group_stage";
  const weight = numberValue(formData, "weight", phaseWeights[phase] || 1);

  if (!roundId || !homeTeamId || !awayTeamId || !text(formData, "starts_at")) {
    redirectBack(path, "error", "Informe rodada, times e data.");
  }
  if (homeTeamId === awayTeamId) redirectBack(path, "error", "Mandante e visitante devem ser diferentes.");

  const { error } = await supabase.from("matches").insert({
    round_id: roundId,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    match_at: text(formData, "starts_at"),
    status: text(formData, "status") || "scheduled",
    phase,
    weight,
  });

  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  redirectBack(path, "success", "Jogo criado.");
}

async function ensureCatalogTeam(supabase: Awaited<ReturnType<typeof createClient>>, teamName: string) {
  const catalogTeam = getCatalogTeam(teamName);

  if (!catalogTeam) {
    throw new Error("Seleção inválida para a Rodada 2.");
  }

  const { data: existingTeam, error: existingError } = await supabase
    .from("teams")
    .select("id")
    .eq("fifa_code", catalogTeam.fifaCode)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingTeam) {
    const { error } = await supabase
      .from("teams")
      .update({
        name: catalogTeam.name,
        iso_code: catalogTeam.isoCode,
        flag_url: catalogTeam.flagUrl,
      })
      .eq("id", existingTeam.id);

    if (error) {
      throw new Error(error.message);
    }

    return existingTeam.id as string;
  }

  const { data: createdTeam, error } = await supabase
    .from("teams")
    .insert({
      name: catalogTeam.name,
      fifa_code: catalogTeam.fifaCode,
      iso_code: catalogTeam.isoCode,
      flag_url: catalogTeam.flagUrl,
    })
    .select("id")
    .single();

  if (error || !createdTeam) {
    throw new Error(error?.message || "Não foi possível criar a seleção.");
  }

  return createdTeam.id as string;
}

export async function createRound2CatalogMatch(formData: FormData) {
  const path = "/admin/matches";
  const supabase = await requireAdmin();
  const roundId = text(formData, "round_id");
  const homeTeamName = text(formData, "home_team_name");
  const awayTeamName = text(formData, "away_team_name");
  const startsAt = text(formData, "starts_at");

  if (!roundId || !homeTeamName || !awayTeamName || !startsAt) {
    redirectBack(path, "error", "Informe rodada, seleções e data.");
  }

  if (homeTeamName === awayTeamName) {
    redirectBack(path, "error", "Mandante e visitante devem ser diferentes.");
  }

  try {
    const homeTeamId = await ensureCatalogTeam(supabase, homeTeamName);
    const awayTeamId = await ensureCatalogTeam(supabase, awayTeamName);

    const { error } = await supabase.from("matches").insert({
      round_id: roundId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_at: startsAt,
      status: "scheduled",
      phase: "group_stage",
      weight: 1,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirectBack(path, "error", error instanceof Error ? error.message : "Erro ao cadastrar jogo.");
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirectBack(path, "success", "Jogo da Rodada 2 cadastrado.");
}

export async function importRound2Fixtures() {
  const path = "/admin/matches";
  const supabase = await requireAdmin();
  const startsAt = round2StartDateTime;
  const predictionDeadline = "2026-06-18T12:59";

  const teamsPayload = round2Teams.map((team) => ({
    name: team.name,
    fifa_code: team.fifaCode,
    iso_code: team.isoCode,
    flag_url: team.flagUrl,
  }));

  const { error: teamsError } = await supabase.from("teams").upsert(teamsPayload, {
    onConflict: "fifa_code",
  });

  if (teamsError) {
    redirectBack(path, "error", teamsError.message);
  }

  const { data: existingRound } = await supabase
    .from("rounds")
    .select("id")
    .eq("name", "Fase de Grupos - Rodada 2")
    .maybeSingle();

  let roundId = existingRound?.id as string | undefined;

  if (!roundId) {
    const { data: lastRound } = await supabase
      .from("rounds")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: createdRound, error } = await supabase
      .from("rounds")
      .insert({
        name: "Fase de Grupos - Rodada 2",
        phase: "group_stage",
        round_number: 2,
        sort_order: Number(lastRound?.sort_order || 0) + 1,
        weight: 1,
        starts_at: startsAt,
        prediction_deadline: predictionDeadline,
      })
      .select("id")
      .single();

    if (error || !createdRound) {
      redirectBack(path, "error", error?.message || "Não foi possível criar a rodada.");
    }

    roundId = createdRound.id as string;
  } else {
    await supabase
      .from("rounds")
      .update({
        phase: "group_stage",
        round_number: 2,
        starts_at: startsAt,
        prediction_deadline: predictionDeadline,
      })
      .eq("id", roundId);
  }

  const { data: teams, error: teamsReadError } = await supabase
    .from("teams")
    .select("id, name")
    .in(
      "fifa_code",
      round2Teams.map((team) => team.fifaCode),
    );

  if (teamsReadError || !teams) {
    redirectBack(path, "error", teamsReadError?.message || "Não foi possível carregar as seleções.");
  }

  const teamIdsByName = new Map(teams.map((team) => [String(team.name), String(team.id)]));

  const { data: existingMatches, error: existingMatchesError } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id")
    .eq("round_id", roundId);

  if (existingMatchesError) {
    redirectBack(path, "error", existingMatchesError.message);
  }

  const existingKeys = new Set(
    (existingMatches || []).map((match) => `${match.home_team_id}:${match.away_team_id}`),
  );

  const matchesPayload = round2Fixtures.flatMap(([homeTeamName, awayTeamName]) => {
    const homeTeamId = teamIdsByName.get(homeTeamName);
    const awayTeamId = teamIdsByName.get(awayTeamName);

    if (!homeTeamId || !awayTeamId || existingKeys.has(`${homeTeamId}:${awayTeamId}`)) {
      return [];
    }

    return [
      {
        round_id: roundId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        match_at: startsAt,
        status: "scheduled",
        phase: "group_stage",
        weight: 1,
        result_confirmed: false,
      },
    ];
  });

  if (matchesPayload.length) {
    const { error: matchesError } = await supabase.from("matches").insert(matchesPayload);

    if (matchesError) {
      redirectBack(path, "error", matchesError.message);
    }
  }

  const skipped = round2Fixtures.length - matchesPayload.length;

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirectBack(path, "success", `Rodada 2 importada: ${matchesPayload.length} criados, ${skipped} já existiam.`);
}

export async function updateMatch(formData: FormData) {
  const path = "/admin/matches";
  const supabase = await requireAdmin();
  const id = text(formData, "id");
  const roundId = text(formData, "round_id");
  const homeTeamId = text(formData, "home_team_id");
  const awayTeamId = text(formData, "away_team_id");
  const phase = text(formData, "phase") || "group_stage";

  if (homeTeamId === awayTeamId) redirectBack(path, "error", "Mandante e visitante devem ser diferentes.");

  const { error } = await supabase
    .from("matches")
    .update({
      round_id: roundId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_at: text(formData, "starts_at"),
      status: text(formData, "status"),
      phase,
      weight: numberValue(formData, "weight", phaseWeights[phase] || 1),
    })
    .eq("id", id);

  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  redirectBack(path, "success", "Jogo salvo.");
}

export async function deleteMatch(formData: FormData) {
  const path = "/admin/matches";
  const supabase = await requireAdmin();
  const id = text(formData, "id");
  const { count } = await supabase.from("predictions").select("id", { count: "exact", head: true }).eq("match_id", id);

  if (count) redirectBack(path, "error", "Não é possível excluir jogo com palpites.");

  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  redirectBack(path, "success", "Jogo excluído.");
}

export async function saveResult(formData: FormData) {
  const path = "/admin/results";
  const supabase = await requireAdmin();
  const id = text(formData, "id");
  const homeScore = numberValue(formData, "home_score");
  const awayScore = numberValue(formData, "away_score");

  if (homeScore < 0 || awayScore < 0 || homeScore > 99 || awayScore > 99) {
    redirectBack(path, "error", "Placar deve ter números de 0 a 99.");
  }

  const { error } = await supabase
    .from("matches")
    .update({ home_score: homeScore, away_score: awayScore, status: "finished" })
    .eq("id", id);

  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  redirectBack(path, "success", "Placar salvo.");
}

export async function confirmResult(formData: FormData) {
  const path = "/admin/results";
  const supabase = await requireAdmin();
  const id = text(formData, "id");

  const { error } = await supabase
    .from("matches")
    .update({ status: "confirmed", result_confirmed: true })
    .eq("id", id);

  if (error) redirectBack(path, "error", error.message);

  const { error: pointsError } = await supabase.rpc("calculate_prediction_points", { p_match_id: id });
  if (pointsError) redirectBack(path, "error", pointsError.message);

  revalidatePath(path);
  revalidatePath("/ranking");
  redirectBack(path, "success", "Resultado confirmado e pontuação recalculada.");
}

export async function recalculateResult(formData: FormData) {
  const path = "/admin/results";
  const supabase = await requireAdmin();
  const id = text(formData, "id");
  const { error } = await supabase.rpc("calculate_prediction_points", { p_match_id: id });

  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  revalidatePath("/ranking");
  redirectBack(path, "success", "Pontuação recalculada.");
}

export async function updateInitialPoint(formData: FormData) {
  const path = "/admin/initial-points";
  const supabase = await requireAdmin();
  const id = text(formData, "id");
  const initialPoints = numberValue(formData, "initial_points");

  if (initialPoints < 0) redirectBack(path, "error", "Pontuação inicial não pode ser negativa.");

  const { error } = await supabase.from("profiles").update({ initial_points: initialPoints }).eq("id", id);
  if (error) redirectBack(path, "error", error.message);
  revalidatePath(path);
  revalidatePath("/ranking");
  redirectBack(path, "success", "Pontuação inicial salva.");
}

export async function importInitialPoints(formData: FormData) {
  const path = "/admin/initial-points";
  const supabase = await requireAdmin();
  const csv = text(formData, "csv");
  let updated = 0;
  let errors = 0;

  for (const line of csv.split(/\r?\n/)) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    const [name, usernameRaw, pointsRaw] = cleanLine.split(",").map((part) => part.trim());
    const username = (usernameRaw || name || "").toLowerCase();
    const points = Number(pointsRaw);

    if (!username || Number.isNaN(points) || points < 0) {
      errors += 1;
      continue;
    }

    const { data: profile } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (!profile) {
      errors += 1;
      continue;
    }

    const { error } = await supabase.from("profiles").update({ initial_points: points }).eq("id", profile.id);
    if (error) errors += 1;
    else updated += 1;
  }

  revalidatePath(path);
  revalidatePath("/ranking");
  redirectBack(path, "success", `Importação concluída: ${updated} atualizados, ${errors} com erro.`);
}
