import React, { useState, useEffect, useMemo } from "react";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Users, Landmark, FileText, Megaphone, ShieldAlert, Check, 
  Trash, Save, Power, Network, ClipboardList, Info, HelpCircle,
  KeyRound, Lock, Unlock, Search, RefreshCw, AlertCircle, Eye, 
  Clock, Send, Smartphone, ShieldCheck, ChevronRight, UserCheck, 
  HelpCircle as HelpIcon, Coins, CalendarDays, ExternalLink, Activity,
  Settings, LogOut, CheckCircle2, X, MessageSquare, PhoneCall, BarChart3, Menu,
  UserPlus, Calendar, Shield, CreditCard, Sparkles, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import SettingsPanel from "@/components/SettingsPanel";

// Custom Dropdown matching the Corner Streams specialized UI guidelines
interface CustomDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  placeholder?: string;
  className?: string;
}

function CustomDropdown({ value, onChange, options, label, placeholder = "Select...", className = "" }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`}>
      {label && <span className="text-[10px] text-indigo-900 font-bold block mb-1 uppercase tracking-wider">{label}</span>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white text-xs font-semibold hover:border-emerald-600 transition-colors cursor-pointer focus:outline-none"
      >
        <span className={selectedOption ? "text-slate-800 font-semibold" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 max-h-56 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic">No options available</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-emerald-600 hover:text-white ${value === opt.value ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' : 'text-slate-700'}`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Generate secure random passwords
function generateSecurePassword(length = 10) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let password = "CS@";
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  return password;
}

