import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "emerald" | "outline" | "ghost" | "destructive" | "dark-brand" | "link";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-bold transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer text-xs",
          variant === "primary" && "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:brightness-105 shadow-sm",
          variant === "emerald" && "bg-gradient-to-r from-indigo-700 to-emerald-600 text-white hover:from-indigo-800 hover:to-emerald-700 hover:shadow-md shadow-sm border border-indigo-500/20",
          variant === "outline" && "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm",
          variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.01] hover:translate-y-0 active:scale-95",
          variant === "destructive" && "bg-rose-500 text-white hover:bg-rose-600 hover:shadow-md active:bg-rose-750 shadow-sm",
          variant === "dark-brand" && "bg-indigo-950 text-white hover:bg-indigo-900 hover:shadow-md border border-indigo-900 shadow-sm",
          variant === "link" && "text-indigo-600 underline hover:text-indigo-700 bg-transparent p-0 h-auto hover:scale-100 hover:translate-y-0 active:scale-100",
          size === "sm" && "h-8 px-3 text-[11px]",
          size === "md" && "h-9.5 px-4",
          size === "lg" && "h-11 px-6 text-sm",
          size === "icon" && "h-8 w-8 p-0",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
