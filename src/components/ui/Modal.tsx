"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "w-[340px]",
  md: "w-[400px]",
  lg: "w-[440px]",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Sous-titre optionnel sous le titre. */
  subtitle?: ReactNode;
  size?: Size;
  /** Masquer la croix de fermeture. */
  hideClose?: boolean;
  children: ReactNode;
}

/**
 * Modale centrée sur fond assombri (pattern de la maquette : clic hors carte =
 * fermeture, `Esc` = fermeture, contenu de la carte protégé par `stopPropagation`).
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  hideClose,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "max-h-[80vh] overflow-auto rounded-lg bg-canvas p-[22px] shadow-[0_12px_40px_rgba(0,0,0,0.2)]",
          sizes[size],
        )}
      >
        {(title || !hideClose) && (
          <div className="mb-1 flex items-start justify-between gap-4">
            {title && (
              <h3 className="font-display text-[16px] font-semibold text-ink">
                {title}
              </h3>
            )}
            {!hideClose && (
              <IconButton
                size="sm"
                label="Fermer"
                onClick={onClose}
                icon={<X size={17} />}
                className="-mr-1 -mt-1"
              />
            )}
          </div>
        )}
        {subtitle && (
          <p className="mb-4 text-caption text-ink-48">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}
