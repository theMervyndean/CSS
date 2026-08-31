import React from "react";

export interface SchoolInfoData {
  name?: string;
  motto?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
}

export interface PrintOnlySchoolHeaderProps {
  schoolInfo?: SchoolInfoData;
  session?: string;
  term?: string;
  documentTitle?: string;
  className?: string;
}

export const PrintOnlySchoolHeader: React.FC<PrintOnlySchoolHeaderProps> = ({
  schoolInfo,
  session = "2025/2026",
  term = "1st Term",
  documentTitle = "Terminal Report Card",
  className = ""
}) => {
  // Pull live schoolState from localStorage if not provided or to fallback dynamically
  const liveSchoolState = React.useMemo(() => {
    try {
      const saved = localStorage.getItem("CS_SCHOOL");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const name = schoolInfo?.name || liveSchoolState?.name || "Corner Streams Private School";
  const motto = schoolInfo?.motto || liveSchoolState?.motto || "Excellence & Honor in Character and Service";
  const logoUrl = schoolInfo?.logo_url !== undefined ? schoolInfo.logo_url : liveSchoolState?.logo_url;
  const address = schoolInfo?.address || liveSchoolState?.address || "12 Corner Streams Boulevard, Victoria Island, Lagos";
  const phone = schoolInfo?.phone || liveSchoolState?.phone || "+234 814 188 0550";
  const email = schoolInfo?.email || liveSchoolState?.email || "bursar@cornerstreams.edu.ng";
  const website = schoolInfo?.website || liveSchoolState?.website || "www.cornerstreams.edu.ng";

  return (
    <header className={`print-only-school-header print-school-header relative z-10 border-b-2 border-indigo-950 pb-3 mb-4 flex justify-between items-start gap-4 w-full text-slate-900 ${className}`}>
      {/* BRAND & LOGO SECTION */}
      <div className="print-school-header-brand flex items-center gap-3.5">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} Logo`}
            className="print-school-logo-img max-h-16 w-auto object-contain shrink-0"
          />
        ) : (
          <div className="print-school-logo-badge w-14 h-14 bg-indigo-950 text-emerald-400 rounded-xl flex items-center justify-center font-black text-xl shadow-md border-2 border-emerald-500 shrink-0 font-mono tracking-tighter">
            CS
          </div>
        )}

        <div>
          <span className="print-school-subtitle text-[9px] font-mono font-black uppercase tracking-widest text-emerald-600 block leading-tight">
            Corner Streams Educational Network
          </span>
          <h1 className="print-school-title text-lg sm:text-xl font-display font-black text-slate-950 uppercase tracking-tight leading-none mt-0.5">
            {name}
          </h1>
          <p className="print-school-motto text-[10px] italic text-slate-700 font-medium mt-0.5">
            Motto: &quot;{motto}&quot;
          </p>
          <div className="print-school-meta text-[9px] text-slate-600 font-mono flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
            <span>📍 {address}</span>
            {phone && <span>• 📞 {phone}</span>}
            {email && <span>• ✉️ {email}</span>}
            {website && <span>• 🌐 {website}</span>}
          </div>
        </div>
      </div>

      {/* DOCUMENT SEAL & SESSION BADGE */}
      <div className="print-school-seal-badge text-right shrink-0">
        <span className="badge-title inline-block px-3 py-1 bg-indigo-950 text-white font-mono font-black text-[10px] uppercase rounded-lg shadow-xs tracking-wider">
          {documentTitle}
        </span>
        <div className="badge-meta text-[9px] font-mono text-slate-600 mt-1 space-y-0.5">
          <p>
            Session: <strong className="text-slate-900 font-bold">{session}</strong>
          </p>
          <p>
            Term: <strong className="text-slate-900 font-bold">{term}</strong>
          </p>
        </div>
      </div>
    </header>
  );
};

export default PrintOnlySchoolHeader;
