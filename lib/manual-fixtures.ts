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

export type ManualFixtureResult = {
  fixture_key: string;
  home_score: number;
  away_score: number;
};

export function normalizeFixtureKey(value: string) {
  return value.trim().toLowerCase();
}

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
const round3 = "Fase de Grupos - Rodada 3";
const round16avos = "16 Avos de Final";

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

  fixture("rodada3-suica-canada", round3, "Suíça", "Canadá", "ch", "ca"),
  fixture("rodada3-bosnia-catar", round3, "Bósnia", "Catar", "ba", "qa"),
  fixture("rodada3-escocia-brasil", round3, "Escócia", "Brasil", "gb-sct", "br"),
  fixture("rodada3-marrocos-haiti", round3, "Marrocos", "Haiti", "ma", "ht"),
  fixture("rodada3-africa-do-sul-coreia-do-sul", round3, "África do Sul", "Coreia do Sul", "za", "kr"),
  fixture("rodada3-tchequia-mexico", round3, "Tchéquia", "México", "cz", "mx"),
  fixture("rodada3-equador-alemanha", round3, "Equador", "Alemanha", "ec", "de"),
  fixture("rodada3-curacao-costa-do-marfim", round3, "Curaçao", "Costa do Marfim", "cw", "ci"),
  fixture("rodada3-tunisia-holanda", round3, "Tunísia", "Holanda", "tn", "nl"),
  fixture("rodada3-japao-suecia", round3, "Japão", "Suécia", "jp", "se"),
  fixture("rodada3-turquia-eua", round3, "Turquia", "EUA", "tr", "us"),
  fixture("rodada3-paraguai-australia", round3, "Paraguai", "Austrália", "py", "au"),
  fixture("rodada3-senegal-iraque", round3, "Senegal", "Iraque", "sn", "iq"),
  fixture("rodada3-noruega-franca", round3, "Noruega", "França", "no", "fr"),
  fixture("rodada3-cabo-verde-arabia-saudita", round3, "Cabo Verde", "Arábia Saudita", "cv", "sa"),
  fixture("rodada3-uruguai-espanha", round3, "Uruguai", "Espanha", "uy", "es"),
  fixture("rodada3-ira-egito", round3, "Irã", "Egito", "ir", "eg"),
  fixture("rodada3-nova-zelandia-belgica", round3, "Nova Zelândia", "Bélgica", "nz", "be"),
  fixture("rodada3-panama-inglaterra", round3, "Panamá", "Inglaterra", "pa", "gb-eng"),
  fixture("rodada3-gana-croacia", round3, "Gana", "Croácia", "gh", "hr"),
  fixture("rodada3-colombia-portugal", round3, "Colômbia", "Portugal", "co", "pt"),
  fixture("rodada3-rd-congo-uzbequistao", round3, "RD Congo", "Uzbequistão", "cd", "uz"),
  fixture("rodada3-argelia-austria", round3, "Argélia", "Áustria", "dz", "at"),
  fixture("rodada3-jordania-argentina", round3, "Jordânia", "Argentina", "jo", "ar"),

  fixture("16avos-africa-do-sul-canada", round16avos, "África do Sul", "Canadá", "za", "ca"),
  fixture("16avos-brasil-japao", round16avos, "Brasil", "Japão", "br", "jp"),
  fixture("16avos-alemanha-paraguai", round16avos, "Alemanha", "Paraguai", "de", "py"),
  fixture("16avos-holanda-marrocos", round16avos, "Holanda", "Marrocos", "nl", "ma"),
  fixture("16avos-costa-do-marfim-noruega", round16avos, "Costa do Marfim", "Noruega", "ci", "no"),
  fixture("16avos-franca-suecia", round16avos, "França", "Suécia", "fr", "se"),
  fixture("16avos-mexico-equador", round16avos, "México", "Equador", "mx", "ec"),
  fixture("16avos-inglaterra-rd-congo", round16avos, "Inglaterra", "RD Congo", "gb-eng", "cd"),
  fixture("16avos-belgica-senegal", round16avos, "Bélgica", "Senegal", "be", "sn"),
  fixture("16avos-eua-bosnia", round16avos, "EUA", "Bósnia", "us", "ba"),
  fixture("16avos-espanha-austria", round16avos, "Espanha", "Áustria", "es", "at"),
  fixture("16avos-portugal-croacia", round16avos, "Portugal", "Croácia", "pt", "hr"),
  fixture("16avos-suica-argelia", round16avos, "Suíça", "Argélia", "ch", "dz"),
  fixture("16avos-australia-egito", round16avos, "Austrália", "Egito", "au", "eg"),
  fixture("16avos-argentina-cabo-verde", round16avos, "Argentina", "Cabo Verde", "ar", "cv"),
  fixture("16avos-colombia-gana", round16avos, "Colômbia", "Gana", "co", "gh"),
];

export const manualRounds = Array.from(new Set(manualFixtures.map((item) => item.round)));

export function applyManualResults(fixtures: ManualFixture[], results: ManualFixtureResult[] = []) {
  const resultsByFixture = new Map(
    results.map((result) => [
      normalizeFixtureKey(result.fixture_key),
      { home: Number(result.home_score), away: Number(result.away_score) },
    ]),
  );

  return fixtures.map((fixture) => ({
    ...fixture,
    result: resultsByFixture.get(normalizeFixtureKey(fixture.id)) ?? fixture.result,
  }));
}

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

  const isKnockout = !fixture.round.startsWith("Fase de Grupos");
  const multiplier = isKnockout ? 2 : 1;

  if (predictedHome === resultHome && predictedAway === resultAway) {
    return { points: 10 * multiplier, status: "exact" };
  }

  if (outcome(predictedHome, predictedAway) === outcome(resultHome, resultAway)) {
    return { points: 5 * multiplier, status: "outcome" };
  }

  return { points: 0, status: "wrong" };
}
