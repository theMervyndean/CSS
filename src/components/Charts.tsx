import React from "react";

export function ChartCard({ children, title, subtitle, testid }: any) {
  return (
    <div className="cs-card p-5 flex flex-col justify-between" data-testid={testid}>
      <div>
        <div className="font-display font-semibold cs-text-navy text-sm">{title}</div>
        {subtitle && <div className="text-[10px] text-slate-500 uppercase mt-0.5">{subtitle}</div>}
      </div>
      <div className="mt-4 flex-1 h-36 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function BarSimple({ data, xKey, yKey, color = "#0056B3" }: any) {
  const max = Math.max(...data.map((d: any) => d[yKey] || 0), 1);
  return (
    <div className="flex h-full w-full items-end gap-3 justify-center pb-2">
      {data.map((d: any, idx: number) => {
        const pct = ((d[yKey] || 0) / max) * 100;
        return (
          <div key={idx} className="flex flex-col items-center flex-1 max-w-[40px] group relative">
            {/* Tooltip */}
            <div className="absolute -top-8 px-2 py-0.5 bg-indigo-950 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {d[yKey]}
            </div>
            <div 
              style={{ height: `${Math.max(pct, 5)}%`, backgroundColor: color }} 
              className="w-full rounded-t-sm transition-all duration-300"
            />
            <span className="text-[9px] text-slate-400 mt-1 truncate max-w-full font-mono">{d[xKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ data, dataKey = "count", nameKey = "name" }: any) {
  const total = data.reduce((acc: number, curr: any) => acc + (curr[dataKey] || 0), 0);
  let accumulatedAngle = 0;

  return (
    <div className="flex items-center gap-4 w-full h-full justify-center">
      <svg className="w-24 h-24 transform -rotate-90 shrink-0" viewBox="0 0 100 105">
        <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
        {data.map((d: any, idx: number) => {
          const val = d[dataKey] || 0;
          if (val === 0) return null;
          const percentage = val / (total || 1);
          const strokeLength = percentage * 2 * Math.PI * 35;
          const strokeOffset = accumulatedAngle * 2 * Math.PI * 35;
          accumulatedAngle += percentage;
          
          const colors = ["#002147", "#005cb9", "#12a13b", "#ec4899", "#8b5cf6"];
          const col = colors[idx % colors.length];

          return (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke={col}
              strokeWidth="12"
              strokeDasharray={`${strokeLength} 220`}
              strokeDashoffset={-strokeOffset}
              className="transition-all duration-500"
            />
          );
        })}
        <circle cx="50" cy="50" r="24" fill="white" />
      </svg>
      <div className="flex flex-col gap-1 max-w-[120px] justify-center">
        {data.map((d: any, idx: number) => {
          const colors = ["#002147", "#005cb9", "#12a13b", "#ec4899", "#8b5cf6"];
          return (
            <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-600 font-medium">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
              <span className="truncate max-w-[80px]" title={d[nameKey]}>{d[nameKey]}</span>
              <span className="font-bold cs-text-navy shrink-0">{d[dataKey]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GrowthArea({ data, xKey = "month", yKey = "attempts", color = "#28A745" }: any) {
  const max = Math.max(...data.map((d: any) => d[yKey] || 0), 1);
  return (
    <div className="w-full h-full flex flex-col justify-end">
      <div className="flex-1 flex items-end gap-1 px-2 border-b border-slate-100">
        {data.map((d: any, idx: number) => {
          const pct = ((d[yKey] || 0) / max) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div className="absolute -top-7 px-1.5 py-0.5 bg-indigo-950 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {d[yKey]}
              </div>
              <div 
                style={{ height: `${Math.max(pct, 8)}%` }} 
                className="w-full bg-gradient-to-t from-emerald-50 to-emerald-400 rounded-t-sm hover:from-emerald-100 hover:to-emerald-500 transition-colors"
              />
              <span className="text-[8px] text-slate-400 mt-1 font-mono font-bold">{d[xKey]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LineSeries({ data, xKey = "term", yKey = "average", color = "#28A745" }: any) {
  const max = Math.max(...data.map((d: any) => d[yKey] || 0), 1);
  return (
    <div className="w-full h-full flex items-end gap-4 justify-around pb-2">
      {data.map((d: any, idx: number) => {
        const pct = ((d[yKey] || 0) / max) * 100;
        return (
          <div key={idx} className="flex flex-col items-center group relative">
            <span className="text-[10px] font-bold cs-text-navy mb-1">{d[yKey]}%</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white scroll-shadow" />
            <span className="text-[9px] text-slate-400 mt-1 font-semibold">{d[xKey]}</span>
          </div>
        );
      })}
    </div>
  );
}
export default ChartCard;
