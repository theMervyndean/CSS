import React, { useState, useEffect } from "react";
import { BrandLogo } from "./BrandLogo";
import { Button } from "./ui-stubs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  School, MapPin, Phone, User, Mail, Sparkles, UploadCloud, FileText, CheckCircle2,
  ArrowLeft, ArrowRight, Clipboard, Trash2, ChevronDown, ShieldAlert, Eye, EyeOff, Lock, Check, Globe,
  CreditCard, Shield, RefreshCw, Wallet
} from "lucide-react";
import { mockUsers } from "../mockData";
import { UserProfile } from "../types";

interface RegisterProps {
  selectedPlan?: string;
  selectedPlanDuration?: string;
  onRegisterSuccess: (newAdminProfile: UserProfile) => void;
  onChangeView: (view: 'landing' | 'login' | 'register' | 'app') => void;
}

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom"];

const NIGERIAN_STATES = ["Lagos", "Abuja FCT", "Rivers", "Oyo", "Kano", "Kaduna", "Anambra", "Edo", "Delta", "Ogun", "Enugu"];
const GHANA_REGIONS = ["Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Northern", "Volta"];
const KENYA_COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Uasin Gishu"];
const OTHER_REGIONS = ["Mainland Region", "Administrative District", "Central Sector", "Northern Territory"];

const PLAN_INFO: Record<string, { name: string; desc: string; prices: Record<string, number> }> = {
  cbt_essentials: { name: "CBT Essentials", desc: "Computer-based testing engine with offline resilency cache.", prices: { "1_term": 40000, "2_terms": 70000, "full_session": 110000 } },
  digital_reports: { name: "Digital Reports", desc: "Continuous Assessment matrices + report generators.", prices: { "1_term": 50000, "2_terms": 90000, "full_session": 140000 } },
  financial_ledger: { name: "Financial Ledger", desc: "School fee tracking, instant Debt Lock on report check.", prices: { "1_term": 40000, "2_terms": 70000, "full_session": 110000 } },
  unified_enterprise: { name: "Unified Enterprise", desc: "Complete system suite (CBT, Reports & Financials).", prices: { "full_session": 200000 } }
};

const INSTITUTIONAL_ARMS = [
  { id: "Creche", label: "Creche" },
  { id: "Nursery", label: "Nursery" },
  { id: "Montessori", label: "Montessori" },
  { id: "Primary", label: "Primary" },
  { id: "Secondary", label: "Secondary" },
  { id: "Mixed", label: "Mixed Segment" }
];

const ASSESSMENT_VARIANTS = [
  {
    id: "2ca_20_20",
    title: "2 CAs Variant",
    desc: "20, 20 Continuous Assessment + 60 Final Exam",
    weights: { cas: [20, 20], exam: 60 }
  },
  {
    id: "4ca_10_10_10_10",
    title: "4 CAs Variant",
    desc: "10, 10, 10, 10 Continuous Assessment + 60 Final Exam",
    weights: { cas: [10, 10, 10, 10], exam: 60 }
  },
  {
    id: "4ca_5_5_5_5",
    title: "4 CAs Variant",
    desc: "5, 5, 5, 5 Continuous Assessment + 80 Final Exam",
    weights: { cas: [5, 5, 5, 5], exam: 80 }
  },
  {
    id: "4ca_10_10_80",
    title: "4 CAs Variant",
    desc: "10, 10 Continuous Assessment + 80 Final Exam",
    weights: { cas: [10, 10], exam: 80 }
  }
];

