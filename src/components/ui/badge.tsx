import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
        variant === "default" && "border-transparent bg-indigo-950 text-white shadow",
        variant === "secondary" && "border-transparent bg-slate-100 text-slate-900",
        variant === "outline" && "text-slate-500 border-slate-300",
        variant === "destructive" && "border-transparent bg-rose-500 text-white shadow",
        className
      )}
      {...props}
    />
  );
}
