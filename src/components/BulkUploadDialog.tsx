import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function BulkUploadDialog({ open, onOpenChange, onUploadSuccess, currentProfile }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const downloadTemplate = () => {
    try {
      const headers = ["Name", "Class", "Age", "Gender", "Parent Email", "Balance Due"];
      const data = [
        ["David Macaulay", "SS 2 Science", "16", "Male", "david.macaulay@parent.com", "0"],
        ["Esther Nwosu", "SS 2 Commerce", "15", "Female", "esther.nwosu@parent.com", "15000"],
        ["Chinedu Obi", "SS 1 Art", "16", "Male", "chinedu.obi@parent.com", "0"]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students Template");
      
      XLSX.writeFile(wb, "Corner_Streams_Bulk_Students_Template.xlsx");
      toast.success("Spreadsheet template downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate download template.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const processFile = (selectedFile: File) => {
    const isExcel = selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls") || selectedFile.name.endsWith(".csv");
    if (!isExcel) {
      toast.error("Please provide a valid Excel (.xlsx, .xls) or CSV file.");
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const parsedRows: any[] = XLSX.utils.sheet_to_json(sheet);
        
        // Clean and normalize keys
        const normalized = parsedRows.map((r: any, idx: number) => {
          const name = r.Name || r["Full Name"] || r.name || `Student #${idx + 1}`;
          const className = r.Class || r["Class Name"] || r.class_name || r.Classname || "SS 2 Science";
          const age = Number(r.Age || r.age || 16);
          const gender = r.Gender || r.gender || "Male";
          const parent_email = r["Parent Email"] || r.Parent_Email || r.parent_email || "parent@example.com";
          const balance_due = Number(r["Balance Due"] || r.balance_due || 0);

          return {
            id: `st-bulk-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            name,
            class_name: className,
            age,
            gender,
            parent_email,
            balance_due,
            login_email: `${name.split(" ").join(".").toLowerCase()}@cornerstreams.edu.ng`,
            term_average: 60
          };
        });

        setPreviewData(normalized);
        toast.success(`Successfully read ${normalized.length} students from sheet!`);
      } catch (err) {
        console.error(err);
        toast.error("Error reading file structure. Ensure it is correct spreadsheet format.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleUploadConfirm = async () => {
    if (previewData.length === 0) return;
    setLoading(true);

    try {
      const currentList = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
      const nextList = [...currentList, ...previewData];
      localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(nextList));

      if (onUploadSuccess) {
        onUploadSuccess(previewData);
      }
      toast.success(`Successfully onboarded ${previewData.length} students to enrollment registry!`);
      handleClose();
    } catch (err) {
      toast.error("Upload process encountered error.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Bulk Student Onboarding Roster</DialogTitle>
          <p className="text-xs text-slate-500">
            Upload an Excel (.xlsx, .xls) spreadsheet to automatically register multiple students, generate individual portal credentials, and map parent email alerts in seconds.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Download Excel Template</span>
            </button>
          </div>
        </DialogHeader>

        {previewData.length === 0 ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); }}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${
              dragOver ? "border-indigo-600 bg-indigo-50/50" : "border-slate-300 hover:border-indigo-400 bg-slate-50"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold cs-text-navy block">Drag and drop spreadsheet, or browse file</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Expected columns: Name, Class, Age, Gender, Parent Email, Balance Due</span>
            </div>
            <input type="file" onChange={handleFileChange} className="hidden" accept=".xlsx,.xls,.csv" id="bulk-file-btn" />
            <Button variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-0" onClick={() => document.getElementById("bulk-file-btn")?.click()}>
              Browse File...
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-700" />
                <div className="text-[11px] font-bold text-indigo-950">
                  {file?.name} <span className="text-slate-400 text-[10px] font-medium">({previewData.length} records parsed)</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { setFile(null); setPreviewData([]); }}>
                Clear File
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 font-bold text-slate-500">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Class</th>
                    <th className="p-2">Parent Email</th>
                    <th className="p-2">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {previewData.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-bold cs-text-navy">{row.name}</td>
                      <td className="p-2 font-mono">{row.class_name}</td>
                      <td className="p-2">{row.parent_email}</td>
                      <td className="p-2 font-mono cs-text-green">₦{row.balance_due.toLocaleString()}</td>
                    </tr>
                  ))}
                  {previewData.length > 10 && (
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="p-2 text-center text-[10px] text-slate-400 uppercase font-black tracking-wider">
                        And {previewData.length - 10} other student records...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="emerald"
            size="sm"
            disabled={previewData.length === 0 || loading}
            onClick={handleUploadConfirm}
          >
            {loading ? "Onboarding..." : `Confirm & Save ${previewData.length} Students`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default BulkUploadDialog;