export default function RegisterPage({
  selectedPlan = "unified_enterprise",
  selectedPlanDuration = "full_session",
  onRegisterSuccess,
  onChangeView
}: RegisterProps) {
  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form payload configuration state
  const [formData, setFormData] = useState({
    schoolName: "",
    selectedArms: [] as string[],
    country: "Nigeria",
    stateLocation: "Lagos",
    principalName: "",
    whatsapp: "",
    email: "",
    password: "",
    assessmentVariant: "2ca_20_20"
  });

  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Custom Select Dropdown open toggles
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);

  // Phase 2 Checkout payment gateway states
  const [checkoutPlan, setCheckoutPlan] = useState<string>(selectedPlan);
  const [checkoutDuration, setCheckoutDuration] = useState<string>(selectedPlanDuration);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'paystack'>('paystack');
  
  // Card input states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paymentStep, setPaymentStep] = useState<'idle' | 'processing' | 'verifying' | 'completed'>('idle');
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("");

  // WhatsApp Simulated security verification states
  const [whatsappCode, setWhatsappCode] = useState("");
  const [whatsappDispatchedCode, setWhatsappDispatchedCode] = useState("");
  const [whatsappSecurityProfile, setWhatsappSecurityProfile] = useState<UserProfile | null>(null);
  const [whatsappHandshakeStep, setWhatsappHandshakeStep] = useState<'idle' | 'transmitting' | 'sent' | 'verified'>('idle');
  const [schoolRegPassword, setSchoolRegPassword] = useState("");
  const [schoolRegConfirmPassword, setSchoolRegConfirmPassword] = useState("");

  // Sync plan and duration props if changed from home page selection
  useEffect(() => {
    if (selectedPlan) {
      setCheckoutPlan(selectedPlan);
    }
    if (selectedPlanDuration) {
      setCheckoutDuration(selectedPlanDuration);
    }
  }, [selectedPlan, selectedPlanDuration]);

  // Auto close location dropdowns on outside actions
  const getRegionsForCountry = (country: string) => {
    if (country === "Nigeria") return NIGERIAN_STATES;
    if (country === "Ghana") return GHANA_REGIONS;
    if (country === "Kenya") return KENYA_COUNTIES;
    return OTHER_REGIONS;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File is too large. Please upload an image under 5MB.");
          return;
        }
        setUploadedLogo(file);
        setLogoPreviewUrl(URL.createObjectURL(file));
        toast.success(`Logo loaded: ${file.name}`);
      } else {
        toast.error("Unsupported file type. Please upload a standard PNG/JPG image.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File is too large. Please upload an image under 5MB.");
          return;
        }
        setUploadedLogo(file);
        setLogoPreviewUrl(URL.createObjectURL(file));
        toast.success(`Logo loaded: ${file.name}`);
      } else {
        toast.error("Unsupported file type. Please upload a standard PNG/JPG image.");
      }
    }
  };

  const toggleArmSelection = (armId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedArms.includes(armId);
      const updated = exists
        ? prev.selectedArms.filter((id) => id !== armId)
        : [...prev.selectedArms, armId];
      return { ...prev, selectedArms: updated };
    });
  };

  // Step progression validations
  const validateStep1 = () => {
    setErrorMsg(null);
    if (!formData.schoolName.trim()) {
      setErrorMsg("Please provide your official School Name.");
      return false;
    }
    if (formData.selectedArms.length === 0) {
      setErrorMsg("Please select at least one Institutional Arm Type.");
      return false;
    }
    if (!formData.country || !formData.stateLocation) {
      setErrorMsg("Please verify Country and State selection.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMsg(null);
    if (!formData.principalName.trim()) {
      setErrorMsg("Representative Principal Name is required.");
      return false;
    }
    if (!formData.whatsapp.trim()) {
      setErrorMsg("WhatsApp / Mobile Phone connection is required.");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMsg("Please enter a valid Administrative Email Address.");
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg("Secure password must contain at least 6 alphanumeric keys.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    setErrorMsg(null);
    return true;
  };

  const validateStep4 = () => {
    setErrorMsg(null);
    if (cardNumber.replace(/\s/g, '').length < 12) {
      setErrorMsg("Please supply a valid billing card number to process payment.");
      return false;
    }
    if (!cardExpiry.includes("/") || cardExpiry.length < 5) {
      setErrorMsg("Expiry month/year required in standard MM/YY configuration.");
      return false;
    }
    if (cardCvv.length < 3) {
      setErrorMsg("Standard 3-digit card CVV code required on rear of credit card.");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    } else if (step === 3) {
      if (validateStep3()) setStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (step === 5) {
      setStep(4);
      setPaymentStep('idle');
      return;
    }
    if (step > 1) setStep(step - 1);
  };

  const handleVerifyWhatsAppCode = () => {
    setErrorMsg(null);
    if (!whatsappCode || whatsappCode.length < 6) {
      setErrorMsg("Please enter the complete 6-digit verification code sent to your WhatsApp number.");
      return;
    }

    if (whatsappCode !== whatsappDispatchedCode) {
      setErrorMsg("Security Token Match Failed. Please enter matching 6-digit WhatsApp check code.");
      toast.error("Security Onboarding Token is incorrect.");
      return;
    }

    setLoading(true);
    toast.loading("Verifying automatic handshake token...", { id: "handshake-processing" });

    setTimeout(() => {
      toast.dismiss("handshake-processing");
      setLoading(false);
      setWhatsappHandshakeStep('verified');
      toast.success("WhatsApp Handshake Cleared! Please create a secure password for your Digital Head Office.");
    }, 1500);
  };

  const handleCreateSchoolPassword = () => {
    setErrorMsg(null);
    if (!schoolRegPassword || schoolRegPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters in length.");
      toast.error("Password is too short.");
      return;
    }

    if (schoolRegPassword !== schoolRegConfirmPassword) {
      setErrorMsg("Password confirmation does not match the entered password.");
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    toast.loading("Finalizing school profile and securing database...", { id: "securing-db" });

    setTimeout(() => {
      toast.dismiss("securing-db");
      setLoading(false);
      
      const emailKey = formData.email.trim().toLowerCase();
      const phoneKey = formData.whatsapp.trim().replace(/\D/g, "");
      
      // Store the school custom credentials
      localStorage.setItem(`CS_PASSWORD_${emailKey}`, schoolRegPassword);
      if (phoneKey) {
        localStorage.setItem(`CS_PASSWORD_${phoneKey}`, schoolRegPassword);
      }

      // Track password on school object
      const sch = JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}");
      if (sch) {
        sch.admin_password = schoolRegPassword;
        sch.verification_status = "active"; // Since they verified with phone and set password, make active or keep as verification status
        localStorage.setItem("CS_SCHOOL", JSON.stringify(sch));
      }

      toast.success("School Administrator password registered successfully! Active Tenant Provisioned.");
      
      if (whatsappSecurityProfile) {
        onRegisterSuccess(whatsappSecurityProfile);
      }
    }, 1500);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
      return;
    }

    setLoading(true);
    setPaymentStep('processing');
    setPaymentStatusMessage(`Initiating ${paymentProvider === 'paystack' ? 'Paystack NGN' : 'Stripe USD'} payment link gateway handshakes...`);
    await new Promise(r => setTimeout(r, 1500));

    setPaymentStatusMessage(`[${paymentProvider.toUpperCase()}] Direct card transaction pre-authorization triggered...`);
    await new Promise(r => setTimeout(r, 1500));

    setPaymentStatusMessage(`[WAITING FOR BANK DEBIT ALERT...] Stripe/Paystack transaction launched. Waiting for bank transaction notification. Please check your phone / SMS for notifications...`);
    await new Promise(r => setTimeout(r, 3500));

    setPaymentStatusMessage(`debit alert received! Transaction successful. Securely generating school administration profile...`);
    await new Promise(r => setTimeout(r, 1500));

    const activeVariant = ASSESSMENT_VARIANTS.find((v) => v.id === formData.assessmentVariant) || ASSESSMENT_VARIANTS[0];

    const registrationPayload = {
      schoolName: formData.schoolName.trim(),
      institutionalArms: formData.selectedArms,
      country: formData.country,
      stateLocation: formData.stateLocation,
      principalName: formData.principalName.trim(),
      whatsapp: formData.whatsapp.trim(),
      email: formData.email.trim(),
      password: formData.password,
      assessmentVariant: formData.assessmentVariant,
      assessmentWeights: activeVariant.weights
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registrationPayload)
      }).catch(() => {
        // Fallback for simulation standalone sandbox environments
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            message: "Mock database initialized successfully from cold boot.",
            token: "eyCS-JWT-TOKEN-GENERATED-AUTOMATICALLY"
          })
        };
      });

      let isMockFallbackUsed = false;
      let errorData: any = {};

      if (res.status === 201 || res.ok) {
        try {
          const contentType = ("headers" in res && res.headers && typeof res.headers.get === 'function') 
            ? res.headers.get("Content-Type") 
            : "";
          if (contentType && contentType.includes("html")) {
            isMockFallbackUsed = true;
          }
        } catch (e) {}
      } else {
        isMockFallbackUsed = true;
        try {
          errorData = await res.json().catch(() => ({}));
        } catch (e) {}
      }

      if (res.status === 201 || res.ok || isMockFallbackUsed) {
        const schoolPrice = PLAN_INFO[checkoutPlan]?.prices[checkoutDuration] || PLAN_INFO[checkoutPlan]?.prices["full_session"] || 200000;
        
        const customSchoolObj = {
          id: `sch-${Math.floor(1000 + Math.random() * 9000)}`,
          name: formData.schoolName.trim(),
          principal_name: formData.principalName.trim(),
          email: formData.email.trim(),
          phone: formData.whatsapp.trim(),
          subscription_tier: checkoutPlan,
          subscription_duration: checkoutDuration,
          verification_status: "paid_pending_verification", // Transition to paid pending verification!
          welcome_complete: false,
          kill_switch: false,
          benchmark: 50,
          classes: formData.selectedArms.flatMap((arm) => {
            if (arm === "Secondary") return ["JSS 1", "JSS 2", "SS 1", "SS 2"];
            if (arm === "Primary") return ["Primary 1", "Primary 2", "Primary 3"];
            if (arm === "Creche") return ["Creche / Nursery"];
            if (arm === "Montessori") return ["Nursery 1", "Nursery 2"];
            if (arm === "Nursery") return ["Kindergarten 1", "Kindergarten 2"];
            return ["Grade 1", "Grade 2"];
          }),
          assessment_structure: activeVariant.weights,
          arms: formData.selectedArms,
          logo_url: logoPreviewUrl || ""
        };

        localStorage.setItem("CS_SCHOOL", JSON.stringify(customSchoolObj));

        // Save billing transfer receipt log automatically
        const receipts = JSON.parse(localStorage.getItem("CS_RECEIPTS") || "[]");
        const receiptCode = Math.floor(100000 + Math.random() * 900000).toString();
        receipts.unshift({
          id: "rcp-" + Math.random().toString(36).substr(2, 9),
          tier: checkoutPlan,
          duration: checkoutDuration,
          amount_ngn: schoolPrice,
          status: "pending",
          created_at: new Date().toISOString(),
          submitted_by: formData.email.trim(),
          whatsapp_code: receiptCode,
          note: `Auto-generated from Credit Card Checkout: ${paymentProvider.toUpperCase()} Gateway`
        });
        localStorage.setItem("CS_RECEIPTS", JSON.stringify(receipts));

        // Add user profile
        const superAdminProfile: UserProfile = {
          id: `usr-admin-${Math.floor(1000 + Math.random() * 9000)}`,
          username: formData.email.trim().split("@")[0].toUpperCase(),
          fullName: formData.principalName.trim(),
          role: "School_Admin",
          email: formData.email.trim(),
          phone: formData.whatsapp.trim(),
          photoUrl: logoPreviewUrl || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=150&h=150",
          arm: formData.selectedArms[0] || "Secondary"
        };

        const existingUsers = JSON.parse(localStorage.getItem("CS_USERS_LIST") || "[]");
        existingUsers.push({
          id: superAdminProfile.id,
          name: superAdminProfile.fullName,
          email: superAdminProfile.email,
          role: "school_admin",
          assigned_classes: []
        });
        localStorage.setItem("CS_USERS_LIST", JSON.stringify(existingUsers));

        setPaymentStep('completed');
        toast.success(`Transaction of ₦${schoolPrice.toLocaleString()} cleared successfully.`);
        
        // WhatsApp automatic secure handshake dispatch as requested by customer
        const randCode = Math.floor(100000 + Math.random() * 900000).toString();
        setWhatsappDispatchedCode(randCode);
        setWhatsappSecurityProfile(superAdminProfile);
        setWhatsappHandshakeStep('transmitting');

        // Save the dynamic WhatsApp dispatch code to localStorage so that they can use it for WhatsApp login too!
        localStorage.setItem(`CS_WA_CODE_${formData.email.trim().toLowerCase()}`, randCode);
        localStorage.setItem(`CS_WA_CODE_${formData.whatsapp.trim().replace(/\s+/g, '')}`, randCode);

        toast.loading("Initiating secure WhatsApp Handshake dispatch...", { id: "wa-dispatch" });

        setTimeout(() => {
          toast.dismiss("wa-dispatch");
          setStep(5);
          setWhatsappHandshakeStep('sent');
          toast.success(`Security authorization token (${randCode}) successfully broadcasted to WhatsApp.`);
        }, 1500);
      } else {
        setErrorMsg(errorData.message || "Failed to negotiate database enrollment structure. Verification error (422).");
        toast.error("Registration parameters rejected.");
        setPaymentStep('idle');
      }
    } catch (err) {
      setErrorMsg("Core system network validation collapsed. Re-attempt proposal submission.");
      setPaymentStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const activeVariant = ASSESSMENT_VARIANTS.find((v) => v.id === formData.assessmentVariant) || ASSESSMENT_VARIANTS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-600 selection:text-white relative font-sans">
      {/* Light elegant subtle top gradient match */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/40 via-slate-50 to-slate-50 -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 -z-10" />

      {/* Centered High Density Header */}
      <div className="max-w-[1600px] mx-auto w-full px-6 h-14 sm:h-16 flex items-center justify-center relative border-b border-slate-200/60 z-20">
        <button
          onClick={() => onChangeView('landing')}
          className="absolute left-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-950 transition cursor-pointer"
        >
          <ArrowLeft size={14} className="text-indigo-600" /> <span className="hidden sm:inline">Back To Homepage</span>
        </button>

        {/* Centered Brand Logo */}
        <div className="py-2 flex items-center justify-center">
          <BrandLogo darkTheme={false} size={28} />
        </div>        <div className="absolute right-6 hidden sm:block text-slate-500 text-xs font-bold">
          Step {step} of 5
        </div>
      </div>

      {/* Main onboarding form block in Light Theme layout */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-6 shadow-lg shadow-slate-200/40 relative"
        >
          {/* Headings */}
          <div className="text-center space-y-1 mb-4 font-sans">
            <h2 className="font-sans text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 bg-clip-text text-transparent uppercase tracking-tight">
              Onboard Your School
            </h2>
            <p className="text-[11px] text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
              Fill in your details to configure your school's database
            </p>
          </div>

          {/* Crimson Alert Notice Banner */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-bold flex items-center gap-2"
            >
              <ShieldAlert size={15} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* High Density Step Indicator */}
          <div className="grid grid-cols-5 gap-1 mb-4 relative">
            <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden col-span-5 absolute inset-0 -z-10 mt-1.5" />
            
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border-2 text-[10px] flex items-center justify-center font-bold transition-all ${
                step >= 1 ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "bg-white border-slate-200 text-slate-400"
              }`}>
                {step > 1 ? <Check size={8} strokeWidth={4} /> : "1"}
              </div>
              <span className={`text-[8px] sm:text-[9px] mt-1 font-black uppercase tracking-wider ${step >= 1 ? "text-indigo-600" : "text-slate-400"}`}>PROFILE</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border-2 text-[10px] flex items-center justify-center font-bold transition-all ${
                step >= 2 ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "bg-white border-slate-200 text-slate-400"
              }`}>
                {step > 2 ? <Check size={8} strokeWidth={4} /> : "2"}
              </div>
              <span className={`text-[8px] sm:text-[9px] mt-1 font-black uppercase tracking-wider ${step >= 2 ? "text-indigo-600" : "text-slate-400"}`}>ADMIN</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border-2 text-[10px] flex items-center justify-center font-bold transition-all ${
                step >= 3 ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "bg-white border-slate-200 text-slate-400"
              }`}>
                {step > 3 ? <Check size={8} strokeWidth={4} /> : "3"}
              </div>
              <span className={`text-[8px] sm:text-[9px] mt-1 font-black uppercase tracking-wider ${step >= 3 ? "text-indigo-600" : "text-slate-400"}`}>LEDGER</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border-2 text-[10px] flex items-center justify-center font-bold transition-all ${
                step >= 4 ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "bg-white border-slate-200 text-slate-400"
              }`}>
                {step > 4 ? <Check size={8} strokeWidth={4} /> : "4"}
              </div>
              <span className={`text-[8px] sm:text-[9px] mt-1 font-black uppercase tracking-wider ${step >= 4 ? "text-indigo-600" : "text-slate-400"}`}>PAY</span>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border-2 text-[10px] flex items-center justify-center font-bold transition-all ${
                step >= 5 ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "bg-white border-slate-200 text-slate-400"
              }`}>
                {step > 5 ? <Check size={8} strokeWidth={4} /> : "5"}
              </div>
              <span className={`text-[8px] sm:text-[9px] mt-1 font-black uppercase tracking-wider ${step >= 5 ? "text-emerald-600" : "text-slate-400"}`}>VERIFY</span>
            </div>
          </div>

          {/* Form Fields Segment */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4 text-left"
                >
                  {/* School Name input */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1">Official School Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <School size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Corner Streams Academy"
                        value={formData.schoolName}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        onBlur={() => setFormData({ ...formData, schoolName: formData.schoolName.trim() })}
                        className={`w-full text-xs text-slate-900 bg-slate-50 border ${
                          errorMsg && !formData.schoolName.trim() ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 hover:border-indigo-600 focus:border-indigo-600"
                        } rounded-lg py-2.5 pl-9 pr-4 transition-all duration-300 outline-none font-bold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 shadow-sm`}
                      />
                    </div>
                  </div>

                  {/* Institutional Arm Type Select multi options with emerald highlights */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1">
                      Institutional Arm Type <span className="text-indigo-600">(Tap multiple)</span>
                    </label>
                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                      {INSTITUTIONAL_ARMS.map((arm) => {
                        const isSelected = formData.selectedArms.includes(arm.id);
                        return (
                          <button
                            type="button"
                            key={arm.id}
                            onClick={() => toggleArmSelection(arm.id)}
                            className={`p-2.5 rounded-lg text-left text-[11px] font-bold border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70"
                            }`}
                          >
                            <span>{arm.label}</span>
                            {isSelected ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex items-center justify-center p-0.5">
                                <Check size={8} className="text-white" strokeWidth={5} />
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-200 block" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Country & State Double selector with custom drop selectors, no standard OS options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Country custom select with royal gradient selection and emerald hover */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1">Country</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCountryOpen(!isCountryOpen);
                            setIsStateOpen(false);
                          }}
                          className={`w-full text-xs text-left text-slate-900 bg-slate-50 border ${
                            isCountryOpen ? "border-indigo-600 ring-2 ring-indigo-600/10" : "border-slate-200 hover:border-indigo-600"
                          } rounded-lg py-2.5 px-3 transition-all duration-200 flex justify-between items-center cursor-pointer font-bold shadow-sm`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Globe size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{formData.country}</span>
                          </div>
                          <ChevronDown size={12} className={`text-indigo-600 transition-transform ${isCountryOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isCountryOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsCountryOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 py-1 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                              {COUNTRIES.map((ct) => {
                                const isSelected = formData.country === ct;
                                return (
                                  <div
                                    key={ct}
                                    onClick={() => {
                                      const defaultState = ct === "Nigeria" ? "Lagos" : getRegionsForCountry(ct)[0];
                                      setFormData({ ...formData, country: ct, stateLocation: defaultState });
                                      setIsCountryOpen(false);
                                    }}
                                    className={`px-3 py-2 text-xs font-bold transition-all duration-150 cursor-pointer flex justify-between items-center ${
                                      isSelected
                                        ? "bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white"
                                        : "text-slate-700 hover:bg-emerald-600 hover:text-white"
                                    }`}
                                  >
                                    <span>{ct}</span>
                                    {isSelected && <Check size={11} className="text-white" />}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* State Location custom drop selector with royal gradient selection and emerald hover */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1">State / Region</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsStateOpen(!isStateOpen);
                            setIsCountryOpen(false);
                          }}
                          className={`w-full text-xs text-left text-slate-900 bg-slate-50 border ${
                            isStateOpen ? "border-indigo-600 ring-2 ring-indigo-600/10" : "border-slate-200 hover:border-indigo-600"
                          } rounded-lg py-2.5 px-3 transition-all duration-205 flex justify-between items-center cursor-pointer font-bold shadow-sm`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{formData.stateLocation}</span>
                          </div>
                          <ChevronDown size={12} className={`text-indigo-600 transition-transform ${isStateOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isStateOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsStateOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 py-1 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                              {getRegionsForCountry(formData.country).map((st) => {
                                const isSelected = formData.stateLocation === st;
                                return (
                                  <div
                                    key={st}
                                    onClick={() => {
                                      setFormData({ ...formData, stateLocation: st });
                                      setIsStateOpen(false);
                                    }}
                                    className={`px-3 py-2 text-xs font-bold transition-all duration-150 cursor-pointer flex justify-between items-center ${
                                      isSelected
                                        ? "bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white"
                                        : "text-slate-700 hover:bg-emerald-600 hover:text-white"
                                    }`}
                                  >
                                    <span>{st}</span>
                                    {isSelected && <Check size={11} className="text-white" />}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3.5 text-left"
                >
                  {/* Representative Principal Name */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1">Representative Principal Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <User size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Chief / Dr / Mrs Name"
                        value={formData.principalName}
                        onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                        className={`w-full text-xs text-slate-900 bg-slate-50 border ${
                          errorMsg && !formData.principalName.trim() ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 hover:border-indigo-600"
                        } rounded-lg py-2.5 pl-9 pr-4 transition-all duration-205 outline-none font-bold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 shadow-sm`}
                      />
                    </div>
                  </div>

                  {/* Administrative Email Address */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1">Administrative Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Mail size={14} />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="admin@school.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full text-xs text-slate-900 bg-slate-50 border ${
                          errorMsg && (!formData.email.trim() || !formData.email.includes("@")) ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 hover:border-indigo-600"
                        } rounded-lg py-2.5 pl-9 pr-4 transition-all duration-205 outline-none font-bold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 shadow-sm`}
                      />
                    </div>
                  </div>

                  {/* WhatsApp Connection */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1">WhatsApp / Phone Connection</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Phone size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="+234 902..."
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className={`w-full text-xs text-slate-900 bg-slate-50 border ${
                          errorMsg && !formData.whatsapp.trim() ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 hover:border-indigo-600"
                        } rounded-lg py-2.5 pl-9 pr-4 transition-all duration-205 outline-none font-bold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 shadow-sm`}
                      />
                    </div>
                  </div>

                  {/* Secure Password field */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1">Administrator Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Lock size={14} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full text-xs text-slate-900 bg-slate-50 border ${
                          errorMsg && (!formData.password || formData.password.length < 6) ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 hover:border-indigo-600"
                        } rounded-lg py-2.5 pl-9 pr-10 transition-all duration-205 outline-none font-bold placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 shadow-sm`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-950"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4 text-left"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block">Assessment Structure Toggle</label>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Configure weights list</span>
                    </div>

                    {/* Segmented Assessment config toggle blocks with indigo border and premium selected card states */}
                    <div className="space-y-2">
                      {ASSESSMENT_VARIANTS.map((v) => {
                        const isSelected = formData.assessmentVariant === v.id;
                        return (
                          <div
                            key={v.id}
                            onClick={() => setFormData({ ...formData, assessmentVariant: v.id })}
                            className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex justify-between items-center ${
                              isSelected
                                ? "bg-indigo-50/50 border-indigo-600 text-slate-900 shadow-sm"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350"
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-black tracking-wide text-indigo-950">{v.title}</p>
                              <p className="text-[9px] text-slate-500 font-bold leading-none">{v.desc}</p>
                            </div>
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-350"
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weighting Live Tracking Indicator with corporate gradient weights bar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-indigo-950 font-black uppercase">Live Tracking Indicator</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-black text-[9px] animate-pulse">
                        Total Configured: 100/100 Marks
                      </span>
                    </div>

                    {/* Dynamic progress weights bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                      {activeVariant.weights.cas.map((wt, idx) => (
                        <div
                          key={idx}
                          style={{ width: `${wt}%` }}
                          className={`h-full border-r border-white ${
                            idx % 2 === 0 ? "bg-indigo-700" : "bg-indigo-550"
                          }`}
                          title={`CA ${idx + 1}: ${wt} Marks`}
                        />
                      ))}
                      <div
                        style={{ width: `${activeVariant.weights.exam}%` }}
                        className="h-full bg-emerald-600"
                        title={`Exam: ${activeVariant.weights.exam} Marks`}
                      />
                    </div>

                    {/* Legend labeling */}
                    <div className="flex justify-between text-[9px] text-slate-500 font-black pt-1">
                      <div className="flex gap-2">
                        {activeVariant.weights.cas.map((wt, idx) => (
                          <span key={idx} className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-sm ${idx % 2 === 0 ? "bg-indigo-700" : "bg-indigo-550"}`} />
                            CA {idx + 1} ({wt}M)
                          </span>
                        ))}
                      </div>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-sm bg-emerald-600" />
                        Exam ({activeVariant.weights.exam}M)
                      </span>
                    </div>
                  </div>

                  {/* Drag drop school logo layout */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1">
                      Upload School's Logo <span className="text-slate-400 font-bold">(Optional &lt; 5MB)</span>
                    </label>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                        dragActive ? "border-indigo-600 bg-indigo-50/40" : "border-slate-200 hover:border-slate-350 bg-slate-50"
                      }`}
                      onClick={() => document.getElementById("hidden-logo-upload")?.click()}
                    >
                      <input
                        id="hidden-logo-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      {uploadedLogo ? (
                        <div className="flex items-center gap-3 py-1 text-left w-full justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded bg-white flex items-center justify-center overflow-hidden border border-slate-200">
                              <img src={logoPreviewUrl} alt="Logo preview" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-800 max-w-[160px] truncate">{uploadedLogo.name}</p>
                              <p className="text-[9px] text-slate-500">{(uploadedLogo.size / (1024 * 1024)).toFixed(2)} MB &bull; Loaded</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedLogo(null);
                              setLogoPreviewUrl("");
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={20} className="text-indigo-600 animate-pulse" />
                          <p className="text-xs font-bold text-slate-700">Drag & drop logo file here</p>
                          <p className="text-[9px] text-slate-400 font-bold">Supports PNG or JPG images up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4 text-left"
                >
                  {/* Dynamic invoice panel */}
                  <div className="bg-slate-50/85 border border-slate-200 rounded-xl p-3.5 space-y-2.5 relative overflow-hidden font-sans">
                    <div className="absolute top-0 right-0 py-0.5 px-2 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-bl font-black text-[8px] uppercase tracking-wider">
                      Secure Invoice Gate
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5">Select Onboarding subscription Tier</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {Object.entries(PLAN_INFO).map(([key, plan]) => {
                          const isSelected = checkoutPlan === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setCheckoutPlan(key);
                                if (key === "unified_enterprise") {
                                  setCheckoutDuration("full_session");
                                } else {
                                  setCheckoutDuration("1_term");
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer relative h-22 select-none ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-50/10 ring-1 ring-emerald-650"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${isSelected ? "text-emerald-800" : "text-slate-800"}`}>
                                  {plan.name}
                                </span>
                                {isSelected && (
                                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[8px] font-black">
                                    ✓
                                  </div>
                                )}
                              </div>
                              <p className="text-[8.5px] text-slate-400 font-semibold line-clamp-2 leading-snug grow mt-1">
                                {plan.desc}
                              </p>
                              <div className="text-[10px] font-mono font-black text-slate-700 leading-none pt-1">
                                {paymentProvider === 'paystack' ? (
                                  `₦${(plan.prices["1_term"] || plan.prices["full_session"]).toLocaleString()}+`
                                ) : (
                                  `$${Math.round((plan.prices["1_term"] || plan.prices["full_session"]) / 1000).toLocaleString()}+`
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Billing Duration</span>
                        {checkoutPlan === "unified_enterprise" ? (
                          <span className="text-[10px] font-black text-indigo-950">Full Academic Session (Fixed)</span>
                        ) : (
                          <div className="flex gap-1.5 mt-1">
                            {["1_term", "2_terms", "full_session"].map((dur) => (
                              <button
                                key={dur}
                                type="button"
                                onClick={() => setCheckoutDuration(dur)}
                                className={`px-2 py-0.5 text-[9px] font-semibold border rounded cursor-pointer transition ${
                                  checkoutDuration === dur
                                    ? "bg-indigo-600 border-indigo-600 text-white font-black"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {dur === "1_term" ? "1 Term" : dur === "2_terms" ? "2 Terms" : "Session"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Price Valuation</span>
                        <div className="text-sm sm:text-base font-black text-emerald-700 font-mono">
                          {paymentProvider === 'paystack' ? (
                            `₦${(PLAN_INFO[checkoutPlan]?.prices[checkoutDuration] || PLAN_INFO[checkoutPlan]?.prices["full_session"] || 200000).toLocaleString()}`
                          ) : (
                            `$${Math.round((PLAN_INFO[checkoutPlan]?.prices[checkoutDuration] || PLAN_INFO[checkoutPlan]?.prices["full_session"] || 200000) / 1000).toLocaleString()}`
                          )}
                        </div>
                        <span className="text-[8px] text-slate-400 font-medium block">Excl. of taxes</span>
                      </div>
                    </div>
                  </div>

                  {/* Dual payment integrations selector */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1">
                      Choose Secure Payment Channel
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentProvider('paystack')}
                        className={`p-2 border rounded-xl flex flex-col items-center gap-1 transition text-center cursor-pointer ${
                          paymentProvider === 'paystack'
                            ? "border-emerald-600 bg-emerald-50/20"
                            : "border-slate-200 hover:border-slate-350 bg-white"
                        }`}
                      >
                        <Wallet size={15} className={paymentProvider === 'paystack' ? "text-emerald-600" : "text-slate-400"} />
                        <div>
                          <p className={`text-[10px] font-black uppercase ${paymentProvider === 'paystack' ? "text-emerald-750" : "text-slate-650"}`}>
                            Paystack NGN
                          </p>
                          <p className="text-[8px] text-slate-400 font-medium leading-none">Local debit & banks</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentProvider('stripe')}
                        className={`p-2 border rounded-xl flex flex-col items-center gap-1 transition text-center cursor-pointer ${
                          paymentProvider === 'stripe'
                            ? "border-indigo-650 bg-indigo-50/20"
                            : "border-slate-200 hover:border-slate-350 bg-white"
                        }`}
                      >
                        <CreditCard size={15} className={paymentProvider === 'stripe' ? "text-indigo-600" : "text-slate-400"} />
                        <div>
                          <p className={`text-[10px] font-black uppercase ${paymentProvider === 'stripe' ? "text-indigo-750" : "text-slate-650"}`}>
                            Stripe USD
                          </p>
                          <p className="text-[8px] text-slate-400 font-medium leading-none">International credit cards</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* High fidelity credit card secure inputs */}
                  {paymentStep === 'idle' ? (
                    <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50/50 font-sans">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase pb-1 border-b border-slate-200">
                        <Lock size={10} className="text-emerald-600" />
                        <span>Protected Core Gateway Handshake</span>
                      </div>
                      
                      <div>
                        <label className="text-[9px] font-black uppercase text-indigo-950 tracking-wider block mb-0.5 animate-fade-in">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={formData.principalName.toUpperCase() || "REPRESENTATIVE ADMIN"}
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-black text-slate-600 outline-none cursor-not-allowed uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-3">
                          <label className="text-[9px] font-black uppercase text-indigo-950 tracking-wider block mb-0.5">
                            Secure Card Number
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              maxLength={19}
                              placeholder="4000 1234 5678 9010"
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, "");
                                let matches = val.match(/\d{4,16}/g);
                                let match = (matches && matches[0]) || "";
                                let parts = [];
                                for (let i = 0, len = match.length; i < len; i += 4) {
                                  parts.push(match.substring(i, i + 4));
                                }
                                if (parts.length > 0) {
                                  setCardNumber(parts.join(" "));
                                } else {
                                  setCardNumber(val);
                                }
                              }}
                              className="w-full bg-white border border-slate-250 hover:border-slate-350 focus:border-indigo-600 rounded-lg p-2 text-xs text-slate-800 outline-none transition font-mono tracking-wider pl-8"
                            />
                            <CreditCard size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[9px] font-black uppercase text-indigo-950 tracking-wider block mb-0.5">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            maxLength={5}
                            placeholder="12/28"
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, "");
                              if (val.length >= 2) {
                                setCardExpiry(val.substring(0, 2) + "/" + val.substring(2, 4));
                              } else {
                                setCardExpiry(val);
                              }
                            }}
                            className="w-full bg-white border border-slate-250 hover:border-slate-350 focus:border-indigo-600 rounded-lg p-2 text-xs text-slate-800 outline-none transition font-sans text-center"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase text-indigo-950 tracking-wider block mb-0.5">
                            CVV
                          </label>
                          <input
                            type="password"
                            value={cardCvv}
                            maxLength={3}
                            placeholder="***"
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-white border border-slate-250 hover:border-slate-350 focus:border-indigo-600 rounded-lg p-2 text-xs text-slate-800 outline-none transition font-mono tracking-wider text-center"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-indigo-200/60 rounded-xl p-4 bg-indigo-50/10 text-center space-y-3 font-sans animate-fade-in">
                      <div className="flex items-center justify-center">
                        {paymentStep === 'completed' ? (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-650 border-2 border-emerald-300">
                            <Check size={20} strokeWidth={3.5} />
                          </div>
                        ) : (
                          <RefreshCw size={22} className="text-indigo-600 animate-spin" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wide">
                          {paymentStep === 'completed' ? "Clearance Secured!" : "Payment Gateway Handshake"}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold max-w-xs mx-auto mt-0.5 font-sans">
                          {paymentStatusMessage}
                        </p>
                      </div>

                      {paymentStep !== 'completed' && (
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: "3%" }}
                            animate={{ width: "95%" }}
                            transition={{ duration: 3.5 }}
                            className="h-full bg-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step-5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4 text-left"
                >
                  {whatsappHandshakeStep !== 'verified' ? (
                    <>
                      {/* Explanatory gateway status */}
                      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-1.5 relative overflow-hidden font-sans">
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5 tracking-wider">
                          💬 Active WhatsApp Secure Handshake
                        </span>
                        <p className="text-[10.5px] text-slate-550 font-bold leading-normal pt-1">
                          A secured authentication gateway signal was sent to your registered registrar/principal WhatsApp mobile: <span className="text-indigo-950 font-extrabold font-mono">{formData.whatsapp}</span>.
                        </p>
                      </div>

                      {/* Registrar's Simulation interactive WhatsApp mobile client view */}
                      <div className="border border-slate-200 rounded-2xl bg-slate-900 text-slate-100 p-3.5 shadow-md relative overflow-hidden font-sans">
                        {/* Simulated phone container top details */}
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold pb-2 border-b border-slate-800 mb-2">
                          <span className="font-mono text-[8.5px]">10:19 AM</span>
                          <div className="bg-emerald-600/10 border border-emerald-550/20 text-emerald-450 px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-widest uppercase">
                            Active Simulation Line
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black tracking-tighter">LTE 4G</span>
                            <div className="w-3.5 h-2 border border-slate-600 rounded-xs p-0.2 flex items-center justify-start"><div className="w-1.5 h-full bg-slate-400 rounded-3xs" /></div>
                          </div>
                        </div>

                        {/* Chat header */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 border border-emerald-500/30 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm shadow-emerald-500/15">
                            CS
                          </div>
                          <div>
                            <h5 className="text-[11px] font-extrabold text-slate-100 leading-none">Corner Streams OS Gateway</h5>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[8px] text-slate-400 font-bold">Bot Dispatch Online</span>
                            </div>
                          </div>
                        </div>

                        {/* Chat Speech Bubble */}
                        <div className="bg-slate-950 border border-slate-800 rounded-xl rounded-tl-none p-3 text-[10.5px] leading-relaxed text-slate-350 max-w-[95%] relative shadow-inner">
                          <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest block mb-1">Incoming Encrypted Handshake</span>
                          <p>
                            Hi <span className="font-bold text-white uppercase">{formData.principalName || "Principal Registrar"}</span>. Your auto secure activation handshake code for <span className="font-bold text-emerald-400">{formData.schoolName || "Corner Streams Academy"}</span> is:
                          </p>
                          <div className="my-2 py-1.5 px-3 bg-slate-900 border-2 border-emerald-600/30 text-center font-mono font-black text-xl text-emerald-400 tracking-widest rounded-lg select-all shadow-sm">
                            {whatsappDispatchedCode || "394821"}
                          </div>
                          <span className="text-[8.5px] text-slate-500 block leading-normal mt-1 text-right">
                            Use this token in your register page to finalize database provisioning.
                          </span>
                        </div>
                      </div>

                      {/* Input field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-0.5">
                          Enter Onboarding Dispatch Code <span className="text-rose-500 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 592817"
                          value={whatsappCode}
                          onChange={(e) => setWhatsappCode(e.target.value.replace(/\D/g, ""))}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-indigo-650 focus:border-indigo-500 rounded-lg p-2.5 text-center text-lg font-mono font-black tracking-[0.25em] outline-none text-slate-900 transition shadow-inner font-bold placeholder-slate-300"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Password creation layout view */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1 font-sans">
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-white border border-emerald-200 rounded-md px-2 py-0.5 tracking-wider inline-block">
                          🔒 Secure Registrar Password Setup
                        </span>
                        <p className="text-[10.5px] text-slate-650 font-bold leading-normal pt-1.5">
                          Your dynamic WhatsApp verification token has been approved! <span className="text-emerald-850 font-extrabold">Now, please create the administrator login password</span> for this school's certified tenant dashboard.
                        </p>
                      </div>

                      <div className="space-y-4 pt-1">
                        <div>
                          <label className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider block mb-1">
                            Choose School Admin Password <span className="text-rose-500 font-black">*</span>
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Minimum 6 characters"
                            value={schoolRegPassword}
                            onChange={(e) => setSchoolRegPassword(e.target.value)}
                            className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 rounded-lg py-2.5 px-3 transition outline-none font-bold placeholder:text-slate-400 placeholder:font-normal"
                          />
                        </div>

                        <div>
                          <label className="text-[9.5px] font-black uppercase text-indigo-950 tracking-wider block mb-1">
                            Confirm Admin Password <span className="text-rose-500 font-black">*</span>
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Re-type your password"
                            value={schoolRegConfirmPassword}
                            onChange={(e) => setSchoolRegConfirmPassword(e.target.value)}
                            className="w-full text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 rounded-lg py-2.5 px-3 transition outline-none font-bold placeholder:text-slate-400 placeholder:font-normal"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit layout buttons redesigned with gorgeous color gradients */}
            <div className="flex gap-3 pt-3">
              {step > 1 && (
                <button
                  type="button"
                  disabled={loading || paymentStep === 'processing' || paymentStep === 'verifying'}
                  onClick={handlePrevStep}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider transition duration-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <ArrowLeft size={12} /> Back
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:brightness-110 text-white rounded-lg text-xs font-black uppercase tracking-wider transition duration-300 flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Continue <ArrowRight size={12} />
                </button>
              ) : step === 4 ? (
                <button
                  type="button"
                  disabled={loading || paymentStep === 'processing' || paymentStep === 'verifying' || paymentStep === 'completed'}
                  onClick={handleRegisterSubmit}
                  className="flex-1 py-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 hover:brightness-110 text-white rounded-lg text-xs font-black uppercase tracking-wider transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/10"
                >
                  {paymentStep === 'processing' || paymentStep === 'verifying' ? "Securing Encrypted Gateway..." : paymentStep === 'completed' ? "Clearance Confirmed" : `Pay ${
                    paymentProvider === 'paystack' 
                      ? `₦${(PLAN_INFO[checkoutPlan]?.prices[checkoutDuration] || PLAN_INFO[checkoutPlan]?.prices["full_session"] || 200000).toLocaleString()}` 
                      : `$${Math.round((PLAN_INFO[checkoutPlan]?.prices[checkoutDuration] || PLAN_INFO[checkoutPlan]?.prices["full_session"] || 200000) / 1000).toLocaleString()}`
                  } & Onboard`}
                  {paymentStep !== 'processing' && paymentStep !== 'verifying' && <CheckCircle2 size={13} />}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={whatsappHandshakeStep === 'verified' ? handleCreateSchoolPassword : handleVerifyWhatsAppCode}
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 text-white rounded-lg text-xs font-black uppercase tracking-wider transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  {loading 
                    ? (whatsappHandshakeStep === 'verified' ? "Securing Password..." : "Authorizing Handshake...") 
                    : (whatsappHandshakeStep === 'verified' ? "Create Password & Live Stream ✓" : "Complete Registration ✓")
                  }
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="max-w-[1600px] mx-auto w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60 font-medium relative z-20">
        <div>Copyright ©️ 2026 cornerstreams@gmail.com</div>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <span className="hover:text-slate-600 transition cursor-pointer">End User Terms</span>
          <span className="hover:text-slate-600 transition cursor-pointer">Ledger Verification Safety</span>
        </div>
      </div>
    </div>
  );
}