export function SuperAdminDashboard({ 
  currentProfile, 
  onImpersonate,
  onLogout,
  theme,
  setTheme,
  activeFont,
  setActiveFont,
  isMobileMenuOpen: propIsMobileMenuOpen,
  setIsMobileMenuOpen: propSetIsMobileMenuOpen
}: { 
  currentProfile: any, 
  onImpersonate?: (profile: any) => void,
  onLogout?: () => void,
  theme?: string,
  setTheme?: (t: any) => void,
  activeFont?: string,
  setActiveFont?: (f: string) => void,
  isMobileMenuOpen?: boolean,
  setIsMobileMenuOpen?: (open: boolean) => void
}) {
  // Navigation: Schools, Users, Leads, Activation, Receipts, Messages, Analytics, Settings, Website Landing Page
  const [activeTab, setActiveTab] = useState<"schools" | "users" | "leads" | "activation" | "receipts" | "messages" | "analytics" | "settings" | "landing_page">("schools");
  const [localIsMobileMenuOpen, localSetIsMobileMenuOpen] = useState(false);
  const isMobileMenuOpen = propIsMobileMenuOpen !== undefined ? propIsMobileMenuOpen : localIsMobileMenuOpen;
  const setIsMobileMenuOpen = propSetIsMobileMenuOpen !== undefined ? propSetIsMobileMenuOpen : localSetIsMobileMenuOpen;
  const [logoutPromptOpen, setLogoutPromptOpen] = useState(false);

  // Core Data loaded from local storage safely to preserve dynamic context
  const [schools, setSchools] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [systemAdmins, setSystemAdmins] = useState<any[]>([]);

  // Selected School Detail modal state (Users Tab Grid Drilldown)
  const [selectedSchoolDetails, setSelectedSchoolDetails] = useState<any | null>(null);

  // Search & Filter pipelines
  const [schoolSearch, setSchoolSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [showOpenLeadsOnly, setShowOpenLeadsOnly] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState("");

  // Modals / Modifiers state
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: "",
    principal_name: "",
    email: "",
    phone: "",
    whatsapp_phone: "",
    subscription_tier: "unified_enterprise",
    classes_count: 8,
    students_count: 120,
    staff_count: 14
  });

  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  const [editSchoolDetails, setEditSchoolDetails] = useState<any | null>(null);

  // Announcement broad-caster console
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState("all");

  const loadData = () => {
    // 1. Schools
    const defaultSchool = {
      id: "sch-corner-1",
      name: "Corner Streams International Academy",
      principal_name: "Dr. David K. Macaulay",
      email: "principal@cornerstreams.edu",
      phone: "+234 814 188 0550",
      whatsapp_phone: "+2348141880550",
      subscription_tier: "unified_enterprise",
      subscription_duration: "full_session",
      subscription_expires_at: new Date(Date.now() + 210 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      verification_status: "active",
      verification_code: null,
      kill_switch: false,
      students_count: 245,
      staff_count: 18,
      classes_count: 12
    };

    const storedSchool = localStorage.getItem("CS_SCHOOL");
    let currentSchoolsList = [];
    if (storedSchool) {
      try {
        const parsed = JSON.parse(storedSchool);
        // Ensure counters exist
        parsed.students_count = parsed.students_count || 142;
        parsed.staff_count = parsed.staff_count || 11;
        parsed.classes_count = parsed.classes_count || (parsed.classes ? parsed.classes.length : 8);
        currentSchoolsList = [parsed];
      } catch (e) {
        currentSchoolsList = [defaultSchool];
      }
    } else {
      localStorage.setItem("CS_SCHOOL", JSON.stringify(defaultSchool));
      currentSchoolsList = [defaultSchool];
    }

    // Add extra mock school nodes to enrich the superadmin grid view
    const extraSchools = [
      {
        id: "sch-grace-2",
        name: "Grace Hill Secondary College",
        principal_name: "Mrs. Folasade Adebayo",
        email: "adebayo.folasade@gracehill.edu.ng",
        phone: "+234 803 112 3456",
        whatsapp_phone: "+2348031123456",
        subscription_tier: "digital_reports",
        subscription_duration: "1_term",
        subscription_expires_at: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        verification_status: "active",
        verification_code: null,
        kill_switch: false,
        students_count: 184,
        staff_count: 15,
        classes_count: 9
      },
      {
        id: "sch-kings-3",
        name: "Kingsway Bilingual Montessori",
        principal_name: "Chief Alao Benson",
        email: "benson.alao@kingsway.school",
        phone: "+234 812 777 8888",
        whatsapp_phone: "+2348127778888",
        subscription_tier: "financial_ledger",
        subscription_duration: "2_terms",
        subscription_expires_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // Expired
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        verification_status: "active",
        verification_code: null,
        kill_switch: true, // Auto-locked on expiry
        students_count: 96,
        staff_count: 8,
        classes_count: 6
      },
      {
        id: "sch-unregistered-4",
        name: "Lighthouse Christian Academy",
        principal_name: "Pastor Samuel Udofia",
        email: "udofia.sam@lighthouse.org",
        phone: "+234 905 555 4444",
        whatsapp_phone: "+2349055554444",
        subscription_tier: "cbt_essentials",
        subscription_duration: "1_term",
        subscription_expires_at: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        verification_status: "pending_payment",
        verification_code: "482931",
        kill_switch: false,
        students_count: 0,
        staff_count: 0,
        classes_count: 0
      }
    ];

    // Combine
    const mergedSchools = [...currentSchoolsList];
    extraSchools.forEach(extra => {
      if (!mergedSchools.some(s => s.id === extra.id)) {
        mergedSchools.push(extra);
      }
    });
    setSchools(mergedSchools);

    // 2. Leads - compiled from user requests + mock pipeline
    const defaultLeads = [
      {
        id: "lead-1",
        school: "Royal Springlands High",
        name: "Mr. Ebenezer Nwosu",
        email: "springlandshigh@outlook.com",
        phone: "+2348162234123",
        message: "Hello Corner Streams, we would like a demo of the CBT Exam Engine. We have about 450 students. Kindly reach out via WhatsApp.",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        resolved: false
      },
      {
        id: "lead-2",
        school: "Golden Crest Model School",
        name: "Hajia Fatima Yusuf",
        email: "goldencrestmodel@gmail.com",
        phone: "+2347039988112",
        message: "Can we configure multiple CA columns for primary and secondary sections separately? We are a mixed school.",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        resolved: false
      },
      {
        id: "lead-3",
        school: "Excel Heritage Academy",
        name: "Dr. Stephen Okafor",
        email: "okafor.stephen@excelheritage.edu.ng",
        phone: "+2348056677889",
        message: "Our bursar really loved the financial ledger demo. We are making our transfer today. Please verify once we upload.",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        resolved: true
      }
    ];
    
    const storedLeads = localStorage.getItem("CS_LEADS");
    if (storedLeads) {
      try {
        const parsed = JSON.parse(storedLeads);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLeads(parsed);
        } else {
          localStorage.setItem("CS_LEADS", JSON.stringify(defaultLeads));
          setLeads(defaultLeads);
        }
      } catch (e) {
        localStorage.setItem("CS_LEADS", JSON.stringify(defaultLeads));
        setLeads(defaultLeads);
      }
    } else {
      localStorage.setItem("CS_LEADS", JSON.stringify(defaultLeads));
      setLeads(defaultLeads);
    }

    // 3. Receipts & Active Sessions log
    const initialReceipts = [
      {
        id: "rec-1",
        school_name: "Corner Streams International Academy",
        tier: "unified_enterprise",
        duration: "full_session",
        amount_ngn: 200000,
        status: "approved",
        submitted_by: "principal@cornerstreams.edu",
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleString()
      },
      {
        id: "rec-2",
        school_name: "Grace Hill Secondary College",
        tier: "digital_reports",
        duration: "1_term",
        amount_ngn: 50000,
        status: "approved",
        submitted_by: "adebayo.folasade@gracehill.edu.ng",
        created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toLocaleString()
      },
      {
        id: "rec-3",
        school_name: "Kingsway Bilingual Montessori",
        tier: "financial_ledger",
        duration: "2_terms",
        amount_ngn: 70000,
        status: "approved",
        submitted_by: "benson.alao@kingsway.school",
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toLocaleString()
      },
      {
        id: "rec-4",
        school_name: "Lighthouse Christian Academy",
        tier: "cbt_essentials",
        duration: "1_term",
        amount_ngn: 40000,
        status: "pending",
        submitted_by: "udofia.sam@lighthouse.org",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleString()
      }
    ];
    setReceipts(initialReceipts);

    const liveSessions = [
      { user: "Mervyndean Hilary", role: "Super_Admin", ip: "102.89.44.18", campus: "Corner Streams Main Server", active_at: "Just now" },
      { user: "Dr. David K. Macaulay", role: "School_Admin", ip: "197.210.64.122", campus: "Corner Streams International Academy", active_at: "10 mins ago" },
      { user: "Mrs. Folasade Adebayo", role: "Class_Teacher", ip: "102.91.184.5", campus: "Grace Hill Secondary College", active_at: "45 mins ago" },
      { user: "Chief Alao Benson", role: "Parent", ip: "197.211.32.90", campus: "Kingsway Bilingual Montessori", active_at: "2 hours ago" }
    ];
    setActiveSessions(liveSessions);

    // 4. System Admins
    const defaultAdmins = [
      { name: "Mervyndean Hilary", email: "mervyn@cornernerstreams.com", added_at: "Platform Creator" },
      { name: "Global Tech Support", email: "support@cornerstreams.com", added_at: "Feb 10, 2026" }
    ];
    setSystemAdmins(defaultAdmins);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Onboard new school node
  const handleAddSchool = () => {
    if (!newSchool.name || !newSchool.principal_name || !newSchool.email) {
      toast.error("All institutional identifiers are required.");
      return;
    }

    const schoolId = "sch-" + Math.random().toString(36).substr(2, 5);
    const addedObj = {
      id: schoolId,
      name: newSchool.name,
      principal_name: newSchool.principal_name,
      email: newSchool.email,
      phone: newSchool.phone || "+234 814 188 0550",
      whatsapp_phone: newSchool.whatsapp_phone || "+2348141880550",
      subscription_tier: newSchool.subscription_tier,
      subscription_duration: "full_session",
      subscription_expires_at: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      verification_status: "active",
      verification_code: null,
      kill_switch: false,
      students_count: newSchool.students_count,
      staff_count: newSchool.staff_count,
      classes_count: newSchool.classes_count
    };

    const nextSchools = [addedObj, ...schools];
    setSchools(nextSchools);
    
    // Also update current active school context if matched
    localStorage.setItem("CS_SCHOOL", JSON.stringify(addedObj));
    toast.success(`Successfully registered & activated ${newSchool.name}!`);
    setAddSchoolOpen(false);
    setNewSchool({
      name: "",
      principal_name: "",
      email: "",
      phone: "",
      whatsapp_phone: "",
      subscription_tier: "unified_enterprise",
      classes_count: 8,
      students_count: 120,
      staff_count: 14
    });
  };

  // Modify individual school records (Settings / Grid Action)
  const handleSaveEditedSchool = () => {
    if (!editSchoolDetails) return;
    const nextSchools = schools.map(s => s.id === editSchoolDetails.id ? editSchoolDetails : s);
    setSchools(nextSchools);
    if (localStorage.getItem("CS_SCHOOL")) {
      const activeSch = JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}");
      if (activeSch.id === editSchoolDetails.id) {
        localStorage.setItem("CS_SCHOOL", JSON.stringify(editSchoolDetails));
      }
    }
    toast.success(`Updated details for ${editSchoolDetails.name}`);
    setEditSchoolDetails(null);
  };

  // Generate clean WhatsApp Activation Codes
  const handleGenerateActivationCode = (schoolId: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const updatedSchools = schools.map(s => {
      if (s.id === schoolId) {
        return { ...s, verification_code: code, verification_status: "pending_payment" };
      }
      return s;
    });
    setSchools(updatedSchools);
    toast.success(`Generated 6-digit WhatsApp password code: ${code}`);
  };

  // Set individual school verification status directly with buttons
  const handleSetVerificationStatus = (schoolId: string, status: "active" | "rejected") => {
    const updatedSchools = schools.map(s => {
      if (s.id === schoolId) {
        const updated = { 
          ...s, 
          verification_status: status,
          verification_code: status === "active" ? null : s.verification_code,
          kill_switch: status === "rejected"
        };
        if (s.id === "sch-corner-1") {
          localStorage.setItem("CS_SCHOOL", JSON.stringify(updated));
        }
        return updated;
      }
      return s;
    });
    setSchools(updatedSchools);
    toast.success(`Activation status modified to: ${status.toUpperCase()}`);
  };

  // Toggle school access kill switch
  const handleToggleSchoolLock = (schoolId: string, currentVal: boolean) => {
    const updatedSchools = schools.map(s => {
      if (s.id === schoolId) {
        const updated = { ...s, kill_switch: !currentVal };
        if (s.id === "sch-corner-1") {
          localStorage.setItem("CS_SCHOOL", JSON.stringify(updated));
        }
        return updated;
      }
      return s;
    });
    setSchools(updatedSchools);
    toast.warning(`System lock updated for that node.`);
  };

  // Add sub-admins
  const handleAddSystemAdmin = () => {
    if (!newAdmin.fullName || !newAdmin.email || !newAdmin.password) {
      toast.error("Please provide all administrator fields.");
      return;
    }
    const adminObj = {
      name: newAdmin.fullName,
      email: newAdmin.email,
      added_at: new Date().toLocaleDateString()
    };
    setSystemAdmins([...systemAdmins, adminObj]);
    toast.success(`Created system admin account for ${newAdmin.fullName}`);
    setAddAdminOpen(false);
    setNewAdmin({ fullName: "", email: "", password: "" });
  };

  // Handle lead states toggle (Inquiry Feed)
  const handleToggleLeadResolution = (leadId: string, currentVal: boolean) => {
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, resolved: !currentVal } : l);
    setLeads(updatedLeads);
    localStorage.setItem("CS_LEADS", JSON.stringify(updatedLeads));
    toast.success(currentVal ? "Lead marked open." : "Lead marked resolved!");
  };

  // Direct broadcast transmission simulation
  const handleTransmitBroadcast = () => {
    if (!announcementContent.trim()) {
      toast.error("Message content is empty.");
      return;
    }
    toast.success(`Broadcast successfully transmitted to all ${announcementTarget} feeds!`);
    setAnnouncementContent("");
  };

  // Filters
  const filteredSchoolsList = useMemo(() => {
    return schools.filter(s => (s.name || "").toLowerCase().includes((schoolSearch || "").toLowerCase()));
  }, [schools, schoolSearch]);

  const filteredLeadsList = useMemo(() => {
    return leads.filter(l => {
      const schoolName = l.school || "";
      const leadName = l.name || "";
      const matchesSearch = schoolName.toLowerCase().includes((leadSearch || "").toLowerCase()) || 
                            leadName.toLowerCase().includes((leadSearch || "").toLowerCase());
      const matchesOpen = !showOpenLeadsOnly || !l.resolved;
      return matchesSearch && matchesOpen;
    });
  }, [leads, leadSearch, showOpenLeadsOnly]);

  const filteredReceiptsList = useMemo(() => {
    return receipts.filter(r => (r.school_name || "").toLowerCase().includes((receiptSearch || "").toLowerCase()));
  }, [receipts, receiptSearch]);

  // Logouts verification trigger
  const confirmLogout = () => {
    setLogoutPromptOpen(false);
    toast.success("Signing out from master gate...");
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = "/";
      }
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden bg-slate-50 text-slate-800 font-sans" data-testid="superadmin-root">
      
      {/* MONTSERRAT DESIGN ACCENT SIDEBAR */}
      <aside className={`w-full lg:w-64 bg-indigo-950 text-white shrink-0 flex flex-col border-r border-indigo-900 shadow-xl ${isMobileMenuOpen ? 'flex h-auto' : 'hidden lg:flex lg:h-full'}`}>
        <div className="p-4 border-b border-indigo-900 hidden lg:flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-600 flex items-center justify-center shadow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <h2 className="font-extrabold text-xs tracking-wider uppercase text-emerald-400">CORNER STREAMS</h2>
            <p className="text-[10px] text-white/70 font-semibold">Master Suite Panel</p>
          </div>
        </div>

        {/* Dashboard Menu Buttons */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto max-h-[50vh] lg:max-h-none">
          {[
            { id: "schools", label: "Schools Grid", icon: Landmark, count: schools.length },
            { id: "users", label: "Users Drilldown", icon: Users, count: schools.reduce((acc, curr) => acc + (curr.students_count || 0), 0) },
            { id: "leads", label: "Landing Page Leads", icon: MessageSquare, count: leads.filter(l => !l.resolved).length },
            { id: "activation", label: "Activation Keys", icon: KeyRound, count: schools.filter(s => s.verification_status !== "active").length },
            { id: "receipts", label: "Active Receipts", icon: CreditCard, count: receipts.filter(r => r.status === "pending").length },
            { id: "messages", label: "System Messages", icon: Megaphone },
            { id: "analytics", label: "Metrics & Analytics", icon: BarChart3 },
            { id: "settings", label: "Security Settings", icon: Settings },
            { id: "landing_page", label: "Website Landing Page", icon: ExternalLink }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "landing_page") {
                    if (onLogout) {
                      onLogout();
                    } else {
                      window.location.href = "/";
                    }
                  } else {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false); // Auto-close on mobile selection
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${isActive ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white shadow-md' : 'text-indigo-200 hover:text-white hover:bg-white/5'}`}
                data-testid={`superadmin-nav-${item.id}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-indigo-300'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-indigo-900 text-emerald-300 font-extrabold' : 'bg-white/10 text-white'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Secure Logout Trigger button */}
        <div className="p-3 border-t border-indigo-900 shrink-0">
          <button 
            onClick={() => setLogoutPromptOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-950/40 transition-all cursor-pointer"
            data-testid="superadmin-logout-btn"
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* PRIMARY WORKSPACE */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-0">
        
        {/* TOP STATUS RIBBON */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 mb-6 gap-3">
          <div>
            <span className="text-[10px] text-indigo-700 font-black tracking-widest uppercase block">MASTER PORTAL SYSTEM</span>
            <h1 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight leading-none mt-1">
              {activeTab === "schools" && "Schools Directory"}
              {activeTab === "users" && "Users & Campus Drilldown"}
              {activeTab === "leads" && "Website Landing Page Leads"}
              {activeTab === "activation" && "WhatsApp Verification Codes"}
              {activeTab === "receipts" && "Receipts & Active Sessions"}
              {activeTab === "messages" && "Platform Broadcasting"}
              {activeTab === "analytics" && "Platform Metrics"}
              {activeTab === "settings" && "Platform Configuration"}
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 self-start sm:self-center shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-500 text-[11px] font-semibold">Active Server Context:</span>
            <span className="font-extrabold text-[11px] text-indigo-950">Mervyndean Hilary</span>
          </div>
        </div>

        {/* ==================== 1. SCHOOLS GRID VIEW ==================== */}
        {activeTab === "schools" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  placeholder="Filter registered schools by name..."
                  className="pl-9 h-10 text-xs"
                />
              </div>
              <Button 
                onClick={() => setAddSchoolOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 px-4 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Campus School
              </Button>
            </div>

            {/* School Campus Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSchoolsList.map((school) => {
                const isExpired = school.subscription_expires_at && new Date(school.subscription_expires_at) < new Date();
                const isActive = school.verification_status === "active";
                return (
                  <div 
                    key={school.id} 
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                  >
                    <div className="absolute right-0 top-0 opacity-10 translate-x-3 translate-y-3">
                      <Landmark className="w-24 h-24 text-indigo-900" />
                    </div>

                    <div className="space-y-3 relative">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                          {school.subscription_tier?.replace(/_/g, " ") || ""}
                        </span>
                        
                        {/* Operational active/inactive badge buttons */}
                        <div className="flex items-center gap-1.5">
                          {school.kill_switch ? (
                            <Badge className="bg-rose-500 text-white border-0 text-[9px] font-bold">LOCKED</Badge>
                          ) : (
                            <Badge className="bg-emerald-600 text-white border-0 text-[9px] font-bold">ACTIVE</Badge>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">{school.name}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Principal: {school.principal_name}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Students</span>
                          <span className="font-black text-slate-800 text-xs mt-0.5 block">{school.students_count}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Staffs</span>
                          <span className="font-black text-slate-800 text-xs mt-0.5 block">{school.staff_count}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Classes</span>
                          <span className="font-black text-slate-800 text-xs mt-0.5 block">{school.classes_count}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 flex items-center justify-between gap-3 text-[10px] text-slate-500 border-t border-slate-100">
                      <div>
                        <span className="font-bold text-slate-400 block uppercase text-[8px]">EXPIRY DATE</span>
                        <span className={`font-mono font-bold ${isExpired ? 'text-rose-600' : 'text-slate-700'}`}>
                          {school.subscription_expires_at ? new Date(school.subscription_expires_at).toLocaleDateString() : "No active subscription"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditSchoolDetails(school)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleSchoolLock(school.id, school.kill_switch)}
                          className={`px-2 py-1 rounded-lg font-bold text-white transition-colors cursor-pointer ${school.kill_switch ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'}`}
                        >
                          {school.kill_switch ? "Unlock" : "Lock"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== 2. USERS DRILLDOWN GRID ==================== */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 text-xs font-semibold text-indigo-900 leading-normal">
              💡 <span className="font-bold">Users Grid Drill-down</span>: Click on any school node below to launch the administrative inspector. You will be able to review specific students, staffs count, registration parameters, and full security metrics instantly.
            </div>

            {/* Grid of schools representing users datasets */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {schools.map((school) => {
                return (
                  <div 
                    key={school.id}
                    onClick={() => setSelectedSchoolDetails(school)}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {school.subscription_tier?.replace(/_/g, " ") || ""}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors leading-tight">{school.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Admin: {school.principal_name}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[8px] text-slate-400 block uppercase font-bold">TOTAL STUDENTS</span>
                        <span className="font-black text-indigo-950 mt-0.5 block">{school.students_count} Students</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[8px] text-slate-400 block uppercase font-bold">TOTAL STAFFS</span>
                        <span className="font-black text-indigo-950 mt-0.5 block">{school.staff_count} Staffs</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== 3. WEBSITE LANDING PAGE LEADS FEED ==================== */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 text-xs font-semibold text-indigo-900 leading-normal flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Website Landing Page Inquiries</span>: These leads are submitted directly by prospective school administrators via the website's landing page contact or demo request form. Read their inquiries, obtain their contact numbers, and follow up with them directly on WhatsApp.
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Filter inquiries by name or school..."
                  className="pl-9 h-10 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Show Open Only:</span>
                <Switch 
                  checked={showOpenLeadsOnly}
                  onCheckedChange={setShowOpenLeadsOnly}
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredLeadsList.map((lead) => {
                const whatsappUrl = `https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${lead.name}, this is Mervyndean from Corner Streams. We received your message regarding "${lead.school}" on our platform. Let me assist you with setting up your school's database!`)}`;
                return (
                  <div key={lead.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <span className="text-[9px] uppercase font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                          Prospect Inquiry
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight mt-1">{lead.school}</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Contact: {lead.name} · {lead.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                        <span className="text-[10px] text-slate-400 font-semibold">{lead.created_at}</span>
                        <button
                          onClick={() => handleToggleLeadResolution(lead.id, lead.resolved)}
                          className={`w-4 h-4 rounded-full flex items-center justify-center border cursor-pointer ${lead.resolved ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}
                        >
                          {lead.resolved && <Check className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    </div>

                    <p className="p-3 bg-slate-50 rounded-xl border text-[11px] text-slate-600 italic leading-relaxed">
                      "{lead.message}"
                    </p>

                    <div className="pt-2 flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">PHONE: {lead.phone}</span>
                      <a 
                        href={whatsappUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs h-8 px-4 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Send WhatsApp Message
                      </a>
                    </div>
                  </div>
                );
              })}
              {filteredLeadsList.length === 0 && (
                <div className="text-center py-12 text-slate-400 italic bg-white border border-slate-200 rounded-2xl">
                  No registered inquiry leads found in the current filter pipeline.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== 4. ACTIVATION KEYS QUEUE ==================== */}
        {activeTab === "activation" && (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 text-xs font-semibold text-indigo-900 leading-normal flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Pending Activation Records</span>: Review newly signed up institutional nodes awaiting payment verification and code provisioning. Send code directly via WhatsApp to the school admin to unlock their active clearance.
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>School & Admin Name</TableHead>
                      <TableHead>Contact Phone</TableHead>
                      <TableHead>Status Indicators</TableHead>
                      <TableHead>WhatsApp Code</TableHead>
                      <TableHead className="text-right">Action Controls</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => {
                      const isPending = school.verification_status !== "active";
                      return (
                        <TableRow key={school.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-bold text-slate-800">
                            <div>{school.name}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Admin: {school.principal_name}</div>
                          </TableCell>
                          <TableCell className="font-mono text-slate-500">{school.phone}</TableCell>
                          <TableCell>
                            {school.verification_status === "active" ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase">Activated</Badge>
                            ) : school.verification_status === "rejected" ? (
                              <Badge className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold uppercase">Rejected</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold uppercase animate-pulse">Pending Activation</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono font-extrabold text-indigo-600 text-sm">
                            {school.verification_code ? (
                              <span className="bg-indigo-50 px-2 py-1 rounded border font-black text-xs">{school.verification_code}</span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">No key active</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              {!school.verification_code && isPending && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px] border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                                  onClick={() => handleGenerateActivationCode(school.id)}
                                >
                                  Generate Code
                                </Button>
                              )}
                              {isPending ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-7 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
                                    onClick={() => handleSetVerificationStatus(school.id, "active")}
                                  >
                                    Activate
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] border-rose-200 text-rose-700 hover:bg-rose-50 font-bold"
                                    onClick={() => handleSetVerificationStatus(school.id, "rejected")}
                                  >
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <span className="text-slate-400 italic text-[10px] pr-2">Clearance active</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. RECEIPTS & ACTIVE SESSIONS ==================== */}
        {activeTab === "receipts" && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Payment receipts list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-display font-extrabold text-indigo-950 text-sm">Transfer Receipts Registry</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Nigerian bank transfer details uploaded by school administrators.</p>
                  </div>
                  <div className="relative w-44 shrink-0">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      value={receiptSearch}
                      onChange={(e) => setReceiptSearch(e.target.value)}
                      placeholder="Filter receipts..."
                      className="pl-8 h-8 text-[11px]"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>School</TableHead>
                        <TableHead>Tier & Duration</TableHead>
                        <TableHead className="text-right">Amount (₦)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceiptsList.map((r) => (
                        <TableRow key={r.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-bold text-slate-800">
                            <div>{r.school_name}</div>
                            <span className="text-[9px] text-slate-400 block font-mono">{r.created_at}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-[10px] font-bold text-indigo-600 block">{r.tier?.replace(/_/g, " ").toUpperCase() || ""}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">{r.duration?.replace(/_/g, " ") || ""}</span>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-700">
                            ₦{r.amount_ngn.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {r.status === "approved" ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold">Approved</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold animate-pulse">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Active real-time logins / Session tracking */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="font-display font-extrabold text-indigo-950 text-sm">Active login sessions</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Real-time audit monitoring of connected administrative actors.</p>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm space-y-3.5 max-h-[450px] overflow-y-auto">
                  {activeSessions.map((session, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {session.user.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-slate-800 text-xs truncate">{session.user}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold shrink-0">{session.active_at}</span>
                        </div>
                        <p className="text-[10px] text-indigo-600 font-semibold mt-1">{session.role?.replace(/_/g, " ") || ""}</p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{session.campus}</p>
                        <span className="text-[8px] font-mono text-slate-400 mt-1 block">IP Address: {session.ip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 6. PLATFORM BROADCASTING ==================== */}
        {activeTab === "messages" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="cs-card p-6 space-y-4">
              <div className="flex items-start gap-3.5 border-b border-slate-100 pb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-indigo-950 text-base">Platform Broadcast Console</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Publish alerts, system downtime notices, or business updates across every client dashboard.</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Target select using custom select */}
                <CustomDropdown
                  label="Target Audience Group"
                  value={announcementTarget}
                  onChange={setAnnouncementTarget}
                  options={[
                    { value: "all", label: "Universal (All Campus Networks)" },
                    { value: "admins", label: "School Principals & Admins Only" },
                    { value: "teachers", label: "Teachers Only" }
                  ]}
                />

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">Announcement Statement Message</Label>
                  <textarea
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="Write platform broadcast update directive..."
                    rows={5}
                    className="w-full rounded-xl border border-slate-200 p-3.5 text-xs bg-slate-50 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white leading-relaxed font-semibold"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
                    <span>Target: {announcementTarget.toUpperCase()}</span>
                    <span>Max: 1000 characters</span>
                  </div>
                </div>

                <Button
                  onClick={handleTransmitBroadcast}
                  disabled={!announcementContent.trim()}
                  className="w-full h-11 justify-center gap-2 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white hover:opacity-95 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Transmit Universal Broadcast
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 7. PLATFORM METRICS & ANALYTICS ==================== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            
            {/* Simple metrics summaries cards row */}
            <div className="grid sm:grid-cols-3 gap-5">
              <div className="bg-gradient-to-tr from-indigo-950 to-indigo-900 border border-indigo-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                  <Landmark className="w-24 h-24" />
                </div>
                <span className="text-[9px] font-extrabold text-emerald-400 block tracking-widest uppercase">ENTERPRISE LICENSE</span>
                <span className="text-2xl font-black block mt-1">2 Schools</span>
                <p className="text-[10px] text-indigo-200 mt-1">Running the Unified Enterprise suite with custom fee control matrices.</p>
              </div>

              <div className="bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                  <Users className="w-24 h-24" />
                </div>
                <span className="text-[9px] font-extrabold text-emerald-400 block tracking-widest uppercase">REPORTS SYSTEM</span>
                <span className="text-2xl font-black block mt-1">1 School</span>
                <p className="text-[10px] text-slate-300 mt-1 font-semibold">Running digital terminal reports with QR-verification systems.</p>
              </div>

              <div className="bg-gradient-to-tr from-indigo-900 to-emerald-950 border border-emerald-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                  <Activity className="w-24 h-24" />
                </div>
                <span className="text-[9px] font-extrabold text-emerald-400 block tracking-widest uppercase">ACTIVE RATIO</span>
                <span className="text-2xl font-black block mt-1">75.0%</span>
                <p className="text-[10px] text-emerald-200 mt-1">3 active school nodes out of 4 listed campus network databases.</p>
              </div>
            </div>

            {/* Custom SVG-based clean interactive bar reports */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-indigo-950 text-sm">Cross-School Registered Stream Volume</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Distribution count of client campuses on subscription tiers.</p>
              </div>

              {/* Custom graphical representation */}
              <div className="space-y-4 pt-2">
                {[
                  { name: "Unified Enterprise (Full Package)", count: 2, max: 4, pct: 50, color: "bg-indigo-600" },
                  { name: "Digital Reports (QR-Verified Cards)", count: 1, max: 4, pct: 25, color: "bg-emerald-600" },
                  { name: "Financial Ledger (Debt Blocks)", count: 1, max: 4, pct: 25, color: "bg-teal-500" },
                  { name: "CBT Essentials (Online Testing)", count: 0, max: 4, pct: 0, color: "bg-slate-300" }
                ].map((bar, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{bar.name}</span>
                      <span>{bar.count} Schools</span>
                    </div>
                    <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-150">
                      {bar.count > 0 && (
                        <div 
                          className={`h-full ${bar.color} rounded-full transition-all`} 
                          style={{ width: `${bar.pct}%` }} 
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 8. SECURITY SETTINGS ==================== */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Admins manager */}
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div>
                    <h3 className="font-display font-extrabold text-indigo-950 text-sm">Super Administrators Clearance</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Administrative personnel allowed full clearance over database triggers.</p>
                  </div>
                  <Button
                    onClick={() => setAddAdminOpen(true)}
                    className="bg-indigo-950 hover:bg-indigo-900 text-white font-extrabold text-xs h-8 px-3 rounded-lg flex items-center gap-1 shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Admin
                  </Button>
                </div>

                <div className="space-y-3">
                  {systemAdmins.map((admin, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                          {admin.name.charAt(0)}
                        </div>
                        <div className="min-w-0 leading-tight">
                          <span className="font-bold text-slate-800 text-xs block">{admin.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold block mt-0.5">{admin.email}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border">
                        {admin.added_at}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Administrative Quick Guidelines Panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-150 pb-3">
                  <h3 className="font-display font-extrabold text-indigo-950 text-sm">Help & Administrative Guide</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Assisting administrators of client campuses.</p>
                </div>

                <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed font-semibold">
                  <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl">
                    <span className="font-bold text-indigo-950 block">Password Override Safeguard</span>
                    <p className="mt-1">Use password override to recover access for locked teachers or principals. Avoid using ambiguous characters.</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl">
                    <span className="font-bold text-emerald-950 block">Safety Block Trigger (Kill Switch)</span>
                    <p className="mt-1">In cases of expired subscriptions or breach of system rules, flip the switch on the grid to blockade access.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Comprehensive settings system containing password updates, fonts, and full theme states */}
            <div className="border-t border-slate-200 pt-6">
              <SettingsPanel
                currentUserProfile={currentProfile}
                theme={(theme || "light") as any}
                setTheme={setTheme || (() => {})}
                activeFont={activeFont || "montserrat"}
                setActiveFont={setActiveFont || (() => {})}
              />
            </div>

          </div>
        )}

      </main>

      {/* ==================== OVERLAYS & MODALS ==================== */}

      {/* MODAL: EXCLUSIVE SECURE LOGOUT PROMPT */}
      <Dialog open={logoutPromptOpen} onOpenChange={setLogoutPromptOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5 text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Verify Master Signout Request
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs font-semibold leading-relaxed pt-1.5">
              You are signed in under the Corner Streams Master Superadmin clearance. Are you sure you wish to block your secure terminal context?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3 pt-3">
            <Button 
              variant="outline" 
              onClick={() => setLogoutPromptOpen(false)}
              className="w-full text-xs font-bold border-slate-200 hover:bg-slate-50 h-10 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmLogout}
              className="w-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white h-10 rounded-xl shadow-sm cursor-pointer"
            >
              Confirm Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DRILLDOWN SHOW DETAIL OF SELECTED SCHOOL */}
      <Dialog open={!!selectedSchoolDetails} onOpenChange={(o) => !o && setSelectedSchoolDetails(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-indigo-950 text-base tracking-tight">
              School Node Inspector Roster
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] font-semibold pt-0.5">
              Showing registration parameters and active users indicators.
            </DialogDescription>
          </DialogHeader>

          {selectedSchoolDetails && (
            <div className="space-y-4 pt-1.5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner space-y-2">
                <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-100/50 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedSchoolDetails.subscription_tier?.replace(/_/g, " ") || ""}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{selectedSchoolDetails.name}</h3>
                <p className="text-[10px] text-slate-500 font-semibold">📍 {selectedSchoolDetails.address || "Location parameter unregistered"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">Students Database</span>
                  <span className="font-black text-slate-800 text-sm mt-0.5 block">{selectedSchoolDetails.students_count} Students</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">Staffs Database</span>
                  <span className="font-black text-slate-800 text-sm mt-0.5 block">{selectedSchoolDetails.staff_count} Personnel</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">CLASSES ROSTER</span>
                  <span className="font-black text-slate-800 text-sm mt-0.5 block">{selectedSchoolDetails.classes_count} Classes</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">ACTIVATION DATE</span>
                  <span className="font-black text-slate-800 text-sm mt-0.5 block">
                    {new Date(selectedSchoolDetails.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-150 flex items-start gap-2 text-[10px] text-amber-800 font-semibold leading-relaxed">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Subscription Duration: <strong>{selectedSchoolDetails.subscription_duration?.replace(/_/g, " ").toUpperCase() || "FULL SESSION"}</strong>. Expiry set to <strong>{selectedSchoolDetails.subscription_expires_at ? new Date(selectedSchoolDetails.subscription_expires_at).toLocaleDateString() : "Never"}</strong>.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              onClick={() => setSelectedSchoolDetails(null)}
              className="bg-indigo-950 hover:bg-indigo-900 text-white font-extrabold text-xs h-10 w-full rounded-xl cursor-pointer"
            >
              Dismiss Inspector
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADD SCHOOL ONBOARD */}
      <Dialog open={addSchoolOpen} onOpenChange={setAddSchoolOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-indigo-950 text-base tracking-tight">
              Onboard Your School
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] font-semibold pt-0.5">
              Fill in your details to configure your school's database
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs pt-1">
            <div className="space-y-1">
              <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">School Name</Label>
              <Input
                value={newSchool.name}
                onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                placeholder="e.g. Corner Streams Academy"
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">Principal/Admin Full Name</Label>
              <Input
                value={newSchool.principal_name}
                onChange={(e) => setNewSchool({ ...newSchool, principal_name: e.target.value })}
                placeholder="e.g. Dr. David Macaulay"
                className="h-10 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">Email Address</Label>
                <Input
                  type="email"
                  value={newSchool.email}
                  onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                  placeholder="admin@school.com"
                  className="h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">Phone Number</Label>
                <Input
                  value={newSchool.phone}
                  onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
                  placeholder="+234 814..."
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <CustomDropdown
              label="Active Tier Package"
              value={newSchool.subscription_tier}
              onChange={(val) => setNewSchool({ ...newSchool, subscription_tier: val })}
              options={[
                { value: "unified_enterprise", label: "Unified Enterprise (Full Access)" },
                { value: "digital_reports", label: "Digital Reports (QR Cards)" },
                { value: "financial_ledger", label: "Financial Ledger" },
                { value: "cbt_essentials", label: "CBT Essentials (Exams)" }
              ]}
            />

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Students Count</Label>
                <Input
                  type="number"
                  value={newSchool.students_count}
                  onChange={(e) => setNewSchool({ ...newSchool, students_count: parseInt(e.target.value) || 0 })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Staffs Count</Label>
                <Input
                  type="number"
                  value={newSchool.staff_count}
                  onChange={(e) => setNewSchool({ ...newSchool, staff_count: parseInt(e.target.value) || 0 })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Classes Count</Label>
                <Input
                  type="number"
                  value={newSchool.classes_count}
                  onChange={(e) => setNewSchool({ ...newSchool, classes_count: parseInt(e.target.value) || 0 })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button 
              onClick={handleAddSchool}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-11 w-full rounded-xl cursor-pointer"
            >
              Verify & Provision Database Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT SCHOOL DETAILS */}
      <Dialog open={!!editSchoolDetails} onOpenChange={(o) => !o && setEditSchoolDetails(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-indigo-950 text-base tracking-tight">
              Edit School Node Parameters
            </DialogTitle>
          </DialogHeader>

          {editSchoolDetails && (
            <div className="space-y-3.5 pt-1.5 text-xs">
              <div className="space-y-1">
                <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">School Name</Label>
                <Input
                  value={editSchoolDetails.name}
                  onChange={(e) => setEditSchoolDetails({ ...editSchoolDetails, name: e.target.value })}
                  className="h-10 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">Principal/Admin Full Name</Label>
                <Input
                  value={editSchoolDetails.principal_name}
                  onChange={(e) => setEditSchoolDetails({ ...editSchoolDetails, principal_name: e.target.value })}
                  className="h-10 text-xs font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">Email Address</Label>
                  <Input
                    value={editSchoolDetails.email}
                    onChange={(e) => setEditSchoolDetails({ ...editSchoolDetails, email: e.target.value })}
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">Phone</Label>
                  <Input
                    value={editSchoolDetails.phone}
                    onChange={(e) => setEditSchoolDetails({ ...editSchoolDetails, phone: e.target.value })}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Students</Label>
                  <Input
                    type="number"
                    value={editSchoolDetails.students_count || 0}
                    onChange={(e) => setEditSchoolDetails({ ...editSchoolDetails, students_count: parseInt(e.target.value) || 0 })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Staffs</Label>
                  <Input
                    type="number"
                    value={editSchoolDetails.staff_count || 0}
                    onChange={(e) => setEditSchoolDetails({ ...editSchoolDetails, staff_count: parseInt(e.target.value) || 0 })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Classes</Label>
                  <Input
                    type="number"
                    value={editSchoolDetails.classes_count || 0}
                    onChange={(e) => setEditSchoolDetails({ ...editSchoolDetails, classes_count: parseInt(e.target.value) || 0 })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3">
            <Button 
              onClick={handleSaveEditedSchool}
              className="bg-indigo-950 hover:bg-indigo-900 text-white font-extrabold text-xs h-11 w-full rounded-xl cursor-pointer"
            >
              Commit Edited School Parameters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADD SUPERADMIN ACCOUNTS */}
      <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-indigo-950 text-base tracking-tight">
              Provision Platform Administrator
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1.5 text-xs">
            <div className="space-y-1">
              <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">Administrator Full Name</Label>
              <Input
                value={newAdmin.fullName}
                onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                placeholder="e.g. Sarah Okafor"
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">Email Credentials</Label>
              <Input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="sarah@cornerstreams.com"
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-indigo-900 font-bold block uppercase tracking-wider">Override Password</Label>
              <div className="flex gap-2">
                <Input
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="Set safe password..."
                  className="h-10 text-xs font-semibold"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewAdmin({ ...newAdmin, password: generateSecurePassword() })}
                  className="h-10 text-[10px] font-bold border-slate-200"
                >
                  Auto
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button 
              onClick={handleAddSystemAdmin}
              className="bg-indigo-950 hover:bg-indigo-900 text-white font-extrabold text-xs h-10 w-full rounded-xl cursor-pointer"
            >
              Launch Admin Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default SuperAdminDashboard;
