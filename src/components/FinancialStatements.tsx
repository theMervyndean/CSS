/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { BillingRecord, UserProfile } from '../types';
import { mockBillingRecords } from '../mockData';
import { CreditCard, Landmark, FileText, Download, ShieldAlert, Sparkles, Printer, CheckCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface FinancialStatementsProps {
  currentProfile: UserProfile;
  billingRecords: BillingRecord[];
  onUpdateBilling: (updated: BillingRecord[]) => void;
}

export default function FinancialStatements({
  currentProfile,
  billingRecords,
  onUpdateBilling,
}: FinancialStatementsProps) {
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>('bl-01');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [reconciliationMethod, setReconciliationMethod] = useState<string>('Bank Transfer (CBN Reconciled)');
  const [stampClearance, setStampClearance] = useState<boolean>(true);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollTable = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = 240;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth'
      });
    }
  };

  const isAdmin = currentProfile.role === 'Super_Admin' || currentProfile.role === 'School_Admin';
  const isParent = currentProfile.role === 'Parent';

  // Filter bills appropriately
  const getVisibleBills = () => {
    if (isAdmin) return billingRecords;
    if (isParent) {
      // Find students assigned to this parent
      const affiliatedStudentIds = currentProfile.studentIds || [];
      return billingRecords.filter((b) => affiliatedStudentIds.includes(b.studentId));
    }
    // Students can see only their billing if allowed, otherwise blocked
    if (currentProfile.role === 'Student') {
      return billingRecords.filter((b) => b.studentId === currentProfile.id);
    }
    return [];
  };

  const visibleBills = getVisibleBills();
  const selectedBill = billingRecords.find((b) => b.id === activeInvoiceId) || visibleBills[0] || billingRecords[0];

  const handleMakePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return; // Only Admin / Registrar can enter transactions to prevent falsification

    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) return;

    const updated = billingRecords.map((b) => {
      if (b.id === selectedBill.id) {
        const newPaid = Math.min(b.totalAmount, b.amountPaid + amt);
        let newStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' = b.status;
        
        if (newPaid >= b.totalAmount) {
          newStatus = 'PAID';
        } else if (newPaid > 0) {
          newStatus = 'PARTIALLY_PAID';
        }

        const newTxn = {
          transactionId: `TXN-NEW-${Math.floor(Math.random() * 9000000 + 1000000)}`,
          amount: amt,
          paymentMethod: reconciliationMethod,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          description: `Direct Institutional Cashier Clearance Stamp`
        };

        return {
          ...b,
          amountPaid: newPaid,
          status: newStatus,
          history: [...b.history, newTxn]
        };
      }
      return b;
    });

    onUpdateBilling(updated);
    setPaymentAmount('');
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
    }, 5000);
  };

  const triggerReceiptPrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PARTIALLY_PAID':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PENDING':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (visibleBills.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">No Verified Ledgers Available</h3>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          You are currently impersonating a client context ({currentProfile.fullName}) that holds no registered active ledger invoices under this platform terminal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT: LEDGER SPREADSHEET */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        
        {/* Header toolbar */}
        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">
                Institutional Billing Ledger
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Reconciled payment schedules, automated CBN portal synchronization logs, and ledger status.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Smooth Table Horizontal Scroller */}
            <div className="flex items-center gap-1 bg-slate-200/50 p-0.5 rounded border border-slate-200">
              <button
                type="button"
                onClick={() => handleScrollTable('left')}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition cursor-pointer"
                title="Scroll left"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[8px] font-black tracking-widest text-slate-400 px-1 uppercase select-none">SLIDE</span>
              <button
                type="button"
                onClick={() => handleScrollTable('right')}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition cursor-pointer"
                title="Scroll right"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded">
              ₦ NIGERIAN NAIRA REGISTER
            </div>
          </div>
        </div>

        {/* Ledger listings */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto scroll-smooth">
          <table className="w-full border-collapse min-w-[650px]">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="border-b border-slate-200">
                <th className="p-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider">Invoice No.</th>
                <th className="p-2.5 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider">Student Name</th>
                <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase tracking-wider">Term / Session</th>
                <th className="p-2.5 text-right text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Charge</th>
                <th className="p-2.5 text-right text-[9px] font-black text-slate-400 uppercase tracking-wider">Amount Paid</th>
                <th className="p-2.5 text-right text-[9px] font-black text-slate-400 uppercase tracking-wider">Outstanding</th>
                <th className="p-2.5 text-center text-[9px] font-black text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {visibleBills.map((b) => {
                const outstanding = b.totalAmount - b.amountPaid;
                const isSelected = activeInvoiceId === b.id;
                return (
                  <tr
                    key={b.id}
                    onClick={() => setActiveInvoiceId(b.id)}
                    className={`hover:bg-slate-50 cursor-pointer transition ${
                      isSelected ? 'bg-indigo-50/50 font-semibold' : ''
                    }`}
                  >
                    <td className="p-3 text-indigo-600 font-bold">{b.invoiceNumber}</td>
                    <td className="p-3 font-sans font-bold text-slate-700 uppercase">{b.studentName}</td>
                    <td className="p-3 text-center text-[10px] text-slate-500 uppercase">{b.term} • {b.session}</td>
                    <td className="p-3 text-right">₦{b.totalAmount.toLocaleString()}</td>
                    <td className="p-3 text-right text-emerald-600 font-bold">₦{b.amountPaid.toLocaleString()}</td>
                    <td className={`p-3 text-right ${outstanding > 0 ? 'text-rose-600 font-bold animate-pulse' : 'text-slate-400'}`}>
                      ₦{outstanding.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: TRANSCRIPT DETAILED RECEIPT / INVOICE */}
      <div className="w-full lg:w-96 bg-slate-900 text-slate-100 rounded-xl shadow-lg border border-slate-800 p-5 flex flex-col shrink-0 overflow-y-auto max-h-full print:bg-white print:text-black">
        
        {/* Printable section wrapper */}
        <div id="printable-statement" className="flex-1 flex flex-col">
          {/* Statement top styling info */}
          <div className="border-b border-slate-800 pb-4 mb-4 flex justify-between items-start">
            <div>
              <span className="text-[10px] bg-indigo-500 text-white font-mono px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                Official Transcript
              </span>
              <h2 className="text-sm font-black uppercase mt-1.5 tracking-tight">CORNER STREAMS</h2>
              <p className="text-[9px] text-slate-400">Zero Paper Clearance Protocol</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono font-bold text-indigo-400">{selectedBill.invoiceNumber}</p>
              <p className="text-[9px] text-slate-500">{selectedBill.term} • {selectedBill.session}</p>
            </div>
          </div>

          {/* Student metadata */}
          <div className="bg-slate-800/40 border border-slate-800 rounded p-3 text-xs mb-4 space-y-1">
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider leading-none mb-1">Payer Details</p>
            <p className="font-bold text-slate-200">Student: <span className="uppercase text-white">{selectedBill.studentName}</span></p>
            <p className="text-slate-400">Class Scope: Secondary ArmSS 2A</p>
          </div>

          {/* Fees breakdown rows */}
          <div className="mt-2 space-y-2.5 flex-1">
            <h4 className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest border-b border-slate-800 pb-1">Ledger Itemized Charges</h4>
            
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Tuition/Institutional Fee</span>
              <span className="font-mono text-slate-200">₦{selectedBill.tuitionFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Admission Enrollment Fee</span>
              <span className="font-mono text-slate-200">₦{selectedBill.admissionFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">CBT Exam Processing Service</span>
              <span className="font-mono text-slate-200">₦{selectedBill.cbtProcessingFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Miscellaneous Activities</span>
              <span className="font-mono text-slate-200">₦{selectedBill.miscellaneousFee.toLocaleString()}</span>
            </div>

            <div className="border-t border-slate-800 pt-2 mt-4 space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Gross Total</span>
                <span className="font-mono text-white">₦{selectedBill.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-400">Total Reconciled Paid</span>
                <span className="font-mono text-emerald-400">₦{selectedBill.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold border-t border-slate-800 pt-1.5 select-none">
                <span className="text-slate-300">Balance Outstanding</span>
                <span className={`font-mono ${selectedBill.totalAmount - selectedBill.amountPaid > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                  ₦{(selectedBill.totalAmount - selectedBill.amountPaid).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Micro transaction history logs */}
            {selectedBill.history.length > 0 && (
              <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
                <h5 className="text-[9px] text-slate-400 uppercase font-black tracking-wider">CBN/Bank Gateway Reconciled Logs</h5>
                {selectedBill.history.map((tx, idx) => (
                  <div key={tx.transactionId} className="bg-slate-950/50 border border-slate-800/60 p-2 rounded font-mono text-[9px] leading-relaxed relative">
                    <div className="flex justify-between font-bold text-slate-300">
                      <span>{tx.paymentMethod}</span>
                      <span className="text-emerald-400">+₦{tx.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 mt-1">
                      <span>Ref: {tx.transactionId}</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regulatory Stamp of authorization */}
          {stampClearance && selectedBill.status === 'PAID' && (
            <div className="mt-5 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-dashed border-emerald-400/40 flex items-center justify-center font-bold text-[9px] animate-spin-slow text-center">
                CS
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">CLEARED & RECONCILED</p>
                <p className="text-[8px] opacity-70 leading-normal mt-0.5 font-mono">STAMP: ZERO-PAPER PLATFORM RELEASE OK</p>
              </div>
            </div>
          )}
        </div>

        {/* Administration payment intervention widget */}
        {isAdmin && selectedBill.status !== 'PAID' && (
          <form onSubmit={handleMakePayment} className="mt-6 pt-4 border-t border-slate-800 space-y-3">
            <h5 className="text-[10px] uppercase font-bold text-amber-400">Institutional Payment Gate override</h5>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="₦ Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white outline-none font-mono focus:border-indigo-500"
              />
              <select
                value={reconciliationMethod}
                onChange={(e) => setReconciliationMethod(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-1 py-1 text-[10px] text-white outline-none"
              >
                <option>Bank Transfer (CBN Reconciled)</option>
                <option>POS Terminal Sync</option>
                <option>Web Instant Paystack</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded tracking-wider"
            >
              Post Clearance Entry
            </button>

            {paymentSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 font-mono text-[9px] leading-relaxed flex items-center gap-2 animate-pulse mt-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>[SUCCESS] Transaction published to CBN, physical ledger cleared!</span>
              </div>
            )}
          </form>
        )}

        <button
          onClick={triggerReceiptPrint}
          className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase rounded tracking-widest flex items-center justify-center gap-1.5 transition"
        >
          <Printer className="w-3.5 h-3.5" />
          Export / Download Financial Transcript
        </button>
      </div>
    </div>
  );
}
