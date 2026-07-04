import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, RefreshCw, User, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export function StudentProfileDialog({ open, onOpenChange, student, onSave, classes }: any) {
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [balance, setBalance] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name || student.fullName || "");
      setClassName(student.class_name || student.classCohort || "");
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
        parent_email: parentEmail,
        balance_due: Number(balance),
        photoUrl
      });
      toast.success("Student file successfully updated in Corner Streams secure registry!");
      onOpenChange(false);
      setSubmitting(false);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 cs-text-navy">
            <User className="w-5 h-5" />
            <DialogTitle>Update Student Profile Folder</DialogTitle>
          </div>
          <p className="text-xs text-slate-500">
            Edit full records, adjust financial billing balances, or update biometric photo passport tags.
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
              <div className="space-y-1">
                <Label>Class / Cohort</Label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-350 bg-white px-3 text-xs focus-visible:outline-none"
                >
                  <option value="">Select class...</option>
                  {classes?.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  )) || [
                    <option key="1" value="SS 2 Science">SS 2 Science</option>,
                    <option key="2" value="SS 3 Art">SS 3 Art</option>
                  ]}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Ledger Balance Due (₦)</Label>
                <Input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} />
              </div>
            </div>

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
