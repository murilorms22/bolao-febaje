"use server";

import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { join } from "path";

import { usernameToEmail } from "@/lib/auth";
import { manualFixtures, normalizeFixtureKey } from "@/lib/manual-fixtures";
import { rodada2Predictions } from "@/lib/rodada2-predictions";
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

type RepairableProfile = {
  id: string;
  username: string;
  display_name: string | null;
  role: string;
  initial_points: number;
  must_change_password: boolean;
};

type ImportedParticipant = {
  username: string;
  displayName: string;
};

type ImportedPrediction = {
  username: string;
  fixtureKey: string;
  homeScore: number;
  awayScore: number;
};

const canonicalUsernameAliases: Record<string, string> = {
  "altemir": "altemir",
  "altemir da silva": "altemir",
  "altemir.da.silva": "altemir",
  "altermir": "altemir",
  "altermir da silva": "altemir",
  "altermir.da.silva": "altemir",
  "debora dallacort": "debora.dallacort",
  "debora.dallacort": "debora.dallacort",
  "susane.haas": "susane",
  "victor barreto": "victor.barreto",
  "victor.barreto": "victor.barreto",
  "raissa.remboski": "raissa",
};

const duplicateParticipantMerges = [
  {
    canonical: "altemir",
    displayName: "Altemir",
    aliases: ["altemir", "altemir da silva", "altemir.da.silva", "altermir", "altermir da silva", "altermir.da.silva"],
  },
  {
    canonical: "susane",
    displayName: "Susane",
    aliases: ["susane.haas"],
  },
  {
    canonical: "raissa",
    displayName: "Raissa",
    aliases: ["raissa.remboski"],
  },
];

function canonicalUsername(username: string) {
  const normalized = username.trim().toLowerCase();
  return canonicalUsernameAliases[normalized] || normalized;
}

function participantLookupKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function participantLookupValues(value: string) {
  const normalized = value.trim().toLowerCase();
  const canonical = canonicalUsername(normalized);
  return Array.from(
    new Set([
      normalized,
      canonical,
      participantLookupKey(normalized),
      participantLookupKey(canonical),
    ].filter(Boolean)),
  );
}

function parseSqlTuples(block: string) {
  return Array.from(block.matchAll(/\(([^()]*)\)/g)).map((match) =>
    Array.from(match[1].matchAll(/'([^']*)'|(-?\d+)/g)).map((valueMatch) => valueMatch[1] ?? valueMatch[2] ?? ""),
  );
}

async function loadImportCodigo() {
  const sql = await readFile(join(process.cwd(), "importarcodigo.txt"), "utf8");
  const usersBlock = sql.match(
    /with\s+users\(username,\s*display_name\)\s+as\s*\(\s*values\s*([\s\S]*?)\)\s*insert\s+into\s+auth\.users/i,
  )?.[1];
  const predictionsBlock = sql.match(
    /with\s+prediction_data\(username,\s*fixture_id,\s*home_score,\s*away_score\)\s+as\s*\(\s*values\s*([\s\S]*?)\)\s*insert\s+into\s+public\.manual_predictions/i,
  )?.[1];

  if (!usersBlock) {
    throw new Error("Nao encontrei o bloco de usuarios em importarcodigo.txt.");
  }

  if (!predictionsBlock) {
    throw new Error("Nao encontrei o bloco de palpites em importarcodigo.txt.");
  }

  const participants: ImportedParticipant[] = parseSqlTuples(usersBlock)
    .filter((tuple) => tuple.length >= 2)
    .map(([username, displayName]) => ({
      username: String(username).trim().toLowerCase(),
      displayName: String(displayName).trim(),
    }))
    .filter((participant) => participant.username && participant.displayName);

  const predictions: ImportedPrediction[] = parseSqlTuples(predictionsBlock)
    .filter((tuple) => tuple.length >= 4)
    .map(([username, fixtureKey, homeScore, awayScore]) => ({
      username: String(username).trim().toLowerCase(),
      fixtureKey: String(fixtureKey).trim(),
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
    }))
    .filter(
      (prediction) =>
        prediction.username &&
        prediction.fixtureKey &&
        Number.isInteger(prediction.homeScore) &&
        Number.isInteger(prediction.awayScore),
    );

  if (!participants.length) {
    throw new Error("Nenhum usuario valido encontrado em importarcodigo.txt.");
  }

  if (!predictions.length) {
    throw new Error("Nenhum palpite valido encontrado em importarcodigo.txt.");
  }

  return { participants, predictions };
}

