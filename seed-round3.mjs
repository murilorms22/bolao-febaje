import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceRole = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceRole) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

const roundName = "Fase de Grupos - Rodada 3";
const startsAt = "2026-06-25T16:00:00-03:00";
const deadline = "2026-06-25T15:59:00-03:00";

const fixtures = [
  ["Suíça", "Canadá"],
  ["Bósnia", "Catar"],
  ["Escócia", "Brasil"],
  ["Marrocos", "Haiti"],
  ["África do Sul", "Coreia do Sul"],
  ["Tchéquia", "México"],
  ["Equador", "Alemanha"],
  ["Curaçao", "Costa do Marfim"],
  ["Tunísia", "Holanda"],
  ["Japão", "Suécia"],
  ["Turquia", "EUA"],
  ["Paraguai", "Austrália"],
  ["Senegal", "Iraque"],
  ["Noruega", "França"],
  ["Cabo Verde", "Arábia Saudita"],
  ["Uruguai", "Espanha"],
  ["Irã", "Egito"],
  ["Nova Zelândia", "Bélgica"],
  ["Panamá", "Inglaterra"],
  ["Gana", "Croácia"],
  ["Colômbia", "Portugal"],
  ["RD Congo", "Uzbequistão"],
  ["Argélia", "Áustria"],
  ["Jordânia", "Argentina"]
];

async function run() {
  console.log("Connecting to Supabase...");
  
  // 1. Get or create Round 3
  const { data: existingRound, error: roundFetchError } = await supabase
    .from("rounds")
    .select("id")
    .eq("name", roundName)
    .maybeSingle();

  if (roundFetchError) {
    console.error("Error fetching round:", roundFetchError);
    process.exit(1);
  }

  let roundId;
  if (existingRound) {
    roundId = existingRound.id;
    console.log("Round 3 already exists. ID:", roundId);
    
    // Update it to make sure deadline and start time are correct
    const { error: roundUpdateError } = await supabase
      .from("rounds")
      .update({
        starts_at: startsAt,
        prediction_deadline: deadline,
        round_number: 3
      })
      .eq("id", roundId);

    if (roundUpdateError) {
      console.error("Error updating round:", roundUpdateError);
      process.exit(1);
    }
    console.log("Updated round settings.");
  } else {
    // Get last sort order
    const { data: lastRound } = await supabase
      .from("rounds")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = (lastRound?.sort_order || 0) + 1;

    const { data: newRound, error: roundInsertError } = await supabase
      .from("rounds")
      .insert({
        name: roundName,
        phase: "group_stage",
        round_number: 3,
        sort_order: sortOrder,
        weight: 1,
        starts_at: startsAt,
        prediction_deadline: deadline
      })
      .select("id")
      .single();

    if (roundInsertError || !newRound) {
      console.error("Error inserting round:", roundInsertError);
      process.exit(1);
    }

    roundId = newRound.id;
    console.log("Inserted Round 3. ID:", roundId);
  }

  // 2. Fetch all teams to map names to IDs
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name");

  if (teamsError) {
    console.error("Error fetching teams:", teamsError);
    process.exit(1);
  }

  const teamMap = new Map(teams.map(t => [t.name, t.id]));
  console.log(`Loaded ${teams.length} teams.`);

  // 3. Insert matches
  let insertedCount = 0;
  for (const [homeName, awayName] of fixtures) {
    const homeId = teamMap.get(homeName);
    const awayId = teamMap.get(awayName);

    if (!homeId || !awayId) {
      console.error(`Could not find ID for team: ${homeName} (${homeId}) or ${awayName} (${awayId})`);
      continue;
    }

    // Check if match already exists
    const { data: existingMatch, error: matchCheckError } = await supabase
      .from("matches")
      .select("id")
      .eq("round_id", roundId)
      .eq("home_team_id", homeId)
      .eq("away_team_id", awayId)
      .maybeSingle();

    if (matchCheckError) {
      console.error("Error checking match existence:", matchCheckError);
      continue;
    }

    if (existingMatch) {
      console.log(`Match ${homeName} vs ${awayName} already exists.`);
      continue;
    }

    const { error: matchInsertError } = await supabase
      .from("matches")
      .insert({
        round_id: roundId,
        home_team_id: homeId,
        away_team_id: awayId,
        match_at: startsAt,
        status: "scheduled",
        phase: "group_stage",
        weight: 1,
        result_confirmed: false
      });

    if (matchInsertError) {
      console.error(`Error inserting match ${homeName} vs ${awayName}:`, matchInsertError);
    } else {
      console.log(`Inserted match: ${homeName} vs ${awayName}`);
      insertedCount++;
    }
  }

  console.log(`Seeding complete. Inserted ${insertedCount} new matches.`);
}

run();
