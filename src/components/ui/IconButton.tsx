import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "plain" | "outline";
type Size = "sm" | "md";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Icône (ex. `<Pencil size={15} />` de lucide-react). */
  icon: ReactNode;
  /** Libellé accessible obligatoire. */
  label: string;
  variant?: Variant;
  size?: Size;
}

const sizes: Record<Size, string> = {
  sm: "h-7 w-7",
  md: "h-[30px] w-[30px]",
};

const variants: Record<Variant, string> = {
  plain: "text-ink-48 hover:text-ink bg-transparent",
  outline: "border border-hairline bg-canvas text-ink",
};

export function IconButton({
  icon,
  label,
  variant = "plain",
  size = "md",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full cursor-pointer",
        "transition duration-fast ease-smooth active:scale-press",
        "disabled:cursor-not-allowed disabled:opacity-50",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