async function findAuthUserIdByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 1000) return null;
    page += 1;
  }

  return null;
}

async function recreateAuthForProfile(admin: ReturnType<typeof createAdminClient>, profile: RepairableProfile) {
  const oldUserId = String(profile.id);
  const username = String(profile.username || "").trim().toLowerCase();
  const email = usernameToEmail(username);
  const temporaryUsername = `repair-${randomUUID()}`;
  const temporaryEmail = `${temporaryUsername}@febaje.local`;
  const archivedEmail = `archived-${oldUserId}-${username}@febaje.local`;

  if (!username) {
    throw new Error("Profile sem username.");
  }

  await admin.auth.admin.updateUserById(oldUserId, {
    email: archivedEmail,
    user_metadata: { archived_from_username: username },
  });

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email: temporaryEmail,
    password: "12345678",
    email_confirm: true,
    user_metadata: {
      username: temporaryUsername,
      display_name: profile.display_name || username,
    },
  });

  if (createError || !createdUser.user) {
    throw new Error(createError?.message || "Não foi possível criar o novo usuário Auth.");
  }

  const newUserId = createdUser.user.id;

  const { error: deleteTemporaryProfileError } = await admin.from("profiles").delete().eq("id", newUserId);

  if (deleteTemporaryProfileError) {
    throw new Error(deleteTemporaryProfileError.message);
  }

  const { error: moveProfileError } = await admin
    .from("profiles")
    .update({
      id: newUserId,
      username,
      display_name: profile.display_name,
      role: profile.role,
      initial_points: profile.initial_points,
      must_change_password: username !== "murilo",
    })
    .eq("id", oldUserId);

  if (moveProfileError) {
    throw new Error(moveProfileError.message);
  }

  const { error: finalizeAuthError } = await admin.auth.admin.updateUserById(newUserId, {
    email,
    password: "12345678",
    email_confirm: true,
    user_metadata: {
      username,
      display_name: profile.display_name || username,
    },
  });

  if (finalizeAuthError) {
    throw new Error(finalizeAuthError.message);
  }

  return newUserId;
}

export async function importParticipantsFromImportCodigo() {
  const path = "/admin/participants";
  await requireAdmin();
  const admin = getAdminClientOrRedirect(path);

  let imported;

  try {
    imported = await loadImportCodigo();
  } catch (error) {
    redirectBack(path, "error", error instanceof Error ? error.message : "Erro ao ler importarcodigo.txt.");
  }

  const userIdsByUsername = new Map<string, string>();
  const failures: string[] = [];
  let createdAuthUsers = 0;
  let reusedAuthUsers = 0;
  let profileCount = 0;

  for (const participant of imported.participants) {
    const originalUsername = participant.username;
    const username = canonicalUsername(originalUsername);
    const canonicalMerge = duplicateParticipantMerges.find((item) => item.canonical === username);
    const displayName = canonicalMerge?.displayName || participant.displayName;
    const email = usernameToEmail(username);
    let userId: string | null = null;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: "12345678",
      email_confirm: true,
      user_metadata: {
        username,
        display_name: displayName,
      },
    });

    if (data.user) {
      userId = data.user.id;
      createdAuthUsers += 1;
    } else if (error) {
      const maybeExistingUserId = await findAuthUserIdByEmail(admin, email);

      if (maybeExistingUserId) {
        userId = maybeExistingUserId;
        reusedAuthUsers += 1;

        const { error: updateAuthError } = await admin.auth.admin.updateUserById(userId, {
          password: "12345678",
          email_confirm: true,
          user_metadata: {
            username,
            display_name: displayName,
          },
        });

        if (updateAuthError) {
          failures.push(`${originalUsername}: ${updateAuthError.message}`);
          continue;
        }
      } else {
        failures.push(`${originalUsername}: ${error.message}`);
        continue;
      }
    }

    if (!userId) {
      failures.push(`${originalUsername}: usuario Auth nao retornado.`);
      continue;
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        username,
        display_name: displayName,
        role: "user",
        initial_points: 0,
        must_change_password: true,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      failures.push(`${originalUsername}: ${profileError.message}`);
      continue;
    }

    userIdsByUsername.set(originalUsername, userId);
    userIdsByUsername.set(username, userId);
    profileCount += 1;
  }

  const predictionRows = imported.predictions.flatMap((prediction) => {
    const userId = userIdsByUsername.get(prediction.username) || userIdsByUsername.get(canonicalUsername(prediction.username));

    if (!userId) {
      failures.push(`${prediction.username}: profile nao encontrado para importar palpite.`);
      return [];
    }

    return [
      {
        user_id: userId,
        fixture_key: prediction.fixtureKey,
        home_score: prediction.homeScore,
        away_score: prediction.awayScore,
      },
    ];
  });

  let predictionCount = 0;

  for (let index = 0; index < predictionRows.length; index += 400) {
    const chunk = predictionRows.slice(index, index + 400);
    const { error } = await admin.from("manual_predictions").upsert(chunk, {
      onConflict: "user_id,fixture_key",
    });

    if (error) {
      failures.push(`palpites ${index + 1}-${index + chunk.length}: ${error.message}`);
      continue;
    }

    predictionCount += chunk.length;
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  revalidatePath("/ranking");

  const summary = `${createdAuthUsers} Auth criados, ${reusedAuthUsers} Auth reutilizados, ${profileCount} profiles salvos, ${predictionCount} palpites importados.`;

  if (failures.length) {
    redirectBack(path, "error", `${summary} Falhas: ${failures.slice(0, 4).join(" | ")}`);
  }

  redirectBack(path, "success", summary);
}

