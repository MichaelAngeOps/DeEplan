import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

type Size = "sm" | "md";

export interface MonthNavigatorProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  size?: Size;
  className?: string;
}

export function MonthNavigator({
  label,
  onPrev,
  onNext,
  size = "md",
  className,
}: MonthNavigatorProps) {
  const iconSize = size === "sm" ? 13 : 15;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <IconButton
        variant="outline"
        size={size}
        label="Mois précédent"
        onClick={onPrev}
        icon={<ChevronLeft size={iconSize} />}
      />
      <span
        className={cn(
          "text-center font-display font-semibold tracking-[-0.2px]",
          size === "sm" ? "min-w-[110px] text-[14px]" : "min-w-[140px] text-[16px]",
        )}
      >
        {label}
      </span>
      <IconButton
        variant="outline"
        size={size}
        label="Mois suivant"
        onClick={onNext}
        icon={<ChevronRight size={iconSize} />}
      />
    </div>
  );
}
