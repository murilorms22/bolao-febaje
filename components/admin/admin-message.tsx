import { Badge } from "@/components/ui/badge";

export function AdminMessage({
  error,
  success,
}: {
  error?: string | string[];
  success?: string | string[];
}) {
  const errorText = Array.isArray(error) ? error[0] : error;
  const successText = Array.isArray(success) ? success[0] : success;

  if (!errorText && !successText) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card p-3 text-sm">
      {errorText ? <Badge variant="destructive">{errorText}</Badge> : null}
      {successText ? <Badge variant="secondary">{successText}</Badge> : null}
    </div>
  );
}
