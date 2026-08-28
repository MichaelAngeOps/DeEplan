import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const controlBase =
  "w-full rounded-sm border bg-canvas px-3.5 py-2.5 text-[14px] font-text " +
  "text-ink placeholder:text-ink-48 outline-none transition duration-fast ease-smooth " +
  "focus:border-accent focus:ring-2 focus:ring-accent-focus/30 " +
  "disabled:cursor-not-allowed disabled:bg-parchment disabled:text-ink-48";

export { controlBase };

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        invalid ? "border-danger" : "border-hairline",
        className,
      )}
      {...props}
    />
  );
}