export async function importRound2PredictionsFromCode() {
  const path = "/admin/participants";
  await requireAdmin();
  const admin = getAdminClientOrRedirect(path);
  const validFixtureKeys = new Set(manualFixtures.map((fixture) => normalizeFixtureKey(fixture.id)));

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, username, display_name")
    .order("username");

  if (profilesError) {
    redirectBack(path, "error", profilesError.message);
  }

  const profileIdsByName = new Map<string, string>();
  const usernamesByProfileId = new Map<string, string>();

  for (const profile of profiles || []) {
    const id = String(profile.id);
    const username = String(profile.username || "").trim().toLowerCase();
    const displayName = String(profile.display_name || "").trim().toLowerCase();

    if (username) {
      usernamesByProfileId.set(id, username);
    }

    if (username) {
      for (const lookupValue of participantLookupValues(username)) {
        profileIdsByName.set(lookupValue, id);
      }
    }

    if (displayName) {
      for (const lookupValue of participantLookupValues(displayName)) {
        profileIdsByName.set(lookupValue, id);
      }
    }
  }

  const rows: { user_id: string; fixture_key: string; home_score: number; away_score: number }[] = [];
  const failures: string[] = [];
  const importedByUser = new Map<string, number>();

  for (const userPredictions of rodada2Predictions) {
    const originalUsername = userPredictions.username.trim().toLowerCase();
    const username = canonicalUsername(originalUsername);
    const displayName = userPredictions.displayName.trim().toLowerCase();
    const lookupValues = [
      ...participantLookupValues(username),
      ...participantLookupValues(originalUsername),
      ...participantLookupValues(displayName),
    ];
    const userId = lookupValues.map((lookupValue) => profileIdsByName.get(lookupValue)).find(Boolean);

    if (!userId) {
      failures.push(`${originalUsername}: participante nao encontrado. Chaves: ${Array.from(new Set(lookupValues)).join("/")}`);
      continue;
    }

    for (const prediction of userPredictions.predictions) {
      const fixtureKey = normalizeFixtureKey(prediction.fixtureKey);

      if (!validFixtureKeys.has(fixtureKey)) {
        failures.push(`${username}: fixture invalido ${prediction.fixtureKey}.`);
        continue;
      }

      rows.push({
        user_id: userId,
        fixture_key: fixtureKey,
        home_score: prediction.homeScore,
        away_score: prediction.awayScore,
      });
      const importedUsername = usernamesByProfileId.get(userId) || username;
      importedByUser.set(importedUsername, (importedByUser.get(importedUsername) || 0) + 1);
    }
  }

  let imported = 0;

  for (let index = 0; index < rows.length; index += 400) {
    const chunk = rows.slice(index, index + 400);
    const { error } = await admin.from("manual_predictions").upsert(chunk, {
      onConflict: "user_id,fixture_key",
    });

    if (error) {
      failures.push(`palpites ${index + 1}-${index + chunk.length}: ${error.message}`);
      continue;
    }

    imported += chunk.length;
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  revalidatePath("/ranking");

  const importedUsersSummary = Array.from(importedByUser.entries())
    .sort(([firstUsername], [secondUsername]) => firstUsername.localeCompare(secondUsername))
    .map(([username, count]) => `${username}: ${count}`)
    .join(", ");
  const summary = `${imported} palpites da Rodada 2 importados/atualizados. ${importedUsersSummary}.`;

  if (failures.length) {
    redirectBack(path, "error", `${summary} Falhas: ${failures.slice(0, 5).join(" | ")}`);
  }

  redirectBack(path, "success", summary);
}

export async function mergeDuplicateParticipants() {
  const path = "/admin/participants";
  await requireAdmin();
  const admin = getAdminClientOrRedirect(path);

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, username, display_name, initial_points, role")
    .order("username");

  if (profilesError) {
    redirectBack(path, "error", profilesError.message);
  }

  let mergedPredictions = 0;
  let deletedUsers = 0;
  let renamedUsers = 0;
  const failures: string[] = [];

  for (const merge of duplicateParticipantMerges) {
    const matchNames = new Set([merge.canonical, ...merge.aliases].map((item) => item.trim().toLowerCase()));
    const candidates = (profiles || []).filter((profile) => {
      const username = String(profile.username || "").trim().toLowerCase();
      const displayName = String(profile.display_name || "").trim().toLowerCase();
      return matchNames.has(username) || matchNames.has(displayName);
    });
    let canonical =
      candidates.find((profile) => String(profile.username || "").trim().toLowerCase() === merge.canonical) ||
      candidates[0];

    if (!canonical) {
      failures.push(`${merge.canonical}: usuario principal nao encontrado.`);
      continue;
    }

    if (String(canonical.username || "").trim().toLowerCase() !== merge.canonical) {
      const { error: renameError } = await admin
        .from("profiles")
        .update({
          username: merge.canonical,
          display_name: merge.displayName,
        })
        .eq("id", canonical.id);

      if (renameError) {
        failures.push(`${merge.canonical}: ${renameError.message}`);
        continue;
      }

      const { error: authRenameError } = await admin.auth.admin.updateUserById(String(canonical.id), {
        email: usernameToEmail(merge.canonical),
        user_metadata: {
          username: merge.canonical,
          display_name: merge.displayName,
        },
      });

      if (authRenameError) {
        failures.push(`${merge.canonical}: ${authRenameError.message}`);
      }

      canonical = {
        ...canonical,
        username: merge.canonical,
        display_name: merge.displayName,
      };
      renamedUsers += 1;
    }

    for (const duplicate of candidates) {
      const duplicateUsername = String(duplicate.username || "").trim().toLowerCase();

      if (!duplicate || duplicate.id === canonical.id) {
        continue;
      }

      const { data: duplicatePredictions, error: predictionsError } = await admin
        .from("manual_predictions")
        .select("fixture_key, home_score, away_score")
        .eq("user_id", duplicate.id);

      if (predictionsError) {
        failures.push(`${duplicateUsername}: ${predictionsError.message}`);
        continue;
      }

      const rows = (duplicatePredictions || []).map((prediction) => ({
        user_id: canonical.id,
        fixture_key: prediction.fixture_key,
        home_score: prediction.home_score,
        away_score: prediction.away_score,
      }));

      if (rows.length) {
        const { error: upsertError } = await admin.from("manual_predictions").upsert(rows, {
          onConflict: "user_id,fixture_key",
        });

        if (upsertError) {
          failures.push(`${duplicateUsername}: ${upsertError.message}`);
          continue;
        }

        mergedPredictions += rows.length;
      }

      const { error: deleteAuthError } = await admin.auth.admin.deleteUser(String(duplicate.id));

      if (deleteAuthError) {
        const { error: deleteProfileError } = await admin.from("profiles").delete().eq("id", duplicate.id);

        if (deleteProfileError) {
          failures.push(`${duplicateUsername}: ${deleteAuthError.message} | ${deleteProfileError.message}`);
          continue;
        }
      }

      deletedUsers += 1;
    }
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  revalidatePath("/ranking");

  const summary = `${mergedPredictions} palpites transferidos, ${renamedUsers} usuarios normalizados e ${deletedUsers} duplicados excluidos.`;

  if (failures.length) {
    redirectBack(path, "error", `${summary} Falhas: ${failures.slice(0, 5).join(" | ")}`);
  }

  redirectBack(path, "success", summary);
}

export async function saveManualFixtureResult(formData: FormData) {
  const path = "/admin/results";
  await requireAdmin();

  const fixtureKey = normalizeFixtureKey(text(formData, "fixture_key"));
  const homeScore = numberValue(formData, "home_score");
  const awayScore = numberValue(formData, "away_score");

  const fixture = manualFixtures.find((item) => normalizeFixtureKey(item.id) === fixtureKey);

  if (!fixture) {
    redirectBack(path, "error", "Jogo não encontrado nos fixtures hardcoded.");
  }

  if (fixture.result) {
    redirectBack(path, "error", "Este placar já está marcado como correto e não pode ser alterado.");
  }

  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    redirectBack(path, "error", "Informe placares válidos.");
  }

  const admin = getAdminClientOrRedirect(path);
  const { data: existingResult, error: existingResultError } = await admin
    .from("manual_fixture_results")
    .select("fixture_key")
    .eq("fixture_key", fixtureKey)
    .maybeSingle();

  if (existingResultError) {
    redirectBack(path, "error", existingResultError.message);
  }

  if (existingResult) {
    redirectBack(path, "error", "Este placar já está salvo e não pode ser alterado.");
  }

  const { error } = await admin.from("manual_fixture_results").upsert(
    {
      fixture_key: fixtureKey,
      home_score: homeScore,
      away_score: awayScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "fixture_key" },
  );

  if (error) {
    redirectBack(path, "error", error.message);
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  revalidatePath("/ranking");
  redirectBack(path, "success", "Placar salvo. A pontuação já foi recalculada.");
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
  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    password: "12345678",
    email_confirm: true,
  });
  if (authError) redirectBack(path, "error", authError.message);

  const { error } = await admin.from("profiles").update({ must_change_password: true }).eq("id", id);
  if (error) redirectBack(path, "error", error.message);

  revalidatePath(path);
  redirectBack(path, "success", "Senha resetada para 12345678.");
}

