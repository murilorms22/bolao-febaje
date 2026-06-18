export type ManualFixture = {
  key: string;
  round: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  result: { home: number; away: number } | null;
};

export type ManualPrediction = {
  fixture_key: string;
  home_score: number;
  away_score: number;
};

export type FixtureScore = {
  points: number;
  status: "pending" | "exact" | "outcome" | "wrong" | "no-prediction";
};

export const manualFixtures: ManualFixture[] = [
  { key: "rodada2-tchequia-africa-do-sul", round: "Fase de Grupos - Rodada 2", home: "Tchéquia", away: "África do Sul", homeFlag: "https://flagcdn.com/w80/cz.png", awayFlag: "https://flagcdn.com/w80/za.png", result: null },
  { key: "rodada2-suica-bosnia", round: "Fase de Grupos - Rodada 2", home: "Suíça", away: "Bósnia", homeFlag: "https://flagcdn.com/w80/ch.png", awayFlag: "https://flagcdn.com/w80/ba.png", result: null },
  { key: "rodada2-canada-catar", round: "Fase de Grupos - Rodada 2", home: "Canadá", away: "Catar", homeFlag: "https://flagcdn.com/w80/ca.png", awayFlag: "https://flagcdn.com/w80/qa.png", result: null },
  { key: "rodada2-mexico-coreia-do-sul", round: "Fase de Grupos - Rodada 2", home: "México", away: "Coreia do Sul", homeFlag: "https://flagcdn.com/w80/mx.png", awayFlag: "https://flagcdn.com/w80/kr.png", result: null },
  { key: "rodada2-eua-australia", round: "Fase de Grupos - Rodada 2", home: "EUA", away: "Austrália", homeFlag: "https://flagcdn.com/w80/us.png", awayFlag: "https://flagcdn.com/w80/au.png", result: null },
  { key: "rodada2-escocia-marrocos", round: "Fase de Grupos - Rodada 2", home: "Escócia", away: "Marrocos", homeFlag: "https://flagcdn.com/w80/gb-sct.png", awayFlag: "https://flagcdn.com/w80/ma.png", result: null },
  { key: "rodada2-brasil-haiti", round: "Fase de Grupos - Rodada 2", home: "Brasil", away: "Haiti", homeFlag: "https://flagcdn.com/w80/br.png", awayFlag: "https://flagcdn.com/w80/ht.png", result: null },
  { key: "rodada2-turquia-paraguai", round: "Fase de Grupos - Rodada 2", home: "Turquia", away: "Paraguai", homeFlag: "https://flagcdn.com/w80/tr.png", awayFlag: "https://flagcdn.com/w80/py.png", result: null },
  { key: "rodada2-holanda-suecia", round: "Fase de Grupos - Rodada 2", home: "Holanda", away: "Suécia", homeFlag: "https://flagcdn.com/w80/nl.png", awayFlag: "https://flagcdn.com/w80/se.png", result: null },
  { key: "rodada2-alemanha-costa-do-marfim", round: "Fase de Grupos - Rodada 2", home: "Alemanha", away: "Costa do Marfim", homeFlag: "https://flagcdn.com/w80/de.png", awayFlag: "https://flagcdn.com/w80/ci.png", result: null },
  { key: "rodada2-equador-curacao", round: "Fase de Grupos - Rodada 2", home: "Equador", away: "Curaçao", homeFlag: "https://flagcdn.com/w80/ec.png", awayFlag: "https://flagcdn.com/w80/cw.png", result: null },
  { key: "rodada2-tunisia-japao", round: "Fase de Grupos - Rodada 2", home: "Tunísia", away: "Japão", homeFlag: "https://flagcdn.com/w80/tn.png", awayFlag: "https://flagcdn.com/w80/jp.png", result: null },
  { key: "rodada2-espanha-arabia-saudita", round: "Fase de Grupos - Rodada 2", home: "Espanha", away: "Arábia Saudita", homeFlag: "https://flagcdn.com/w80/es.png", awayFlag: "https://flagcdn.com/w80/sa.png", result: null },
  { key: "rodada2-belgica-ira", round: "Fase de Grupos - Rodada 2", home: "Bélgica", away: "Irã", homeFlag: "https://flagcdn.com/w80/be.png", awayFlag: "https://flagcdn.com/w80/ir.png", result: null },
  { key: "rodada2-uruguai-cabo-verde", round: "Fase de Grupos - Rodada 2", home: "Uruguai", away: "Cabo Verde", homeFlag: "https://flagcdn.com/w80/uy.png", awayFlag: "https://flagcdn.com/w80/cv.png", result: null },
  { key: "rodada2-nova-zelandia-egito", round: "Fase de Grupos - Rodada 2", home: "Nova Zelândia", away: "Egito", homeFlag: "https://flagcdn.com/w80/nz.png", awayFlag: "https://flagcdn.com/w80/eg.png", result: null },
  { key: "rodada2-argentina-austria", round: "Fase de Grupos - Rodada 2", home: "Argentina", away: "Áustria", homeFlag: "https://flagcdn.com/w80/ar.png", awayFlag: "https://flagcdn.com/w80/at.png", result: null },
  { key: "rodada2-franca-iraque", round: "Fase de Grupos - Rodada 2", home: "França", away: "Iraque", homeFlag: "https://flagcdn.com/w80/fr.png", awayFlag: "https://flagcdn.com/w80/iq.png", result: null },
  { key: "rodada2-noruega-senegal", round: "Fase de Grupos - Rodada 2", home: "Noruega", away: "Senegal", homeFlag: "https://flagcdn.com/w80/no.png", awayFlag: "https://flagcdn.com/w80/sn.png", result: null },
  { key: "rodada2-jordania-argelia", round: "Fase de Grupos - Rodada 2", home: "Jordânia", away: "Argélia", homeFlag: "https://flagcdn.com/w80/jo.png", awayFlag: "https://flagcdn.com/w80/dz.png", result: null },
  { key: "rodada2-portugal-uzbequistao", round: "Fase de Grupos - Rodada 2", home: "Portugal", away: "Uzbequistão", homeFlag: "https://flagcdn.com/w80/pt.png", awayFlag: "https://flagcdn.com/w80/uz.png", result: null },
  { key: "rodada2-inglaterra-gana", round: "Fase de Grupos - Rodada 2", home: "Inglaterra", away: "Gana", homeFlag: "https://flagcdn.com/w80/gb-eng.png", awayFlag: "https://flagcdn.com/w80/gh.png", result: null },
  { key: "rodada2-panama-croacia", round: "Fase de Grupos - Rodada 2", home: "Panamá", away: "Croácia", homeFlag: "https://flagcdn.com/w80/pa.png", awayFlag: "https://flagcdn.com/w80/hr.png", result: null },
  { key: "rodada2-colombia-rd-congo", round: "Fase de Grupos - Rodada 2", home: "Colômbia", away: "RD Congo", homeFlag: "https://flagcdn.com/w80/co.png", awayFlag: "https://flagcdn.com/w80/cd.png", result: null },
];

function outcome(home: number, away: number) {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export function scoreFixture(
  fixture: ManualFixture,
  prediction?: ManualPrediction,
): FixtureScore {
  if (!fixture.result) {
    return { points: 0, status: "pending" };
  }

  if (!prediction) {
    return { points: 0, status: "no-prediction" };
  }

  if (prediction.home_score === fixture.result.home && prediction.away_score === fixture.result.away) {
    return { points: 10, status: "exact" };
  }

  if (outcome(prediction.home_score, prediction.away_score) === outcome(fixture.result.home, fixture.result.away)) {
    return { points: 5, status: "outcome" };
  }

  return { points: 0, status: "wrong" };
}
