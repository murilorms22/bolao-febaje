import {
  manualFixtures,
  normalizeFixtureKey,
  scoreFixture,
  type ManualFixture,
  type ManualPrediction,
} from "@/lib/manual-fixtures";
import { rodada2Predictions } from "@/lib/rodada2-predictions";
import { rodada3Predictions } from "@/lib/rodada3-predictions";
import { predictions16avos } from "@/lib/16avos-predictions";
import { predictionsOitavas } from "@/lib/oitavas-predictions";
import { predictionsQuartas } from "@/lib/quartas-predictions";

export type RankingProfile = {
  id: string;
  username: string;
  display_name: string | null;
  initial_points: number;
  role: string;
};

export type RankingPrediction = ManualPrediction & {
  user_id: string;
};

function normalizeParticipantName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function participantLookupKeys(value: string) {
  const normalized = normalizeParticipantName(value);

  if (!normalized) {
    return [];
  }

  const dotted = normalized.replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  const compact = normalized.replace(/[^a-z0-9]+/g, "");

  return Array.from(new Set([normalized, dotted, compact]));
}

const round2PredictionAliases: Record<string, string[]> = {
  "altermir.da.silva": ["altemir", "altemir da silva", "altemir.da.silva", "altermir", "altermir da silva"],
  "altemir": ["altermir.da.silva", "altemir", "altemir da silva"],
  "altemir.da.silva": ["altermir.da.silva", "altemir", "altermir"],
  "debora.dallacort": ["debora", "debora dallacort"],
  "debora": ["debora.dallacort", "debora dallacort"],
  "raissa": ["raissa.remboski", "raissa remboski"],
  "raissa.remboski": ["raissa", "raissa remboski"],
  "victor.barreto": ["victor barreto", "victorbarreto"],
};

function exactLookupKeys(username: string, displayName?: string | null) {
  return Array.from(new Set([...participantLookupKeys(username), ...participantLookupKeys(displayName || "")]));
}

function aliasLookupKeys(username: string, displayName?: string | null) {
  const baseKeys = [...participantLookupKeys(username), ...participantLookupKeys(displayName || "")];
  const aliasKeys = baseKeys.flatMap((key) => round2PredictionAliases[key] || []);

  return Array.from(new Set(aliasKeys.flatMap(participantLookupKeys)));
}

const rodada2PredictionsByParticipant = new Map(
  rodada2Predictions.flatMap((participant) => {
    const keys = exactLookupKeys(participant.username, participant.displayName);
    return keys.map((key) => [key, participant.predictions] as const);
  }),
);

const rodada3PredictionsByParticipant = new Map(
  rodada3Predictions.flatMap((participant) => {
    const keys = exactLookupKeys(participant.username, participant.displayName);
    return keys.map((key) => [key, participant.predictions] as const);
  }),
);

const predictions16avosByParticipant = new Map(
  predictions16avos.flatMap((participant) => {
    const keys = exactLookupKeys(participant.username, participant.displayName);
    return keys.map((key) => [key, participant.predictions] as const);
  }),
);

const predictionsOitavasByParticipant = new Map(
  predictionsOitavas.flatMap((participant) => {
    const keys = exactLookupKeys(participant.username, participant.displayName);
    return keys.map((key) => [key, participant.predictions] as const);
  }),
);

const predictionsQuartasByParticipant = new Map(
  predictionsQuartas.flatMap((participant) => {
    const keys = exactLookupKeys(participant.username, participant.displayName);
    return keys.map((key) => [key, participant.predictions] as const);
  }),
);

