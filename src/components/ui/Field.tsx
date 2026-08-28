import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  /** Message d'erreur (convention validation, prompt §4). */
  error?: string;
  /** Aide contextuelle affichée sous le champ. */
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Enveloppe label + contrôle + message d'erreur / d'aide.
 * Le contrôle (`Input`, `Textarea`, `Select`…) est passé en enfant.
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 text-[12px] font-semibold text-ink-80"
        >
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-fine text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-fine text-ink-48">{hint}</p>
      ) : null}
    </div>
  );
}
