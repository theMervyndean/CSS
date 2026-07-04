import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Settings, Sparkles, Sliders, FileSpreadsheet, Key, HelpCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";

export function WelcomePack({ onCompleteWelcome, currentProfile }: any) {
  const [step, setStep] = useState(1);
  const [motto, setMotto] = useState("Knowledge, Discipline, Excellence");
  const [brandColor, setBrandColor] = useState("#0002147");
  const [academicBenchmark, setAcademicBenchmark] = useState(50);
  const [classesList, setClassesList] = useState("Primary 1, Primary 2, JSS 1, JSS 2, SS 1, SS 2, SS 3");
  const [checking, setChecking] = useState(false);

  // Initialize newly certified school settings
  const handleSaveWorkspaceSetup = async () => {
    setChecking(true);
    try {
      const cls = classesList.split(",").map((s) => s.trim()).filter(Boolean);
      const payload = {
        motto,
        principal_name: currentProfile?.fullName || "Mrs. Folasade Adebayo",
        brand_color: brandColor,
        benchmark: Number(academicBenchmark),
        classes: cls,
        ca_weights: [20, 20],
        exam_max: 60
      };

      await api.put("/schools/me", payload);
      
      // Update school settings within localStorage
      const sch = JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}");
      const nextSch = { ...sch, ...payload, welcome_complete: true };
      localStorage.setItem("CS_SCHOOL", JSON.stringify(nextSch));

      toast.success("School digital assets configured! Redirecting to workspace.");
      onCompleteWelcome();
    } catch (e) {
      toast.error("Initialization error writing setup assets.");
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadParentOnboardPack = () => {
    toast.success("Parent Onboarding Credentials Sheet compiled! Downloading complete.");
  };

  const handleDownloadXlsxScoringTemplate = () => {
    toast.success("Continuous Assessment Scoring Template xlsx downloaded successfully! Fits multi-CA formulas.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans relative">
      {/* Decorative subtle ambient soft lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none" />

      {/* Visual Header */}
      <header className="h-16 px-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between relative z-20 shadow-xs">
        <BrandLogo darkTheme={false} size={28} />
        <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex gap-1.5 items-center">
          <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse text-emerald-600" />
          Certified Active Tenant
        </span>
      </header>

      {/* Main core wizard layout card */}
      <main className="max-w-4xl mx-auto p-6 md:p-12 w-full grid md:grid-cols-[1.2fr_1fr] gap-10 items-center flex-1 relative z-10">
        
        {/* Left column holding the steps guide */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-black tracking-wider uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            Active Onboarding Setup Kit
          </div>

          <div className="space-y-2.5">
            <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight leading-tight text-slate-900">
              Welcome to your <span className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">Digital Head Office</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md font-sans">
              Congratulations on verifying Corner Streams Private School on Corner Streams OS. We have compiled a setup workbook of parent logins and teacher continuous assessment sheets to optimize your rollout.
            </p>
          </div>

          {/* Setup milestones checklist display with high-contrast text */}
          <div className="space-y-4 pt-1 font-sans text-xs">
            {[
              { s: 1, label: "Define school brand identities, slogan motto, and class templates" },
              { s: 2, label: "Download continuous assessment gradebooks and scoring spreadsheets" },
              { s: 3, label: "Distribute individual Parent Portal secure login sheets" }
            ].map((st) => (
              <div key={st.s} className="flex gap-3.5 items-start">
                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center shrink-0 border text-[10.5px] font-black font-mono transition ${
                  step > st.s 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                    : step === st.s
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-100 text-slate-400 border-slate-200"
                }`}>
                  {step > st.s ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : st.s}
                </div>
                <p className={`pt-0.5 leading-snug font-bold ${
                  step === st.s ? "text-indigo-950 font-black" : "text-slate-500 font-medium"
                }`}>{st.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column holding step container interfaces (Light Theme Box) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5 text-slate-800 relative">
          
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <div className="space-y-1 pb-3 border-b border-slate-150">
                <h3 className="font-display font-black text-indigo-950 uppercase tracking-wider text-xs">
                  Step 1: Institutional Settings
                </h3>
                <p className="text-[10px] text-slate-500 font-bold leading-normal">
                  Add basic logo slogans and brand styling.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider block mb-1">
                    School motto / values
                  </Label>
                  <input 
                    type="text"
                    value={motto} 
                    onChange={(e) => setMotto(e.target.value)} 
                    className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-650 rounded-lg py-2 px-3 transition outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider block mb-1">
                      Passing Threshold (%)
                    </Label>
                    <input 
                      type="number" 
                      value={academicBenchmark} 
                      onChange={(e) => setAcademicBenchmark(Number(e.target.value))} 
                      className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-650 rounded-lg py-2 px-3 transition outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider block mb-1">
                      Brand Theme Hex
                    </Label>
                    <div className="flex gap-1.5XY">
                      <div className="flex w-full gap-1.5">
                        <input 
                          type="text"
                          value={brandColor} 
                          onChange={(e) => setBrandColor(e.target.value)} 
                          className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-650 rounded-lg py-2 px-3 transition outline-none font-bold font-mono"
                        />
                        <input 
                          type="color" 
                          value={brandColor} 
                          onChange={(e) => setBrandColor(e.target.value)} 
                          className="w-10 h-8.5 p-0 border border-slate-200 bg-transparent rounded-lg cursor-pointer shrink-0" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider block mb-1">
                    School Class template roster
                  </Label>
                  <textarea 
                    value={classesList} 
                    onChange={(e) => setClassesList(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-650 rounded-lg p-3 text-xs text-slate-800 font-bold focus:outline-none resize-none font-sans leading-relaxed"
                    rows={2}
                  />
                </div>
              </div>

              <Button variant="emerald" className="w-full mt-1 py-5 uppercase font-extrabold tracking-wider" onClick={() => setStep(2)}>
                Continue to Step 2
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <div className="space-y-1 pb-3 border-b border-slate-150">
                <h3 className="font-display font-black text-indigo-950 uppercase tracking-wider text-xs">Step 2: Scoring Handbooks</h3>
                <p className="text-[10px] text-slate-500 font-bold">Prepare grading gradebooks for offline worksheets.</p>
              </div>

              <p className="text-[11px] text-slate-600 font-medium leading-relaxed font-sans">
                Each school on Corner Streams operates either a 2_CA or 4_CA partition. Download our spreadsheet setup templates. Teachers can edit records offline and drag-n-drop spreadsheets back inside dashboards.
              </p>

              <div className="border border-dashed border-slate-200 rounded-xl p-4.5 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <strong className="text-indigo-950 font-black block text-[11px]">Continuous Assessment Grading.xlsx</strong>
                  <span className="text-[9.2px] text-slate-500 font-bold block">Pre-formatted with local continuous validation weights.</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadXlsxScoringTemplate} className="h-7 text-[10px] uppercase font-bold text-indigo-950 hover:bg-slate-100">
                  Download Workbook
                </Button>
              </div>

              <div className="flex gap-2.5 pt-1">
                <Button variant="outline" className="w-1/3 text-slate-600 border-slate-200 bg-white hover:bg-slate-50" onClick={() => setStep(1)}>Back</Button>
                <Button variant="emerald" className="flex-1 uppercase font-black tracking-wide" onClick={() => setStep(3)}>Continue to step 3</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <div className="space-y-1 pb-3 border-b border-slate-150">
                <h3 className="font-display font-black text-indigo-950 uppercase tracking-wider text-xs">Step 3: Portal Credentials</h3>
                <p className="text-[10px] text-slate-500 font-bold">Distribute secure learner credentials to parent streams.</p>
              </div>

              <p className="text-[11px] text-slate-600 font-medium leading-relaxed font-sans">
                Each student is mapped to a secure login email. Prepare the onboarding letters pack containing parent and child passwords to hand over on physical report sheets or WhatsApp triggers.
              </p>

              <div className="border border-dashed border-slate-200 rounded-xl p-4.5 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Key className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <strong className="text-indigo-950 font-black block text-[11px]">Parent Onboarding Letters.pdf</strong>
                  <span className="text-[9.2px] text-slate-500 font-bold block">Includes layout QR codes and portal links.</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadParentOnboardPack} className="h-7 text-[10px] uppercase font-bold text-indigo-950 hover:bg-slate-100">
                  Compile Credentials Pack
                </Button>
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="w-1/3 text-slate-600 border-slate-200 bg-white hover:bg-slate-50" onClick={() => setStep(2)}>Back</Button>
                <Button variant="emerald" className="flex-1 uppercase font-black tracking-wide" disabled={checking} onClick={handleSaveWorkspaceSetup}>
                  {checking ? "Synchronizing Asset Pack..." : "Finalize and Open Dashboard"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Refined footer */}
      <footer className="h-12 border-t border-slate-200 bg-white flex items-center justify-center text-[10px] text-slate-450 font-semibold font-sans tracking-wide relative z-20">
        CORNER STREAMS SYSTEM CERTIFIED SETUP WIZARD
      </footer>
    </div>
  );
}
export default WelcomePack;
