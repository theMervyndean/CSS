import React from "react";
import { cn } from "../lib/utils";

/**
 * High-fidelity custom Button component that implements the compact, solid, high-density style
 * matching our deep navy and emerald green layout guidelines.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "emerald" | "outline" | "ghost" | "danger" | "dark-brand";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-bold transition-all duration-150 active:scale-[0.98] outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer",
          // Variants
          variant === "primary" && "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/10",
          variant === "emerald" && "bg-gradient-to-r from-indigo-700 to-emerald-600 text-white hover:from-indigo-800 hover:to-emerald-700 shadow-sm border border-indigo-500/20",
          variant === "outline" && "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
          variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          variant === "danger" && "bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/10",
          variant === "dark-brand" && "bg-indigo-950 text-white hover:bg-indigo-900 border border-indigo-900",
          // Sizes
          size === "sm" && "h-8 px-3.5 text-xs font-semibold",
          size === "md" && "h-9.5 px-4.5 text-xs font-bold",
          size === "lg" && "h-11 px-6 text-sm font-black",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
