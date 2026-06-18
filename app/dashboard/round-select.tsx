"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";

export function RoundSelect({ rounds }: { rounds: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRound = searchParams.get("round") || rounds[rounds.length - 1] || "all";

  return (
    <Select
      className="w-full sm:w-72"
      value={selectedRound}
      onChange={(event) => {
        const value = event.target.value;
        router.push(value === "all" ? "/dashboard" : `/dashboard?round=${encodeURIComponent(value)}`);
      }}
    >
      <option value="all">Todas as rodadas</option>
      {rounds.map((round) => (
        <option key={round} value={round}>
          {round}
        </option>
      ))}
    </Select>
  );
}
