import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, ArrowRightLeft, UserCheck, AlertTriangle, Archive, 
  Check, Users, ShieldAlert, Sparkles, ChevronDown, Calendar, FileText, X
} from "lucide-react";
import { toast } from "sonner";

export interface BulkStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudents: any[];
  onConfirmStatusUpdate: (targetStatus: string, metadata: { session: string; term: string; note: string }) => void;
}

export function BulkStatusUpdateDialog({
  open,
  onOpenChange,
  selectedStudents,
  onConfirmStatusUpdate
}: BulkStatusUpdateDialogProps) {
  const [targetStatus, setTargetStatus] = useState<string>("graduated");
  const [academicSession, setAcademicSession] = useState<string>("2025/2026");
  const [academicTerm, setAcademicTerm] = useState<string>("3rd Term");
  const [adminNote, setAdminNote] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showStudentList, setShowStudentList] = useState<boolean>(false);

  const statusDefinitions = [
    {
      value: "graduated",
      label: "Graduated (Alumni)",
      icon: GraduationCap,
      description: "Marks completed academic cycle. Preserves complete academic transcripts and locks terminal dossiers into alumni archives.",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      activeBg: "border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20"
    },
    {
      value: "transferred",
      label: "Transferred Out",
      icon: ArrowRightLeft,
      description: "Student relocated or transferred to another institution/branch. Generates transfer transcript clearance record.",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      activeBg: "border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20"
    },
    {
      value: "active",
      label: "Active / Enrolled",
      icon: UserCheck,
      description: "Regular enrolled student. Full CBT engine access, terminal broadsheet ranking, and active attendance registers.",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      activeBg: "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
    },
    {
      value: "suspended",
      label: "Suspended (Inactive)",
      icon: AlertTriangle,
      description: "Temporary disciplinary or administrative hold. Temporarily freezes online portal authentication and exam taking.",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      activeBg: "border-rose-600 bg-rose-50/70 ring-2 ring-rose-500/20"
    },
    {
      value: "withdrawn",
      label: "Withdrawn / Discharged",
      icon: Archive,
      description: "Formal unenrollment or parent withdrawal request processed.",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
      activeBg: "border-slate-600 bg-slate-100 ring-2 ring-slate-400/20"
    }
  ];

  const currentDef = statusDefinitions.find(s => s.value === targetStatus) || statusDefinitions[0];

  const handleExecuteBulkUpdate = () => {
    if (selectedStudents.length === 0) {
      toast.error("No students selected for status update.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      onConfirmStatusUpdate(targetStatus, {
        session: academicSession,
        term: academicTerm,
        note: adminNote.trim() || `Bulk updated to ${currentDef.label}`
      });
      setIsProcessing(false);
      onOpenChange(false);
    }, 450);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* Header with gradient banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 p-5 text-white border-b border-indigo-800/60 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-display font-black text-white">
                  Bulk Student Status Transition
                </DialogTitle>
                <p className="text-[11px] text-slate-300 font-medium">
                  Enrollment &amp; Academic Registry Lifecycle Controller
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold px-2.5 py-1">
              {selectedStudents.length} {selectedStudents.length === 1 ? "Student" : "Students"} Selected
            </Badge>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Selected Students Preview Pill Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Target Cohort Candidates ({selectedStudents.length})
              </span>
              <button
                type="button"
                onClick={() => setShowStudentList(!showStudentList)}
                className="text-[10.5px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5"
              >
                <span>{showStudentList ? "Hide List" : "Review All Names"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showStudentList ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Quick badges preview */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {selectedStudents.slice(0, 8).map((st: any, idx: number) => (
                <span
                  key={st.id || idx}
                  className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[10.5px] text-slate-700 font-medium shadow-2xs"
                >
                  <span className="font-semibold">{st.name}</span>
                  <span className="text-[9.5px] text-slate-400 font-mono">({st.class_name || "N/A"})</span>
                </span>
              ))}
              {selectedStudents.length > 8 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  +{selectedStudents.length - 8} more candidates
                </span>
              )}
            </div>

            {/* Expanded Detailed Roster View */}
            {showStudentList && (
              <div className="mt-2 border-t border-slate-200 pt-2 max-h-44 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border">
                {selectedStudents.map((st: any, idx: number) => (
                  <div key={st.id || idx} className="p-2 flex items-center justify-between text-[11px] hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-bold text-slate-400">#{idx + 1}</span>
                      <span className="font-bold text-slate-800">{st.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">[{st.id || `CS-${8200 + idx}`}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {st.class_name || "General"}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        st.status === 'graduated' ? 'bg-indigo-50 text-indigo-700' :
                        st.status === 'transferred' ? 'bg-amber-50 text-amber-700' :
                        st.status === 'suspended' ? 'bg-rose-50 text-rose-700' :
                        st.status === 'withdrawn' ? 'bg-slate-100 text-slate-600' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        Current: {st.status || "active"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Select Target Status */}
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              Select New Enrollment Lifecycle Status
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {statusDefinitions.map((item) => {
                const Icon = item.icon;
                const isSelected = targetStatus === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTargetStatus(item.value)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? item.activeBg
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-white shadow-xs" : "bg-slate-100"}`}>
                          <Icon className="w-4 h-4 text-slate-700" />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">{item.label}</span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Effective Session and Term */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Effective Academic Session
              </Label>
              <Input
                value={academicSession}
                onChange={(e) => setAcademicSession(e.target.value)}
                placeholder="e.g. 2025/2026"
                className="h-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Effective Term
              </Label>
              <Input
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                placeholder="e.g. 3rd Term"
                className="h-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          </div>

          {/* Administrative Reason / Memo Note */}
          <div className="space-y-1">
            <Label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Administrative Notes &amp; Audit Reference (Optional)
            </Label>
            <Input
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={`e.g. ${targetStatus === 'graduated' ? 'Approved SS3 valedictory class cohort' : targetStatus === 'transferred' ? 'Transferred to Abuja Campus' : 'Administrative status update'}`}
              className="h-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Institutional Compliance Notice */}
          <div className="bg-indigo-50/70 border border-indigo-150 rounded-xl p-3 flex items-start gap-2 text-[10.5px] text-indigo-800">
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Registry Audit Synchronization</span>
              <p className="text-[10px] text-indigo-700/90 leading-tight">
                Updating {selectedStudents.length} student records to <strong className="font-bold text-indigo-900">{currentDef.label}</strong> will immediately update all student result portals, academic broadsheet calculations, and parent directory views.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex flex-row justify-end gap-2 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-xs font-bold"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="emerald"
            size="sm"
            onClick={handleExecuteBulkUpdate}
            disabled={isProcessing || selectedStudents.length === 0}
            className="h-9 px-5 text-xs font-bold bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-sm hover:opacity-95 cursor-pointer"
          >
            {isProcessing ? (
              <span>Updating Records...</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                Confirm Status for {selectedStudents.length} {selectedStudents.length === 1 ? "Student" : "Students"}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default BulkStatusUpdateDialog;
