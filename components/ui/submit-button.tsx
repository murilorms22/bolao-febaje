"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = ButtonProps & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  disabled,
  onClick,
  pendingText = "Processando...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState(false);
  const isPending = pending || clicked;

  useEffect(() => {
    if (!clicked || pending) {
      return;
    }

    const timeout = window.setTimeout(() => setClicked(false), 15000);
    return () => window.clearTimeout(timeout);
  }, [clicked, pending]);

  return (
    <Button
      {...props}
      disabled={disabled || isPending}
      onClick={(event) => {
        const form = event.currentTarget.form;

        if (!disabled && (!form || form.checkValidity())) {
          setClicked(true);
        }
        onClick?.(event);
      }}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {isPending ? pendingText : children}
    </Button>
  );
}
