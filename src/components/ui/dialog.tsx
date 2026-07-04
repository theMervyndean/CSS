import React from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

export function Dialog({ children, open, onOpenChange }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1px]"
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      {/* Modal Container */}
      <div className="relative z-50 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {children}
        <button
          type="button"
          onClick={() => onOpenChange && onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-slate-400 select-none cursor-pointer"
        >
          <X className="h-4 w-4 text-slate-500" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}

export function DialogTrigger({ children, asChild }: any) {
  // Let Dialog handles open states, DialogTrigger can just render children.
  return <>{children}</>;
}

export function DialogContent({ children, className }: any) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

export function DialogHeader({ children, className }: any) {
  return <div className={cn("flex flex-col space-y-1.5 text-left", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: any) {
  return <h3 className={cn("text-base font-bold text-slate-900", className)}>{children}</h3>;
}

export function DialogDescription({ children, className }: any) {
  return <p className={cn("text-xs text-slate-500", className)}>{children}</p>;
}

export function DialogFooter({ children, className }: any) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}>{children}</div>;
}
