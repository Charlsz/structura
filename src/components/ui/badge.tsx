import * as React from "react";
import { cn } from "@/utils/cn";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "destructive";
}) {
  const variants: Record<string, string> = {
    default: "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900",
    secondary: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
    outline: "border border-zinc-300 dark:border-zinc-700",
    destructive: "bg-red-500 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
