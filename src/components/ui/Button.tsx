import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dashed";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-xs rounded-pill font-text " +
  "cursor-pointer transition duration-fast ease-smooth active:scale-press " +
  "disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "border-0 bg-accent text-white",
  secondary: "border border-hairline bg-pearl text-ink-80",
  ghost: "border-0 bg-transparent text-ink-48",
  danger: "border border-hairline bg-pearl text-danger",
  dashed: "border border-dashed border-hairline bg-transparent text-accent",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-[12px] font-semibold",
  md: "px-4 py-2 text-[12.5px] font-semibold",
  lg: "px-5 py-3 text-[14px] font-semibold",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
