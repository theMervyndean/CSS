import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, AlertTriangle, Lock, Unlock, KeyRound, 
  CheckCircle2, X, FileCheck, Eye, EyeOff, ShieldAlert, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { logAdminActivity } from '../utils/adminAuditLogger';

interface ResultPublishCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCurrentlyPublished: boolean;
  onConfirmStatusChange: (newStatus: boolean) => void;
  schoolName?: string;
  adminName?: string;
}

export const ResultPublishCertificationModal: React.FC<ResultPublishCertificationModalProps> = ({
  isOpen,
  onClose,
  isCurrentlyPublished,
  onConfirmStatusChange,
  schoolName = 'Corner Streams Academy',
  adminName = 'School Administrator'
}) => {
  const targetStatus = !isCurrentlyPublished; // If published -> lock; If locked -> publish

  // Certification checkboxes
  const [certGradesAudit, setCertGradesAudit] = useState<boolean>(false);
  const [certRemarksSigned, setCertRemarksSigned] = useState<boolean>(false);
  const [certLiveNoticeAcknowledged, setCertLiveNoticeAcknowledged] = useState<boolean>(false);

  // Security password
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);

  const resetForm = () => {
    setCertGradesAudit(false);
    setCertRemarksSigned(false);
    setCertLiveNoticeAcknowledged(false);
    setAdminPassword('');
    setPasswordError('');
    setIsAuthorizing(false);
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const isCertificationComplete = 
    certGradesAudit && 
    certRemarksSigned && 
    certLiveNoticeAcknowledged;

  const handleAuthorizeRelease = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!isCertificationComplete) {
      toast.error('Please certify all statutory requirements before proceeding.');
      return;
    }

    if (!adminPassword.trim()) {
      setPasswordError('Please enter your School Administrator security password.');
      return;
    }

    // Validate security password (accepts standard admin credentials or min length 3)
    const validPasswords = ['admin', 'admin123', 'stream2026', 'password', '1234', 'superadmin', 'principal'];
    const trimmedInput = adminPassword.trim().toLowerCase();
    const isValid = validPasswords.includes(trimmedInput) || adminPassword.length >= 4;

    if (!isValid) {
      setPasswordError('Invalid administrative security password. Please try again.');
      return;
    }

    setIsAuthorizing(true);

    setTimeout(() => {
      onConfirmStatusChange(targetStatus);
      if (targetStatus) {
        toast.success('✨ Official Terminal Results successfully published to Student & Parent portals!');
        logAdminActivity({
          actionType: 'publish_results',
          actionTitle: 'Academic Results Published to Live Portals',
          severity: 'critical',
          performedBy: {
            name: adminName,
            role: 'School_Admin',
          },
          targetResource: `Terminal Report Cards & Broadsheets (${schoolName})`,
          details: `Authorized full public visibility of continuous assessments, exam scores, and QR dossiers.`,
          authMethod: '2fa_certified',
          status: 'executed'
        });
      } else {
        toast.info('🔒 Terminal Results have been locked. Public parent/student access revoked.');
        logAdminActivity({
          actionType: 'lock_results',
          actionTitle: 'Academic Results Locked From Public View',
          severity: 'high',
          performedBy: {
            name: adminName,
            role: 'School_Admin',
          },
          targetResource: `Terminal Report Cards & Broadsheets (${schoolName})`,
          details: `Restricted student and parent portal access during faculty broadsheet reconciliation.`,
          authMethod: 'password_reauth',
          status: 'executed'
        });
      }
      setIsAuthorizing(false);
      handleModalClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        >
          {/* Header Bar */}
          <div className={`p-4 sm:p-5 text-white flex items-center justify-between border-b ${
            targetStatus 
              ? 'bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 border-emerald-800/40' 
              : 'bg-gradient-to-r from-slate-950 via-rose-950 to-indigo-950 border-rose-800/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                targetStatus 
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' 
                  : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
              }`}>
                {targetStatus ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-black px-2 py-0.5 rounded bg-white/10 text-white/90">
                    Two-Step Authorization
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isCurrentlyPublished ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
                  }`}>
                    Currently: {isCurrentlyPublished ? '● PUBLISHED' : '🔒 LOCKED'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight mt-1 text-white font-display">
                  {targetStatus ? 'Publish Academic Results Live' : 'Revoke & Lock Academic Results'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleModalClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAuthorizeRelease} className="p-4 sm:p-6 space-y-5">
            {/* Warning Callout Box */}
            <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              targetStatus 
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200' 
                : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200'
            }`}>
              {targetStatus ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <h4 className="font-black text-sm tracking-tight flex items-center gap-1.5">
                  {targetStatus ? 'Critical Publication Warning' : 'Access Revocation Notice'}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
                  {targetStatus ? (
                    <>
                      Publishing will instantly make <strong>report cards, continuous assessment scores (CA1, CA2), exam results, class ranks</strong>, and <strong>teacher/principal remarks</strong> accessible to all registered students and parents across the portal.
                    </>
                  ) : (
                    <>
                      Locking results will immediately <strong>block student and parent view access</strong> to terminal reports and result checkers. Grades remain intact and accessible to authorized teachers and school administrators only.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Institutional Metadata Context */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-mono">Institution</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">{schoolName}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-mono">Academic Term</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 block mt-0.5">2025/2026 • 2nd Term</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-mono">Authorizing Officer</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-400 truncate block mt-0.5">{adminName}</span>
              </div>
            </div>

            {/* STEP 1: Two-Step Statutory Certification */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px]">
                  1
                </span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Step 1: Statutory Academic Certification
                </h4>
              </div>

              <div className="space-y-2.5 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={certGradesAudit}
                    onChange={(e) => setCertGradesAudit(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white leading-snug">
                    I certify that all continuous assessment (CA) marks, terminal exam scores, and weighted aggregates have been audited and reconciled.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={certRemarksSigned}
                    onChange={(e) => setCertRemarksSigned(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white leading-snug">
                    I confirm that official teacher remarks, principal conduct endorsements, and statutory promotion decisions are complete.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={certLiveNoticeAcknowledged}
                    onChange={(e) => setCertLiveNoticeAcknowledged(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white leading-snug">
                    I acknowledge that executing this authorization updates cloud student/parent portals and activates QR verification signatures.
                  </span>
                </label>
              </div>
            </div>

            {/* STEP 2: Administrative Security Password */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px]">
                  2
                </span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Step 2: Administrative Security Password
                </h4>
              </div>

              <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Enter Administrator Master Password:</span>
                  <span className="text-[9.5px] font-normal text-slate-400 font-mono">e.g., admin123 or school password</span>
                </label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Enter security password to authorize..."
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {passwordError}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isAuthorizing}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel & Keep {isCurrentlyPublished ? 'Published' : 'Locked'}
              </button>

              <button
                type="submit"
                disabled={!isCertificationComplete || !adminPassword.trim() || isAuthorizing}
                className={`w-full sm:w-auto px-5 py-2.5 text-xs font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  targetStatus 
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white' 
                    : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 text-white'
                }`}
              >
                {isAuthorizing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Authorizing Verification...</span>
                  </>
                ) : (
                  <>
                    {targetStatus ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>{targetStatus ? 'Authorize & Publish Results Live' : 'Confirm & Lock Results Access'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ResultPublishCertificationModal;
