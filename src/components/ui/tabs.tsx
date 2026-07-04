import React, { createContext, useContext } from "react";
import { cn } from "../../lib/utils";

const TabsContext = createContext<any>(null);

export function Tabs({ children, value, onValueChange, className }: any) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: any) {
  return (
    <div className={cn("inline-flex items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ children, value, className, ...props }: any) {
  const { value: activeValue, onValueChange } = useContext(TabsContext);
  const isActive = activeValue === value;
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ring-offset-white transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
        isActive ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className }: any) {
  const { value: activeValue } = useContext(TabsContext);
  if (activeValue !== value) return null;
  return (
    <div className={cn("mt-2 ring-offset-white focus-visible:outline-none", className)}>
      {children}
    </div>
  );
}
