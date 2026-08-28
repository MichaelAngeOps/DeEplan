import type { ReactNode } from "react";
import { Info, TriangleAlert, CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "warning" | "danger";

const tones: Record<Tone, { icon: ReactNode; text: string }> = {
  info: { icon: <Info size={15} className="text-accent" />, text: "text-ink" },
  warning: {
    icon: <TriangleAlert size={15} className="text-warning" />,
    text: "text-ink",
  },
  danger: {
    icon: <CircleAlert size={15} className="text-danger" />,
    text: "text-ink",
  },
};

export interface BannerProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Banner({ tone = "info", children, className }: BannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md border border-hairline bg-parchment px-4 py-3",
        className,
      )}
    >
      <span className="flex-none">{tones[tone].icon}</span>
      <span className={cn("text-caption", tones[tone].text)}>{children}</span>
    </div>
  );
}
