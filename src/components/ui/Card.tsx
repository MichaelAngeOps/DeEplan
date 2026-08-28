import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Padding = "none" | "sm" | "md";

const paddings: Record<Padding, string> = {
  none: "",
  sm: "p-5",
  md: "p-6",
};

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  padding?: Padding;
  /** Titre optionnel rendu en en-tête de carte. */
  title?: ReactNode;
  /** Contenu additionnel aligné à droite du titre. */
  headerAction?: ReactNode;
}

export function Card({
  padding = "md",
  title,
  headerAction,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-hairline bg-canvas",
        paddings[padding],
        className,
      )}
      {...props}
    >
      {(title || headerAction) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.2px] text-ink">
              {title}
            </h2>
          )}
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
}
