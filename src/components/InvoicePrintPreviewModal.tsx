import React, { useState } from "react";
import {
  Printer,
  X,
  CreditCard,
  CheckCircle2,
  Download,
  Building,
  ShieldAlert,
  Award,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { BillingRecord, UserProfile } from "../types";
import { PrintOnlySchoolHeader } from "./PrintOnlySchoolHeader";

export interface InvoicePrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingRecord?: BillingRecord | null;
  currentProfile?: UserProfile;
}

export function InvoicePrintPreviewModal({
  isOpen,
  onClose,
  billingRecord,
  currentProfile
}: InvoicePrintPreviewModalProps) {
  const [isFitToPage, setIsFitToPage] = useState<boolean>(true);

  if (!isOpen || !billingRecord) return null;

  const handleTriggerPrint = () => {
    toast.info("Initiating high-resolution print stream...", {
      description: "Applying paperless document layout standards."
    });
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const outstandingBalance = Math.max(0, billingRecord.totalAmount - billingRecord.amountPaid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* MODAL CONTROL HEADER (HIDDEN DURING PHYSICAL PRINTING) */}
        <div className="no-print p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                Invoice &amp; Receipt Print Preview
              </h2>
              <p className="text-[11px] text-slate-400">
                Official Bursary Transcript &bull; Ref: <span className="font-mono font-bold text-emerald-400">{billingRecord.invoiceNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* FIT-TO-PAGE TOGGLE */}
            <button
              type="button"
              onClick={() => {
                const nextState = !isFitToPage;
                setIsFitToPage(nextState);
                toast.info(
                  nextState
                    ? "Fit-to-Page Enabled: Single A4 layout locked to prevent wrapping onto page 2."
                    : "Fit-to-Page Disabled: Expanded document height restored."
                );
              }}
              className={`h-8 px-3 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition cursor-pointer shadow-2xs ${
                isFitToPage
                  ? "bg-indigo-950 text-emerald-400 border-emerald-500/60 shadow-xs"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
              title="Toggle single-page A4 print layout rules"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isFitToPage ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
              <span>{isFitToPage ? "A4 Single-Page Fit" : "Expanded View"}</span>
            </button>

            {/* PRINT BUTTON */}
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice Document</span>
            </button>

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
              title="Close Print Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT CONTAINER VIEWPORT */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 bg-slate-950/50 space-y-6">
          <div
            className={`report-card-page bg-white text-slate-900 rounded-2xl border border-slate-300 shadow-md relative overflow-hidden font-sans transition-all mx-auto ${
              isFitToPage ? "fit-to-page-a4 p-5 max-w-3xl" : "p-8 space-y-5 max-w-3xl"
            }`}
          >
            {/* WATERMARK BACKGROUND EMBLEM */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.03]">
              <div className="text-center">
                <Building className="w-72 h-72 text-indigo-950" />
                <span className="text-3xl font-black font-mono uppercase tracking-widest block mt-2 text-indigo-950">
                  CORNER STREAMS BURSARY
                </span>
              </div>
            </div>

            {/* OFFICIAL SCHOOL HEADER */}
            <PrintOnlySchoolHeader
              session={billingRecord.session || "2025/2026"}
              term={billingRecord.term || "3rd Term"}
              documentTitle="Official Cashier Invoice & Receipt"
            />

            {/* PAYER & STUDENT PROFILE SUMMARY */}
            <div className="relative z-10 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs my-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[9px] font-mono font-black uppercase text-indigo-950 tracking-wider">
                  Beneficiary &amp; Payer Account Metadata
                </span>
                <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border uppercase ${
                  billingRecord.status === "PAID"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : billingRecord.status === "PARTIALLY_PAID"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-rose-100 text-rose-800 border-rose-300"
                }`}>
                  Status: {billingRecord.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div>
                  <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Student Full Name</span>
                  <strong className="text-slate-900 font-extrabold truncate block">{billingRecord.studentName}</strong>
                </div>
                <div>
                  <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Invoice / Reg Ref</span>
                  <strong className="text-indigo-900 font-mono">{billingRecord.invoiceNumber}</strong>
                </div>
                <div>
                  <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Academic Term</span>
                  <strong className="text-slate-800 font-mono">{billingRecord.term} ({billingRecord.session})</strong>
                </div>
                <div>
                  <span className="text-[7.5px] font-mono uppercase text-slate-400 font-bold block">Issuer Dept</span>
                  <strong className="text-emerald-800 font-mono">Bursary Services</strong>
                </div>
              </div>
            </div>

            {/* ITEMIZED LEDGER CHARGES TABLE */}
            <div className="relative z-10 mb-4">
              <h3 className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Itemized Institutional Ledger Breakdown
              </h3>
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-slate-900 text-white text-[9px] uppercase font-bold">
                    <th className="p-2 border border-slate-800">Fee Description / Service Item</th>
                    <th className="p-2 border border-slate-800 text-center w-28">Category</th>
                    <th className="p-2 border border-slate-800 text-right w-32">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="p-2 border border-slate-200 font-bold text-slate-900">Tuition &amp; Instructional Delivery Fee</td>
                    <td className="p-2 border border-slate-200 text-center text-slate-600 text-[10px]">Academic</td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">₦{billingRecord.tuitionFee.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td className="p-2 border border-slate-200 font-bold text-slate-900">Admission &amp; Annual Enrollment Levy</td>
                    <td className="p-2 border border-slate-200 text-center text-slate-600 text-[10px]">Administrative</td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">₦{billingRecord.admissionFee.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-2 border border-slate-200 font-bold text-slate-900">CBT Exam Processing &amp; Proctoring Service</td>
                    <td className="p-2 border border-slate-200 text-center text-slate-600 text-[10px]">Assessment</td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">₦{billingRecord.cbtProcessingFee.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td className="p-2 border border-slate-200 font-bold text-slate-900">Miscellaneous Activities &amp; Laboratory Dues</td>
                    <td className="p-2 border border-slate-200 text-center text-slate-600 text-[10px]">Facility</td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-slate-900">₦{billingRecord.miscellaneousFee.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* FINANCIAL TOTALS SUMMARY */}
            <div className="relative z-10 bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-200 p-3.5 rounded-xl font-mono text-xs my-3 space-y-1.5">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-bold">Gross Total Assessment:</span>
                <span className="font-extrabold text-slate-900 text-sm">₦{billingRecord.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-800 border-t border-slate-200/80 pt-1.5">
                <span className="font-bold">Total Reconciled Amount Paid:</span>
                <span className="font-extrabold text-emerald-700 text-sm">₦{billingRecord.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-indigo-900 pt-1.5">
                <span className="font-black text-indigo-950 uppercase">Outstanding Balance Due:</span>
                <span className={`font-black text-base ${outstandingBalance > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  ₦{outstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* CBN / BANK TRANSACTION HISTORY LOGS */}
            {billingRecord.history && billingRecord.history.length > 0 && (
              <div className="relative z-10 my-3 space-y-1.5">
                <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-800">
                  CBN Reconciled Gateway Audit Trails
                </h4>
                <div className="space-y-1">
                  {billingRecord.history.map((tx) => (
                    <div key={tx.transactionId} className="bg-slate-50 border border-slate-200 p-2 rounded-lg font-mono text-[10px] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-indigo-950 block">{tx.paymentMethod}</span>
                        <span className="text-[8.5px] text-slate-500">Ref: {tx.transactionId} &bull; {tx.date}</span>
                      </div>
                      <span className="font-extrabold text-emerald-700 text-xs">+₦{tx.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OFFICIAL REGULATORY CLEARANCE STAMP */}
            {billingRecord.status === "PAID" && (
              <div className="relative z-10 my-3 p-3 bg-emerald-50 border-2 border-dashed border-emerald-500/60 rounded-xl text-emerald-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-600 flex items-center justify-center font-mono font-black text-xs text-emerald-700 bg-emerald-100 shrink-0">
                  CS
                </div>
                <div>
                  <h4 className="text-[11px] font-mono font-black uppercase tracking-widest text-emerald-900">
                    OFFICIAL INSTITUTIONAL CLEARANCE STAMP
                  </h4>
                  <p className="text-[9.5px] font-mono text-emerald-800 mt-0.5">
                    ALL TUITION DUES FULLY RECONCILED &bull; ZERO-PAPER RELEASE APPROVED BY BURSARY AUTHORITY
                  </p>
                </div>
              </div>
            )}

            {/* SIGNATURE & AUTHORIZATION FOOTER */}
            <div className="signature-section relative z-10 border-t-2 border-slate-900 pt-3.5 mt-4 grid grid-cols-2 gap-6 items-end text-xs font-mono">
              <div className="space-y-1">
                <div className="border-b border-slate-400 pb-1 h-8 flex items-end">
                  <span className="font-serif italic text-indigo-900 font-bold text-sm">M. Hilary</span>
                </div>
                <span className="text-[8px] uppercase text-slate-500 block font-bold">Authorized Bursary / Cashier Officer</span>
              </div>

              <div className="space-y-1 text-right">
                <div className="border-b border-slate-400 pb-1 h-8 flex items-end justify-end">
                  <span className="font-mono text-emerald-800 font-black text-xs">OFFICIAL SEAL VERIFIED</span>
                </div>
                <span className="text-[8px] uppercase text-slate-500 block font-bold">Registrar General Clearance Seal</span>
              </div>
            </div>

            {/* FOOTER COPYRIGHT */}
            <div className="text-center border-t border-slate-200 pt-2 text-[8.5px] font-mono text-slate-400 uppercase tracking-widest">
              © 2026 Corner Streams. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicePrintPreviewModal;
