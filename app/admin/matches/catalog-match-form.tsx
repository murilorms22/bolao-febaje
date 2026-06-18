"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { round2StartDateTime, round2Teams } from "@/lib/world-cup-round2";
import { createRound2CatalogMatch } from "../actions";

type Round = {
  id: string;
  name: string;
};

function FlagPreview({ teamName }: { teamName: string }) {
  const team = useMemo(() => round2Teams.find((item) => item.name === teamName), [teamName]);

  if (!team) {
    return <div className="h-10 rounded-md border bg-muted" />;
  }

  return (
    <div className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="h-6 w-9 object-cover" src={team.flagUrl} alt={`Bandeira ${team.name}`} />
      <span>{team.name}</span>
    </div>
  );
}

export function CatalogMatchForm({ rounds }: { rounds: Round[] }) {
  const [homeTeamName, setHomeTeamName] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");

  return (
    <form action={createRound2CatalogMatch} className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-2">
        <Label htmlFor="round2-round">Rodada</Label>
        <Select id="round2-round" name="round_id" required>
          <option value="">Selecione</option>
          {rounds.map((round) => (
            <option key={round.id} value={round.id}>
              {round.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="round2-home">Mandante</Label>
        <Select
          id="round2-home"
          name="home_team_name"
          value={homeTeamName}
          onChange={(event) => setHomeTeamName(event.target.value)}
          required
        >
          <option value="">Selecione</option>
          {round2Teams.map((team) => (
            <option key={team.fifaCode} value={team.name}>
              {team.flag} {team.name}
            </option>
          ))}
        </Select>
        <FlagPreview teamName={homeTeamName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="round2-away">Visitante</Label>
        <Select
          id="round2-away"
          name="away_team_name"
          value={awayTeamName}
          onChange={(event) => setAwayTeamName(event.target.value)}
          required
        >
          <option value="">Selecione</option>
          {round2Teams.map((team) => (
            <option key={team.fifaCode} value={team.name}>
              {team.flag} {team.name}
            </option>
          ))}
        </Select>
        <FlagPreview teamName={awayTeamName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="round2-starts-at">Data/hora</Label>
        <Input id="round2-starts-at" name="starts_at" type="datetime-local" defaultValue={round2StartDateTime} required />
      </div>

      <div className="flex items-end">
        <SubmitButton pendingText="Cadastrando...">Cadastrar jogo</SubmitButton>
      </div>
    </form>
  );
}
