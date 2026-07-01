"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  normalizeFixtureKey,
  scoreFixture,
  type ManualFixture,
  type ManualPrediction,
} from "@/lib/manual-fixtures";
import { type RankingPrediction } from "@/lib/ranking";
import { cn } from "@/lib/utils";

type RankingRow = {
  id: string;
  name: string;
  initialPoints: number;
  predictionPoints: number;
  groupStagePoints: number;
  knockoutStagePoints: number;
  totalPoints: number;
  exactPredictions: number;
  correctOutcomes: number;
};

type RankingListProps = {
  ranking: RankingRow[];
  fixtures: ManualFixture[];
  rounds: string[];
  predictions: RankingPrediction[];
};

const statusStyles = {
  pending: "border-muted bg-card",
  exact: "border-blue-500 bg-blue-50 dark:bg-blue-950/35",
  outcome: "border-green-500 bg-green-50 dark:bg-green-950/35",
  wrong: "border-red-500 bg-red-50 dark:bg-red-950/35",
  "no-prediction": "border-muted bg-muted/30",
};

function Flag({ src, name }: { src: string; name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="h-4 w-6 shrink-0 rounded-[2px] border object-cover" src={src} alt={`Bandeira ${name}`} />
  );
}

function PredictionSummary({
  participantId,
  fixtures,
  rounds,
  predictionsByUser,
}: {
  participantId: string;
  fixtures: ManualFixture[];
  rounds: string[];
  predictionsByUser: Map<string, Map<string, ManualPrediction>>;
}) {
  const [selectedRound, setSelectedRound] = useState(rounds[rounds.length - 1] || "");
  const userPredictions = predictionsByUser.get(participantId);
  const visibleFixtures = fixtures.filter((fixture) => fixture.round === selectedRound);

  return (
    <div className="space-y-3 border-t bg-muted/20 p-3">
      <Select value={selectedRound} onChange={(event) => setSelectedRound(event.target.value)} aria-label="Selecionar rodada">
        {rounds.map((round) => (
          <option key={round} value={round}>
            {round}
          </option>
        ))}
      </Select>

      <div className="grid gap-1.5">
        {visibleFixtures.map((fixture) => {
          const prediction = userPredictions?.get(normalizeFixtureKey(fixture.id));
          const score = scoreFixture(fixture, prediction);

          return (
            <div
              key={fixture.id}
              className={cn(
                "grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-1 rounded-md border-2 px-2 py-1 text-xs",
                statusStyles[score.status],
              )}
              title={`${fixture.home} x ${fixture.away}`}
            >
              <Flag src={fixture.homeFlag} name={fixture.home} />
              <span className="text-right font-medium tabular-nums">{prediction?.home_score ?? "?"}</span>
              <span className="text-muted-foreground">x</span>
              <span className="font-medium tabular-nums">{prediction?.away_score ?? "?"}</span>
              <Flag src={fixture.awayFlag} name={fixture.away} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RankingList({ ranking, fixtures, rounds, predictions }: RankingListProps) {
  const [openParticipantId, setOpenParticipantId] = useState<string | null>(null);
  const predictionsByUser = useMemo(() => {
    const map = new Map<string, Map<string, ManualPrediction>>();

    for (const prediction of predictions) {
      if (!map.has(prediction.user_id)) {
        map.set(prediction.user_id, new Map());
      }
      map.get(prediction.user_id)?.set(normalizeFixtureKey(prediction.fixture_key), prediction);
    }

    return map;
  }, [predictions]);

  if (!ranking.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          O ranking aparece aqui quando houver participantes.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <div className="grid grid-cols-[48px_minmax(0,1fr)_80px_120px_100px_80px_95px_36px] border-b px-4 py-3 text-left text-sm text-muted-foreground">
          <span>#</span>
          <span>Nome</span>
          <span>Total</span>
          <span>Fase de Grupos</span>
          <span>Mata-Mata</span>
          <span>Exatos</span>
          <span>Resultados</span>
          <span />
        </div>

        {ranking.map((row, index) => {
          const isOpen = openParticipantId === row.id;

          return (
            <div key={row.id} className="border-b last:border-0">
              <button
                className="grid w-full grid-cols-[48px_minmax(0,1fr)_80px_120px_100px_80px_95px_36px] items-center px-4 py-3 text-left text-sm hover:bg-accent"
                onClick={() => setOpenParticipantId(isOpen ? null : row.id)}
              >
                <span>{index + 1}</span>
                <span className="truncate font-medium">{row.name}</span>
                <span className="font-semibold">{row.totalPoints}</span>
                <span>{row.groupStagePoints} pts</span>
                <span>{row.knockoutStagePoints} pts</span>
                <span>{row.exactPredictions}</span>
                <span>{row.correctOutcomes}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : null)} />
              </button>

              {isOpen ? (
                <PredictionSummary
                  participantId={row.id}
                  fixtures={fixtures}
                  rounds={rounds}
                  predictionsByUser={predictionsByUser}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="space-y-3 md:hidden">
        {ranking.map((row, index) => {
          const isOpen = openParticipantId === row.id;

          return (
            <Card key={row.id} className="overflow-hidden">
              <button
                className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-accent"
                onClick={() => setOpenParticipantId(isOpen ? null : row.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">#{index + 1}</p>
                  <p className="truncate font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.exactPredictions} exatos · {row.correctOutcomes} resultados
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xl font-semibold">{row.totalPoints}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : null)} />
                </div>
              </button>

              {isOpen ? (
                <div className="border-t bg-muted/10 px-4 py-3 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded border bg-card p-2">
                      <span className="text-[10px] text-muted-foreground block font-medium">Fase de Grupos</span>
                      <span className="text-sm font-bold text-foreground mt-0.5">{row.groupStagePoints} pts</span>
                    </div>
                    <div className="rounded border bg-card p-2">
                      <span className="text-[10px] text-muted-foreground block font-medium">Mata-Mata</span>
                      <span className="text-sm font-bold text-foreground mt-0.5">{row.knockoutStagePoints} pts</span>
                    </div>
                    <div className="rounded border bg-card p-2">
                      <span className="text-[10px] text-muted-foreground block font-medium">Exatos</span>
                      <span className="text-sm font-bold text-foreground mt-0.5">{row.exactPredictions}</span>
                    </div>
                    <div className="rounded border bg-card p-2">
                      <span className="text-[10px] text-muted-foreground block font-medium">Resultados</span>
                      <span className="text-sm font-bold text-foreground mt-0.5">{row.correctOutcomes}</span>
                    </div>
                    {row.initialPoints > 0 && (
                      <div className="rounded border bg-card p-2 col-span-2">
                        <span className="text-[10px] text-muted-foreground block font-medium">Pontos Iniciais</span>
                        <span className="text-sm font-bold text-foreground mt-0.5">{row.initialPoints} pts</span>
                      </div>
                    )}
                  </div>
                  <PredictionSummary
                    participantId={row.id}
                    fixtures={fixtures}
                    rounds={rounds}
                    predictionsByUser={predictionsByUser}
                  />
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function CompactRankingList({ ranking, fixtures, rounds, predictions }: RankingListProps) {
  const [openParticipantId, setOpenParticipantId] = useState<string | null>(null);
  const predictionsByUser = useMemo(() => {
    const map = new Map<string, Map<string, ManualPrediction>>();

    for (const prediction of predictions) {
      if (!map.has(prediction.user_id)) {
        map.set(prediction.user_id, new Map());
      }
      map.get(prediction.user_id)?.set(normalizeFixtureKey(prediction.fixture_key), prediction);
    }

    return map;
  }, [predictions]);

  if (!ranking.length) {
    return <p className="text-sm text-muted-foreground">Nenhum participante no ranking.</p>;
  }

  return (
    <div className="space-y-2">
      {ranking.map((row, index) => {
        const isOpen = openParticipantId === row.id;

        return (
          <div key={row.id} className="overflow-hidden rounded-md border">
            <button
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-accent"
              onClick={() => setOpenParticipantId(isOpen ? null : row.id)}
            >
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">#{index + 1}</p>
                <p className="truncate text-sm font-medium">{row.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {row.exactPredictions} exatos · {row.correctOutcomes} resultados
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-right">
                <div>
                  <p className="text-lg font-semibold">{row.totalPoints}</p>
                  <p className="text-[11px] text-muted-foreground">pts</p>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : null)} />
              </div>
            </button>

            {isOpen ? (
              <div className="border-t bg-muted/10 p-2.5 space-y-3">
                <div className="grid grid-cols-2 gap-1.5 text-center text-[11px]">
                  <div className="rounded border bg-card p-1">
                    <span className="text-[9px] text-muted-foreground block font-medium">Grupos</span>
                    <span className="font-bold text-foreground">{row.groupStagePoints} pts</span>
                  </div>
                  <div className="rounded border bg-card p-1">
                    <span className="text-[9px] text-muted-foreground block font-medium">Mata-Mata</span>
                    <span className="font-bold text-foreground">{row.knockoutStagePoints} pts</span>
                  </div>
                  <div className="rounded border bg-card p-1">
                    <span className="text-[9px] text-muted-foreground block font-medium">Exatos</span>
                    <span className="font-bold text-foreground">{row.exactPredictions}</span>
                  </div>
                  <div className="rounded border bg-card p-1">
                    <span className="text-[9px] text-muted-foreground block font-medium">Resultados</span>
                    <span className="font-bold text-foreground">{row.correctOutcomes}</span>
                  </div>
                </div>
                <PredictionSummary
                  participantId={row.id}
                  fixtures={fixtures}
                  rounds={rounds}
                  predictionsByUser={predictionsByUser}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
