"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ManualFixture } from "@/lib/manual-fixtures";
import type { RankingPrediction, RankingProfile } from "@/lib/ranking";

function Flag({ src, name }: { src: string; name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="h-7 w-10 shrink-0 rounded border object-cover sm:h-8 sm:w-11" src={src} alt={`Bandeira ${name}`} />
  );
}

interface FixtureComparisonCardProps {
  fixture: ManualFixture;
  fixturePredictions: RankingPrediction[];
  profiles: RankingProfile[];
}

export function FixtureComparisonCard({
  fixture,
  fixturePredictions,
  profiles,
}: FixtureComparisonCardProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<'home' | 'draw' | 'away' | null>(null);

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  const homeUsers: string[] = [];
  const drawUsers: string[] = [];
  const awayUsers: string[] = [];

  for (const pred of fixturePredictions) {
    const profile = profileMap.get(pred.user_id);
    if (!profile) continue;
    
    const name = profile.display_name || profile.username;
    const homeScore = Number(pred.home_score);
    const awayScore = Number(pred.away_score);

    if (homeScore > awayScore) {
      homeUsers.push(name);
    } else if (homeScore < awayScore) {
      awayUsers.push(name);
    } else {
      drawUsers.push(name);
    }
  }

  // Sort names alphabetically
  homeUsers.sort((a, b) => a.localeCompare(b));
  drawUsers.sort((a, b) => a.localeCompare(b));
  awayUsers.sort((a, b) => a.localeCompare(b));

  const homeWins = homeUsers.length;
  const draws = drawUsers.length;
  const awayWins = awayUsers.length;

  const totalGuesses = homeWins + draws + awayWins;
  const homePct = totalGuesses > 0 ? (homeWins / totalGuesses) * 100 : 0;
  const drawPct = totalGuesses > 0 ? (draws / totalGuesses) * 100 : 0;
  const awayPct = totalGuesses > 0 ? (awayWins / totalGuesses) * 100 : 0;

  const handleToggle = (outcome: 'home' | 'draw' | 'away') => {
    setSelectedOutcome(prev => prev === outcome ? null : outcome);
  };

  return (
    <Card className="relative h-full border-2 bg-card flex flex-col justify-between">
      <div>
        <Badge className="absolute right-2 top-2 text-[11px]" variant="outline">
          {totalGuesses} {totalGuesses === 1 ? "palpite" : "palpites"}
        </Badge>
        <CardHeader className="space-y-2 p-3 pb-2 sm:space-y-3 sm:p-4 sm:pb-3">
          <CardDescription className="pr-20 text-[11px] leading-tight sm:text-xs">{fixture.round}</CardDescription>
          <CardTitle className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs sm:text-sm">
            <span className="flex min-w-0 items-center gap-2 sm:flex-col sm:text-center">
              <Flag src={fixture.homeFlag} name={fixture.home} />
              <span className="min-w-0 break-words leading-tight">{fixture.home}</span>
            </span>
            <span className="text-muted-foreground">x</span>
            <span className="flex min-w-0 flex-row-reverse items-center gap-2 text-right sm:flex-col sm:text-center">
              <Flag src={fixture.awayFlag} name={fixture.away} />
              <span className="min-w-0 break-words leading-tight">{fixture.away}</span>
            </span>
          </CardTitle>
          <div className="text-center text-lg font-semibold sm:text-xl">
            {fixture.result ? `${fixture.result.home}x${fixture.result.away}` : "?x?"}
          </div>
        </CardHeader>
      </div>

      <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
        {totalGuesses === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">
            Nenhum palpite registrado para este jogo.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted mt-2">
              {homeWins > 0 && (
                <button
                  type="button"
                  style={{ width: `${homePct}%` }}
                  onClick={() => handleToggle('home')}
                  className={cn(
                    "bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center transition-all hover:brightness-90 outline-none",
                    selectedOutcome === 'home' && "ring-2 ring-black dark:ring-white z-10 scale-y-110"
                  )}
                  title={`Vitória do ${fixture.home}: ${homeWins}`}
                >
                  {homePct >= 10 && `${homePct.toFixed(0)}%`}
                </button>
              )}
              {draws > 0 && (
                <button
                  type="button"
                  style={{ width: `${drawPct}%` }}
                  onClick={() => handleToggle('draw')}
                  className={cn(
                    "bg-yellow-500 text-[10px] font-bold text-black flex items-center justify-center transition-all hover:brightness-95 outline-none",
                    selectedOutcome === 'draw' && "ring-2 ring-black dark:ring-white z-10 scale-y-110"
                  )}
                  title={`Empate: ${draws}`}
                >
                  {drawPct >= 10 && `${drawPct.toFixed(0)}%`}
                </button>
              )}
              {awayWins > 0 && (
                <button
                  type="button"
                  style={{ width: `${awayPct}%` }}
                  onClick={() => handleToggle('away')}
                  className={cn(
                    "bg-red-500 text-[10px] font-bold text-white flex items-center justify-center transition-all hover:brightness-90 outline-none",
                    selectedOutcome === 'away' && "ring-2 ring-black dark:ring-white z-10 scale-y-110"
                  )}
                  title={`Vitória do ${fixture.away}: ${awayWins}`}
                >
                  {awayPct >= 10 && `${awayPct.toFixed(0)}%`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <button
                type="button"
                onClick={() => handleToggle('home')}
                className={cn(
                  "rounded p-1.5 border select-none transition-colors flex flex-col items-center justify-center outline-none",
                  selectedOutcome === 'home'
                    ? "bg-blue-100 border-blue-400 dark:bg-blue-900/60 dark:border-blue-500"
                    : "bg-blue-50/50 border-blue-100 hover:bg-blue-100/30 dark:bg-blue-950/20 dark:border-blue-900/30 dark:hover:bg-blue-950/40"
                )}
              >
                <span className="text-[10px] text-muted-foreground leading-tight font-medium">Casa</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  {homeWins} ({homePct.toFixed(0)}%)
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => handleToggle('draw')}
                className={cn(
                  "rounded p-1.5 border select-none transition-colors flex flex-col items-center justify-center outline-none",
                  selectedOutcome === 'draw'
                    ? "bg-yellow-100 border-yellow-400 dark:bg-yellow-900/60 dark:border-yellow-500"
                    : "bg-yellow-50/50 border-yellow-100 hover:bg-yellow-100/30 dark:bg-yellow-950/20 dark:border-yellow-900/30 dark:hover:bg-yellow-950/40"
                )}
              >
                <span className="text-[10px] text-muted-foreground leading-tight font-medium">Empate</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-450 mt-0.5">
                  {draws} ({drawPct.toFixed(0)}%)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToggle('away')}
                className={cn(
                  "rounded p-1.5 border select-none transition-colors flex flex-col items-center justify-center outline-none",
                  selectedOutcome === 'away'
                    ? "bg-red-100 border-red-400 dark:bg-red-900/60 dark:border-red-500"
                    : "bg-red-50/50 border-red-100 hover:bg-red-100/30 dark:bg-red-950/20 dark:border-red-900/30 dark:hover:bg-red-950/40"
                )}
              >
                <span className="text-[10px] text-muted-foreground leading-tight font-medium">Fora</span>
                <span className="font-semibold text-red-600 dark:text-red-400 mt-0.5">
                  {awayWins} ({awayPct.toFixed(0)}%)
                </span>
              </button>
            </div>

            {selectedOutcome && (
              <div className="mt-3 p-2.5 bg-muted/60 dark:bg-muted/30 rounded-lg text-xs border border-dashed border-muted-foreground/30 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Palpitaram em: {selectedOutcome === 'home' ? fixture.home : selectedOutcome === 'draw' ? 'Empate' : fixture.away}
                </div>
                <p className="text-foreground leading-relaxed break-words font-medium">
                  {selectedOutcome === 'home' && (homeUsers.join(", ") || "Nenhum participante")}
                  {selectedOutcome === 'draw' && (drawUsers.join(", ") || "Nenhum participante")}
                  {selectedOutcome === 'away' && (awayUsers.join(", ") || "Nenhum participante")}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