export async function resetAllFebajePasswords() {
  const path = "/admin/participants";
  await requireAdmin();

  const admin = getAdminClientOrRedirect(path);
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, username")
    .order("username");

  if (profilesError) {
    redirectBack(path, "error", profilesError.message);
  }

  let resetCount = 0;
  let profileUpdateCount = 0;
  const failures: string[] = [];

  for (const profile of profiles || []) {
    const username = String(profile.username || "").toLowerCase();
    const userId = String(profile.id);

    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: "12345678",
      email_confirm: true,
    });

    if (error) {
      failures.push(`${username || profile.id}: ${error.message}`);
      continue;
    }

    resetCount += 1;

    const { error: profileError } = await admin
      .from("profiles")
      .update({ must_change_password: username !== "murilo" })
      .eq("id", userId);

    if (profileError) {
      failures.push(`${username || userId}: ${profileError.message}`);
      continue;
    }

    profileUpdateCount += 1;
  }

  revalidatePath(path);

  if (failures.length) {
    redirectBack(
      path,
      "error",
      `${resetCount} senhas resetadas, ${profileUpdateCount} perfis atualizados. Falhas: ${failures.slice(0, 3).join(" | ")}`,
    );
  }

  redirectBack(path, "success", `${resetCount} senhas resetadas para 12345678 e ${profileUpdateCount} perfis atualizados.`);
}

