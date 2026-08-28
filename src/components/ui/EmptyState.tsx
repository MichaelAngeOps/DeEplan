import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-hairline px-6 py-10 text-center",
        className,
      )}
    >
      {icon && <span className="text-ink-48">{icon}</span>}
      {title && (
        <p className="font-display text-[15px] font-semibold text-ink">{title}</p>
      )}
      <p className="text-caption text-ink-48">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
