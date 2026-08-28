import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const input = (
    <input
      type="checkbox"
      id={id}
      className={cn(
        "h-[18px] w-[18px] flex-none cursor-pointer accent-accent",
        className,
      )}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-xs text-[13px] font-text text-ink"
    >
      {input}
      {label}
    </label>
  );
}
