"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResultForm({
  action,
  isSaved,
  fixtureKey,
  homeName,
  awayName,
  homeScore,
  awayScore,
}: {
  action: (formData: FormData) => void | Promise<void>;
  isSaved: boolean;
  fixtureKey: string;
  homeName: string;
  awayName: string;
  homeScore: number | "";
  awayScore: number | "";
}) {
  const [isEditing, setIsEditing] = useState(!isSaved);

  function openForEdit() {
    const confirmed = window.confirm(
      "Este placar ja foi salvo. Deseja abrir para edicao? Ao salvar, o placar anterior sera sobrescrito e a pontuacao sera recalculada.",
    );

    if (confirmed) {
      setIsEditing(true);
    }
  }

  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          isSaved
            ? "Confirmar alteracao deste placar? O valor salvo anteriormente sera substituido."
            : "Voce tem certeza que esse e o placar correto da partida? Os pontos serao calculados de acordo com este placar.",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="fixture_key" value={fixtureKey} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <Input
          className="h-11 text-center text-base font-medium"
          aria-label={`Placar ${homeName}`}
          name="home_score"
          type="number"
          min="0"
          max="99"
          defaultValue={homeScore}
          disabled={!isEditing}
          required
        />
        <span className="text-muted-foreground">x</span>
        <Input
          className="h-11 text-center text-base font-medium"
          aria-label={`Placar ${awayName}`}
          name="away_score"
          type="number"
          min="0"
          max="99"
          defaultValue={awayScore}
          disabled={!isEditing}
          required
        />
      </div>
      {isEditing ? (
        <SubmitButton className="w-full" pendingText="Salvando...">
          {isSaved ? "Salvar novo placar" : "Salvar placar correto"}
        </SubmitButton>
      ) : (
        <Button className="w-full" type="button" variant="outline" onClick={openForEdit}>
          Editar placar
        </Button>
      )}
    </form>
  );
}