export async function recreateParticipantAuthLogin(formData: FormData) {
  const path = "/admin/participants";
  await requireAdmin();
  const id = text(formData, "id");
  const admin = getAdminClientOrRedirect(path);

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, username, display_name, role, initial_points, must_change_password")
    .eq("id", id)
    .single<RepairableProfile>();

  if (error || !profile) {
    redirectBack(path, "error", error?.message || "Profile não encontrado.");
  }

  try {
    await recreateAuthForProfile(admin, profile);
  } catch (repairError) {
    redirectBack(path, "error", repairError instanceof Error ? repairError.message : "Erro ao recriar login.");
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  revalidatePath("/ranking");
  redirectBack(path, "success", `Login de ${profile.username} recriado com senha 12345678.`);
}

export async function recreateAllUserAuthLogins() {
  const path = "/admin/participants";
  await requireAdmin();
  const admin = getAdminClientOrRedirect(path);

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, username, display_name, role, initial_points, must_change_password")
    .eq("role", "user")
    .order("username")
    .returns<RepairableProfile[]>();

  if (error) {
    redirectBack(path, "error", error.message);
  }

  let repaired = 0;
  const failures: string[] = [];

  for (const profile of profiles || []) {
    try {
      await recreateAuthForProfile(admin, profile);
      repaired += 1;
    } catch (repairError) {
      failures.push(
        `${profile.username}: ${repairError instanceof Error ? repairError.message : "erro desconhecido"}`,
      );
    }
  }

  revalidatePath(path);
  revalidatePath("/dashboard");
  revalidatePath("/ranking");

  if (failures.length) {
    redirectBack(path, "error", `${repaired} logins recriados. Falhas: ${failures.slice(0, 3).join(" | ")}`);
  }

  redirectBack(path, "success", `${repaired} logins recriados com senha 12345678.`);
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
