import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, RefreshCw, User, ShieldAlert, ChevronDown, Check, GraduationCap, ArrowRightLeft, UserCheck, AlertTriangle, Archive } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function StudentProfileDialog({ open, onOpenChange, student, onSave, classes }: any) {
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [parentEmail, setParentEmail] = useState("");
  const [balance, setBalance] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const statusOptions = [
    { value: "active", label: "Active / Enrolled", icon: UserCheck, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { value: "graduated", label: "Graduated / Alumni", icon: GraduationCap, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    { value: "transferred", label: "Transferred / Relocated", icon: ArrowRightLeft, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { value: "suspended", label: "Suspended / Inactive", icon: AlertTriangle, color: "text-rose-700 bg-rose-50 border-rose-200" },
    { value: "withdrawn", label: "Withdrawn / Discharged", icon: Archive, color: "text-slate-700 bg-slate-100 border-slate-300" }
  ];

  useEffect(() => {
    if (student) {
      setName(student.name || student.fullName || "");
      setClassName(student.class_name || student.classCohort || "");
      setStatus(student.status || "active");
      setParentEmail(student.parent_email || student.parentEmail || "");
      setBalance(student.balance_due || student.balanceDue || 0);
      setPhotoUrl(student.photoUrl || student.photo_url || student.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150");
    }
  }, [student, open]);

  const handleUpdatePassport = () => {
    const randomPassports = [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150&h=150"
    ];
    const pick = randomPassports[Math.floor(Math.random() * randomPassports.length)];
    setPhotoUrl(pick);
    toast.info("Biometric passport photo simulated/mock updated!");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      onSave({
        id: student.id,
        name,
        class_name: className,
        status,
        parent_email: parentEmail,
        balance_due: Number(balance),
        photoUrl
      });
      toast.success("Student file successfully updated in Corner Streams secure registry!");
      onOpenChange(false);
      setSubmitting(false);
    }, 400);
  };

  const availableClasses = classes && classes.length > 0 ? classes : ["Primary 5", "JSS 1 Green", "JSS 2 Blue", "SS 1 Gold", "SS 2 Science", "SS 3 Art"];
  const currentStatusObj = statusOptions.find(s => s.value === status) || statusOptions[0];
  const CurrentStatusIcon = currentStatusObj.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 cs-text-navy">
            <User className="w-5 h-5 text-indigo-600" />
            <DialogTitle>Update Student Profile Folder</DialogTitle>
          </div>
          <p className="text-xs text-slate-500">
            Edit full records, adjust financial billing balances, status lifecycle, or update biometric photo passport tags.
          </p>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* Biometric Passport Section */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 border border-slate-200 rounded-lg">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-slate-300 shadow-sm shrink-0 bg-white group">
              <img src={photoUrl} alt="Passport Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleUpdatePassport}
                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Passport Biometric Signature</span>
              <Button type="button" size="sm" variant="outline" onClick={handleUpdatePassport} className="gap-1.5 h-8">
                <RefreshCw className="w-3 h-3 text-slate-500" />
                Upload New Photo
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Full Student Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Custom Class Select */}
              <div className="space-y-1 relative">
                <Label>Class / Cohort</Label>
                <button
                  type="button"
                  onClick={() => { setIsClassOpen(!isClassOpen); setIsStatusOpen(false); }}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs flex items-center justify-between font-medium text-slate-800 hover:border-indigo-500 transition-colors text-left"
                >
                  <span className="truncate">{className || "Select class..."}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                </button>
                {isClassOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsClassOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100 animate-in fade-in duration-100">
                      {availableClasses.map((c: string) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setClassName(c); setIsClassOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between hover:bg-emerald-600 hover:text-white ${className === c ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-700"}`}
                        >
                          <span>{c}</span>
                          {className === c && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Custom Status Select */}
              <div className="space-y-1 relative">
                <Label>Enrollment Status</Label>
                <button
                  type="button"
                  onClick={() => { setIsStatusOpen(!isStatusOpen); setIsClassOpen(false); }}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs flex items-center justify-between font-medium text-slate-800 hover:border-indigo-500 transition-colors text-left"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <CurrentStatusIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{currentStatusObj.label}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                </button>
                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100 animate-in fade-in duration-100">
                      {statusOptions.map((st) => {
                        const Icon = st.icon;
                        const isSelected = status === st.value;
                        return (
                          <button
                            key={st.value}
                            type="button"
                            onClick={() => { setStatus(st.value); setIsStatusOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between hover:bg-emerald-600 hover:text-white ${isSelected ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-700"}`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{st.label}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Ledger Balance Due (₦)</Label>
              <Input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} />
            </div>

            {/* Dynamic Subjects Taken List */}
            {className && (
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-slate-500">
                  <span>Registered Curriculum</span>
                  <Badge className="bg-emerald-500 text-slate-950 font-black border-0 px-1.5 text-[9px]">
                    {(() => {
                      const allSubjects = JSON.parse(localStorage.getItem("CS_SUBJECTS") || "[]");
                      const matched = allSubjects.find((s: any) => s.class_name === className);
                      return matched ? matched.subjects.length : 2;
                    })()} Subjects Taken
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(() => {
                    const allSubjects = JSON.parse(localStorage.getItem("CS_SUBJECTS") || "[]");
                    const matched = allSubjects.find((s: any) => s.class_name === className);
                    const list = matched ? matched.subjects : ["English Language", "Mathematics"];
                    return list.map((sub: string) => (
                      <span key={sub} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 text-[10px] font-medium font-mono">
                        {sub}
                      </span>
                    ));
                  })()}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label>Registered Parent Email </Label>
              <Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required />
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-2 bg-indigo-50 rounded-lg text-[10px] text-indigo-700 font-semibold border border-indigo-100">
            <ShieldAlert className="w-4 h-4 text-indigo-500 shrink-0" />
            Any changes made here instantly synchronize across CBT results blockade and parent payment reports.
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="emerald" size="sm" disabled={submitting}>
              {submitting ? "Saving changes..." : "Save Record Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default StudentProfileDialog;
