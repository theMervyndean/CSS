import React, { createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils";

const SelectContext = createContext<any>(null);

export function Select({ children, value, onValueChange }: any) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className, ...props }: any) {
  const { isOpen, setIsOpen } = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex h-9.5 w-full items-center justify-between rounded-md border border-slate-350 bg-white px-3 py-2 text-xs shadow-sm ring-offset-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-800 font-medium cursor-pointer text-left",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: any) {
  const { value } = useContext(SelectContext);
  return <span className="truncate">{value || placeholder}</span>;
}

export function SelectContent({ children, className }: any) {
  const { isOpen, setIsOpen } = useContext(SelectContext);
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      <div
        className={cn(
          "absolute left-0 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 text-slate-800 shadow-lg z-50",
          className
        )}
      >
        {children}
      </div>
    </>
  );
}

export function SelectItem({ children, value, className }: any) {
  const { value: activeValue, onValueChange, setIsOpen } = useContext(SelectContext);
  const isSelected = activeValue === value;
  return (
    <button
      type="button"
      onClick={() => {
        onValueChange(value);
        setIsOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-xs outline-none hover:bg-slate-100 transition text-left",
        isSelected && "bg-slate-100 font-bold text-indigo-950",
        className
      )}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}
