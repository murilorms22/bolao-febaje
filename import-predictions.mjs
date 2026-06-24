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

const participantsList = [
  { key: 'vitor.fregulia', search: ['vitor fregulia'] },
  { key: 'joao.braatz', search: ['joao braatz'] },
  { key: 'victor.barreto', search: ['victor barreto'] },
  { key: 'gabriel.haas', search: ['gabriel haas'] },
  { key: 'susane', search: ['susane haas', 'susane'] },
  { key: 'altemir', search: ['altemir silva', 'altemir da silva', 'altemir'] },
  { key: 'erico.pires', search: ['erico pires', 'erico'] },
  { key: 'raissa', search: ['raissa remboski', 'raissa'] },
  { key: 'joao.flach', search: ['joao flach'] },
  { key: 'cleverson.toledo', search: ['cleverson toledo', 'cleverson'] },
  { key: 'jardel', search: ['jardel'] },
  { key: 'mateus.felipe', search: ['mateus felipe'] },
  { key: 'mateus', search: ['mateus'] },
  { key: 'debora.dallacort', search: ['debora dallacort', 'debora'] },
  { key: 'gabriel.reichow', search: ['gabriel reichow'] },
  { key: 'abelha', search: ['abelha'] },
  { key: 'bazzo', search: ['bazzo'] },
  { key: 'everson.toledo', search: ['everson toledo'] },
  { key: 'victor', search: ['victor'] },
  { key: 'ary', search: ['ary'] },
  { key: 'mariane.silva', search: ['mariane silva', 'mariane'] },
  { key: 'charles.bandeira', search: ['charles bandeira', 'charles'] },
  { key: 'murilo', search: ['murilo'] }
];

const fixturesList = [
  { key: "rodada3-suica-canada", team1: "suica", team2: "canada" },
  { key: "rodada3-bosnia-catar", team1: "bosnia", team2: "catar" },
  { key: "rodada3-escocia-brasil", team1: "escocia", team2: "brasil" },
  { key: "rodada3-marrocos-haiti", team1: "marrocos", team2: "haiti" },
  { key: "rodada3-africa-do-sul-coreia-do-sul", team1: "africa do sul", team2: "coreia do sul" },
  { key: "rodada3-tchequia-mexico", team1: "tchequia", team2: "mexico", altTeam1: "republica tcheca" },
  { key: "rodada3-equador-alemanha", team1: "equador", team2: "alemanha" },
  { key: "rodada3-curacao-costa-do-marfim", team1: "curacao", team2: "costa do marfim", altTeam1: "curacau" },
  { key: "rodada3-tunisia-holanda", team1: "tunisia", team2: "holanda" },
  { key: "rodada3-japao-suecia", team1: "japao", team2: "suecia" },
  { key: "rodada3-turquia-eua", team1: "turquia", team2: "eua", altTeam2: "estados unidos" },
  { key: "rodada3-paraguai-australia", team1: "paraguai", team2: "australia" },
  { key: "rodada3-senegal-iraque", team1: "senegal", team2: "iraque" },
  { key: "rodada3-noruega-franca", team1: "noruega", team2: "franca" },
  { key: "rodada3-cabo-verde-arabia-saudita", team1: "cabo verde", team2: "arabia saudita" },
  { key: "rodada3-uruguai-espanha", team1: "uruguai", team2: "espanha" },
  { key: "rodada3-ira-egito", team1: "ira", team2: "egito" },
  { key: "rodada3-nova-zelandia-belgica", team1: "nova zelandia", team2: "belgica" },
  { key: "rodada3-panama-inglaterra", team1: "panama", team2: "inglaterra" },
  { key: "rodada3-gana-croacia", team1: "gana", team2: "croacia" },
  { key: "rodada3-colombia-portugal", team1: "colombia", team2: "portugal" },
  { key: "rodada3-rd-congo-uzbequistao", team1: "rd congo", team2: "uzbequistao", altTeam1: "congo" },
  { key: "rodada3-argelia-austria", team1: "argelia", team2: "austria" },
  { key: "rodada3-jordania-argentina", team1: "jordania", team2: "argentina" }
];

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim();
}

function findMatchFixture(normalizedLine) {
  for (const f of fixturesList) {
    const t1 = f.team1;
    const t2 = f.team2;
    const hasT1 = normalizedLine.includes(t1) || (f.altTeam1 && normalizedLine.includes(f.altTeam1));
    const hasT2 = normalizedLine.includes(t2) || (f.altTeam2 && normalizedLine.includes(f.altTeam2));
    
    // Safety check for Irã (ira) vs Egito (egito) to prevent matches with Iraque
    if (f.key === 'rodada3-ira-egito') {
      if (normalizedLine.includes('iraque')) continue;
    }
    
    if (hasT1 && hasT2) {
      return f;
    }
  }
  return null;
}

