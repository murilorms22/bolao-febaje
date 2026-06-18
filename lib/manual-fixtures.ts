export type ManualPrediction = {
  fixture_key: string;
  home_score: number;
  away_score: number;
};

export type ManualFixture = {
  id: string;
  key: string;
  round: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  result: { home: number; away: number } | null;
};

export type FixtureScore = {
  points: number;
  status: "pending" | "exact" | "outcome" | "wrong" | "no-prediction";
};

const flag = (isoCode: string) => `https://flagcdn.com/w80/${isoCode}.png`;

function fixture(
  key: string,
  round: string,
  home: string,
  away: string,
  homeIso: string,
  awayIso: string,
  result: { home: number; away: number } | null = null,
  lockedPrediction?: { home: number; away: number },
): ManualFixture {
  return {
    id: key,
    key,
    round,
    home,
    away,
    homeFlag: flag(homeIso),
    awayFlag: flag(awayIso),
    result,
  };
}

const round1 = "Fase de Grupos - Rodada 1";
const round2 = "Fase de Grupos - Rodada 2";

export const manualFixtures: ManualFixture[] = [
  fixture("rodada1-mexico-africa-do-sul", round1, "México", "África do Sul", "mx", "za", { home: 2, away: 0 }, { home: 1, away: 0 }),
  fixture("rodada1-coreia-do-sul-tchequia", round1, "Coreia do Sul", "Tchéquia", "kr", "cz", { home: 2, away: 1 }, { home: 1, away: 0 }),
  fixture("rodada1-canada-bosnia", round1, "Canadá", "Bósnia", "ca", "ba", { home: 1, away: 1 }, { home: 1, away: 0 }),
  fixture("rodada1-eua-paraguai", round1, "EUA", "Paraguai", "us", "py", { home: 4, away: 1 }, { home: 1, away: 0 }),
  fixture("rodada1-catar-suica", round1, "Catar", "Suíça", "qa", "ch", { home: 1, away: 1 }, { home: 0, away: 1 }),
  fixture("rodada1-brasil-marrocos", round1, "Brasil", "Marrocos", "br", "ma", { home: 1, away: 1 }, { home: 2, away: 0 }),
  fixture("rodada1-haiti-escocia", round1, "Haiti", "Escócia", "ht", "gb-sct", { home: 0, away: 1 }, { home: 0, away: 2 }),
  fixture("rodada1-australia-turquia", round1, "Austrália", "Turquia", "au", "tr", { home: 2, away: 0 }, { home: 0, away: 1 }),
  fixture("rodada1-alemanha-curacao", round1, "Alemanha", "Curaçao", "de", "cw", { home: 7, away: 1 }, { home: 3, away: 0 }),
  fixture("rodada1-costa-do-marfim-equador", round1, "Costa do Marfim", "Equador", "ci", "ec", { home: 1, away: 0 }, { home: 1, away: 0 }),
  fixture("rodada1-holanda-japao", round1, "Holanda", "Japão", "nl", "jp", { home: 2, away: 2 }, { home: 1, away: 2 }),
  fixture("rodada1-suecia-tunisia", round1, "Suécia", "Tunísia", "se", "tn", { home: 5, away: 1 }, { home: 0, away: 0 }),
  fixture("rodada1-espanha-cabo-verde", round1, "Espanha", "Cabo Verde", "es", "cv", { home: 0, away: 0 }, { home: 4, away: 0 }),
  fixture("rodada1-arabia-saudita-uruguai", round1, "Arábia Saudita", "Uruguai", "sa", "uy", { home: 1, away: 1 }, { home: 0, away: 1 }),
  fixture("rodada1-belgica-egito", round1, "Bélgica", "Egito", "be", "eg", { home: 1, away: 1 }, { home: 2, away: 0 }),
  fixture("rodada1-ira-nova-zelandia", round1, "Irã", "Nova Zelândia", "ir", "nz", { home: 2, away: 2 }, { home: 0, away: 0 }),
  fixture("rodada1-austria-jordania", round1, "Áustria", "Jordânia", "at", "jo", { home: 3, away: 1 }, { home: 2, away: 0 }),
  fixture("rodada1-franca-senegal", round1, "França", "Senegal", "fr", "sn", { home: 3, away: 1 }, { home: 3, away: 0 }),
  fixture("rodada1-iraque-noruega", round1, "Iraque", "Noruega", "iq", "no", { home: 1, away: 4 }, { home: 0, away: 3 }),
  fixture("rodada1-argentina-argelia", round1, "Argentina", "Argélia", "ar", "dz", { home: 3, away: 0 }, { home: 3, away: 0 }),
  fixture("rodada1-portugal-rd-congo", round1, "Portugal", "RD Congo", "pt", "cd", { home: 1, away: 1 }, { home: 2, away: 0 }),
  fixture("rodada1-inglaterra-croacia", round1, "Inglaterra", "Croácia", "gb-eng", "hr", { home: 4, away: 2 }, { home: 2, away: 1 }),
  fixture("rodada1-gana-panama", round1, "Gana", "Panamá", "gh", "pa", { home: 1, away: 0 }, { home: 1, away: 0 }),
  fixture("rodada1-uzbequistao-colombia", round1, "Uzbequistão", "Colômbia", "uz", "co", { home: 1, away: 3 }, { home: 0, away: 2 }),

  fixture("rodada2-tchequia-africa-do-sul", round2, "Tchéquia", "África do Sul", "cz", "za", null, { home: 0, away: 1 }),
  fixture("rodada2-suica-bosnia", round2, "Suíça", "Bósnia", "ch", "ba", null, { home: 1, away: 1 }),
  fixture("rodada2-canada-catar", round2, "Canadá", "Catar", "ca", "qa", null, { home: 1, away: 2 }),
  fixture("rodada2-mexico-coreia-do-sul", round2, "México", "Coreia do Sul", "mx", "kr", null, { home: 2, away: 2 }),
  fixture("rodada2-eua-australia", round2, "EUA", "Austrália", "us", "au", null, { home: 2, away: 0 }),
  fixture("rodada2-escocia-marrocos", round2, "Escócia", "Marrocos", "gb-sct", "ma", null, { home: 1, away: 2 }),
  fixture("rodada2-brasil-haiti", round2, "Brasil", "Haiti", "br", "ht", null, { home: 3, away: 0 }),
  fixture("rodada2-turquia-paraguai", round2, "Turquia", "Paraguai", "tr", "py", null, { home: 0, away: 2 }),
  fixture("rodada2-holanda-suecia", round2, "Holanda", "Suécia", "nl", "se", null, { home: 1, away: 2 }),
  fixture("rodada2-alemanha-costa-do-marfim", round2, "Alemanha", "Costa do Marfim", "de", "ci", null, { home: 3, away: 1 }),
  fixture("rodada2-equador-curacao", round2, "Equador", "Curaçao", "ec", "cw", null, { home: 2, away: 0 }),
  fixture("rodada2-tunisia-japao", round2, "Tunísia", "Japão", "tn", "jp", null, { home: 1, away: 1 }),
  fixture("rodada2-espanha-arabia-saudita", round2, "Espanha", "Arábia Saudita", "es", "sa", null, { home: 3, away: 0 }),
  fixture("rodada2-belgica-ira", round2, "Bélgica", "Irã", "be", "ir", null, { home: 2, away: 1 }),
  fixture("rodada2-uruguai-cabo-verde", round2, "Uruguai", "Cabo Verde", "uy", "cv", null, { home: 1, away: 1 }),
  fixture("rodada2-nova-zelandia-egito", round2, "Nova Zelândia", "Egito", "nz", "eg", null, { home: 1, away: 1 }),
  fixture("rodada2-argentina-austria", round2, "Argentina", "Áustria", "ar", "at", null, { home: 2, away: 0 }),
  fixture("rodada2-franca-iraque", round2, "França", "Iraque", "fr", "iq", null, { home: 4, away: 1 }),
  fixture("rodada2-noruega-senegal", round2, "Noruega", "Senegal", "no", "sn", null, { home: 2, away: 0 }),
  fixture("rodada2-jordania-argelia", round2, "Jordânia", "Argélia", "jo", "dz", null, { home: 1, away: 1 }),
  fixture("rodada2-portugal-uzbequistao", round2, "Portugal", "Uzbequistão", "pt", "uz", null, { home: 2, away: 0 }),
  fixture("rodada2-inglaterra-gana", round2, "Inglaterra", "Gana", "gb-eng", "gh", null, { home: 3, away: 0 }),
  fixture("rodada2-panama-croacia", round2, "Panamá", "Croácia", "pa", "hr", null, { home: 0, away: 2 }),
  fixture("rodada2-colombia-rd-congo", round2, "Colômbia", "RD Congo", "co", "cd", null, { home: 1, away: 0 }),
];

export const manualRounds = Array.from(new Set(manualFixtures.map((item) => item.round)));

function outcome(home: number, away: number) {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export function getFixturePrediction(_fixture: ManualFixture, prediction?: ManualPrediction) {
  return prediction;
}

export function scoreFixture(
  fixture: ManualFixture,
  prediction?: ManualPrediction,
): FixtureScore {
  const effectivePrediction = getFixturePrediction(fixture, prediction);

  if (!fixture.result) {
    return { points: 0, status: "pending" };
  }

  if (!effectivePrediction) {
    return { points: 0, status: "no-prediction" };
  }

  const predictedHome = Number(effectivePrediction.home_score);
  const predictedAway = Number(effectivePrediction.away_score);
  const resultHome = Number(fixture.result.home);
  const resultAway = Number(fixture.result.away);

  if (predictedHome === resultHome && predictedAway === resultAway) {
    return { points: 10, status: "exact" };
  }

  if (outcome(predictedHome, predictedAway) === outcome(resultHome, resultAway)) {
    return { points: 5, status: "outcome" };
  }

  return { points: 0, status: "wrong" };
}
