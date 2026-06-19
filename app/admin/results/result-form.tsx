"use client";

import { type ReactNode } from "react";

export function ResultForm({
  action,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className="space-y-3"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Você tem certeza que esse é o placar correto da partida? Os pontos serão calculados de acordo com este placar.",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
