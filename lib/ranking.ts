import { manualFixtures, normalizeFixtureKey, scoreFixture, type ManualPrediction } from "@/lib/manual-fixtures";

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

export function calculateRanking(profiles: RankingProfile[] = [], predictions: RankingPrediction[] = []) {
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
      let predictionPoints = 0;
      let exactPredictions = 0;
      let correctOutcomes = 0;

      for (const fixture of manualFixtures) {
        const score = scoreFixture(fixture, userPredictions?.get(normalizeFixtureKey(fixture.id)));
        predictionPoints += score.points;
        if (score.status === "exact") exactPredictions += 1;
        if (score.status === "outcome") correctOutcomes += 1;
      }

      return {
        id: profile.id,
        name: profile.display_name || profile.username,
        initialPoints: Number(profile.initial_points || 0),
        predictionPoints,
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
