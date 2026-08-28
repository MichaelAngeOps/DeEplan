import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { controlBase } from "./Input";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({
  invalid,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "resize-none font-text",
        invalid ? "border-danger" : "border-hairline",
        className,
      )}
      {...props}
    />
  );
}