function findRound2Predictions(username: string, displayName?: string | null) {
  const predictions: { fixtureKey: string; homeScore: number; awayScore: number }[] = [];

  for (const key of exactLookupKeys(username, displayName)) {
    const p2 = rodada2PredictionsByParticipant.get(key);
    if (p2) predictions.push(...p2);
    const p3 = rodada3PredictionsByParticipant.get(key);
    if (p3) predictions.push(...p3);
    const p16 = predictions16avosByParticipant.get(key);
    if (p16) predictions.push(...p16);
    const pOitavas = predictionsOitavasByParticipant.get(key);
    if (pOitavas) predictions.push(...pOitavas);
    const pQuartas = predictionsQuartasByParticipant.get(key);
    if (pQuartas) predictions.push(...pQuartas);
  }

  if (predictions.length === 0) {
    for (const key of aliasLookupKeys(username, displayName)) {
      const p2 = rodada2PredictionsByParticipant.get(key);
      if (p2) predictions.push(...p2);
      const p3 = rodada3PredictionsByParticipant.get(key);
      if (p3) predictions.push(...p3);
      const p16 = predictions16avosByParticipant.get(key);
      if (p16) predictions.push(...p16);
      const pOitavas = predictionsOitavasByParticipant.get(key);
      if (pOitavas) predictions.push(...pOitavas);
      const pQuartas = predictionsQuartasByParticipant.get(key);
      if (pQuartas) predictions.push(...pQuartas);
    }
  }

  return predictions;
}

export function applyRound2FallbackPredictions(
  profile: Pick<RankingProfile, "username" | "display_name">,
  predictions: ManualPrediction[] = [],
) {
  const predictionsByFixture = new Map(
    predictions.map((prediction) => [normalizeFixtureKey(prediction.fixture_key), prediction]),
  );

  for (const prediction of findRound2Predictions(profile.username, profile.display_name)) {
    const fixtureKey = normalizeFixtureKey(prediction.fixtureKey);

    if (!predictionsByFixture.has(fixtureKey)) {
      predictionsByFixture.set(fixtureKey, {
        fixture_key: fixtureKey,
        home_score: prediction.homeScore,
        away_score: prediction.awayScore,
      });
    }
  }

  return Array.from(predictionsByFixture.values());
}

export function applyRound2FallbackRankingPredictions(
  profiles: RankingProfile[] = [],
  predictions: RankingPrediction[] = [],
) {
  const predictionsByUser = new Map<string, RankingPrediction[]>();

  for (const prediction of predictions) {
    if (!predictionsByUser.has(prediction.user_id)) {
      predictionsByUser.set(prediction.user_id, []);
    }

    predictionsByUser.get(prediction.user_id)?.push(prediction);
  }

  const mergedPredictions: RankingPrediction[] = [];

  for (const profile of profiles) {
    const userPredictions = applyRound2FallbackPredictions(profile, predictionsByUser.get(profile.id) || []).map(
      (prediction) => ({
        ...prediction,
        user_id: profile.id,
      }),
    );

    mergedPredictions.push(...userPredictions);
  }

  return mergedPredictions;
}

export function calculateRanking(
  profiles: RankingProfile[] = [],
  predictions: RankingPrediction[] = [],
  fixtures: ManualFixture[] = manualFixtures,
) {
  const predictionsByUser = new Map<string, Map<string, ManualPrediction>>();

  for (const prediction of predictions) {
    if (!predictionsByUser.has(prediction.user_id)) {
      predictionsByUser.set(prediction.user_id, new Map());
    }
    predictionsByUser.get(prediction.user_id)?.set(normalizeFixtureKey(prediction.fixture_key), prediction);
  }

  return profiles
    .filter((profile) => profile.role !== "admin" && profile.username !== "muriloadm")
    .map((profile) => {
      const userPredictions = predictionsByUser.get(profile.id);
      let groupStagePoints = 0;
      let knockoutStagePoints = 0;
      let exactPredictions = 0;
      let correctOutcomes = 0;

      for (const fixture of fixtures) {
        const score = scoreFixture(fixture, userPredictions?.get(normalizeFixtureKey(fixture.id)));
        const isKnockout = !fixture.round.startsWith("Fase de Grupos");
        if (isKnockout) {
          knockoutStagePoints += score.points;
        } else {
          groupStagePoints += score.points;
        }
        if (score.status === "exact") exactPredictions += 1;
        if (score.status === "outcome") correctOutcomes += 1;
      }

      const predictionPoints = groupStagePoints + knockoutStagePoints;

      return {
        id: profile.id,
        name: profile.display_name || profile.username,
        initialPoints: Number(profile.initial_points || 0),
        predictionPoints,
        groupStagePoints,
        knockoutStagePoints,
        totalPoints: Number(profile.initial_points || 0) + predictionPoints,
        exactPredictions,
        correctOutcomes,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactPredictions !== a.exactPredictions) return b.exactPredictions - a.exactPredictions;
      return b.correctOutcomes - a.correctOutcomes;
    });
}