async function run() {
  const filePath = path.join(process.cwd(), 'rodada3.txt');
  if (!fs.existsSync(filePath)) {
    console.error("rodada3.txt file not found!");
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  if (content.trim().length === 0) {
    console.error("rodada3.txt is empty! Please save the file in your editor.");
    process.exit(1);
  }

  // Fetch all profiles to map username to user_id
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username");

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    process.exit(1);
  }

  const profileMap = new Map(profiles.map(p => [p.username, p.id]));

  const lines = content.split(/\r?\n/);
  
  let currentParticipant = null;
  const allParsedPredictions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const normalizedLine = normalize(line);

    // 1. Check if line matches a participant name header
    let matchedParticipant = null;
    for (const p of participantsList) {
      for (const term of p.search) {
        if (normalizedLine === term || normalizedLine === term + ' palpites' || normalizedLine.startsWith(term + ':')) {
          matchedParticipant = p.key;
          break;
        }
      }
      if (matchedParticipant) break;
    }

    if (matchedParticipant) {
      currentParticipant = matchedParticipant;
      console.log(`\nFound predictions header for participant: ${currentParticipant}`);
      continue;
    }

    // 2. If we have a current participant, try to parse score prediction in this line
    if (currentParticipant) {
      const scoreMatch = line.match(/(\d+)\s*[\s\-xX]\s*(\d+)/i);
      if (scoreMatch) {
        const fixture = findMatchFixture(normalizedLine);
        if (fixture) {
          const homeScore = Number(scoreMatch[1]);
          const awayScore = Number(scoreMatch[2]);
          
          // Determine home vs away order based on occurrence in the line
          const idx1 = normalizedLine.indexOf(fixture.team1) !== -1 ? normalizedLine.indexOf(fixture.team1) : normalizedLine.indexOf(fixture.altTeam1);
          const idx2 = normalizedLine.indexOf(fixture.team2) !== -1 ? normalizedLine.indexOf(fixture.team2) : normalizedLine.indexOf(fixture.altTeam2);
          
          let finalHomeScore = homeScore;
          let finalAwayScore = awayScore;
          
          // If team2 is written first in the line, swap scores to align with official key (which is team1 vs team2)
          if (idx2 !== -1 && idx1 !== -1 && idx2 < idx1) {
            finalHomeScore = awayScore;
            finalAwayScore = homeScore;
          }

          allParsedPredictions.push({
            username: currentParticipant,
            fixtureKey: fixture.key,
            homeScore: finalHomeScore,
            awayScore: finalAwayScore
          });
        }
      }
    }
  }

  if (allParsedPredictions.length === 0) {
    console.log("No predictions parsed from the file.");
    process.exit(0);
  }

  console.log(`\nParsed ${allParsedPredictions.length} predictions in total.`);

  // Group by user to display count
  const userCounts = {};
  allParsedPredictions.forEach(p => {
    userCounts[p.username] = (userCounts[p.username] || 0) + 1;
  });
  console.log("Summary of parsed predictions per user:");
  console.log(userCounts);

  // 3. Upsert predictions into Supabase
  console.log("\nStarting import into Supabase...");
  let successCount = 0;
  
  // Chunk imports in batches of 100 for safety
  const batchSize = 100;
  for (let idx = 0; idx < allParsedPredictions.length; idx += batchSize) {
    const chunk = allParsedPredictions.slice(idx, idx + batchSize);
    
    const rows = chunk.map(pred => {
      const userId = profileMap.get(pred.username);
      if (!userId) {
        console.error(`User profile not found for: ${pred.username}`);
        return null;
      }
      return {
        user_id: userId,
        fixture_key: pred.fixtureKey,
        home_score: pred.homeScore,
        away_score: pred.awayScore
      };
    }).filter(Boolean);

    if (rows.length > 0) {
      const { error } = await supabase
        .from("manual_predictions")
        .upsert(rows, { onConflict: "user_id,fixture_key" });

      if (error) {
        console.error(`Error importing batch starting at ${idx}:`, error.message);
      } else {
        successCount += rows.length;
        console.log(`Imported batch ${idx / batchSize + 1} (${rows.length} predictions)`);
      }
    }
  }

  console.log(`\nImport complete! Successfully saved ${successCount} predictions in Supabase.`);
}

run();
