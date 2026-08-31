import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, UserRole } from '../types';
import InteractivePlanComparisonModal from './InteractivePlanComparisonModal';
import { 
  Send, 
  Paperclip, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Megaphone, 
  BookOpen, 
  Clipboard,
  Bell,
  Check,
  User,
  Shield,
  Download,
  AlertCircle,
  Users,
  Search,
  ChevronDown,
  Filter,
  UserCheck,
  X,
  CheckSquare,
  Square,
  Info,
  Layers,
  Sparkles,
  MessageSquare,
  Zap
} from 'lucide-react';

interface CommunicationHubProps {
  currentProfile: UserProfile;
}

interface RecipientItem {
  key: string;
  id: string;
  name: string;
  subtext: string;
  type: 'student' | 'parent';
  class_name: string;
  parent_name?: string;
  parent_email?: string;
  student_id?: string;
}

interface MessageType {
  id: string;
  sender_id: string;
  sender_role: string;
  sender_name?: string;
  school_id: string | null;
  target_role: string;
  target_class: string | null;
  target_school_id: string | null;
  message_type: 'announcement' | 'material' | 'assignment';
  content: string;
  attachment_url: string | null;
  created_at: string;
  read_by: string[];
  unread?: boolean;
  target_recipients?: {
    id: string;
    name: string;
    type: 'student' | 'parent';
    class_name?: string;
    subtext?: string;
  }[];
}

interface StudentRecord {
  id: string;
  name: string;
  class_name: string;
  login_email?: string;
  parent_name?: string;
  parent_email?: string;
  parent_id?: string;
}

const DEFAULT_STUDENTS: StudentRecord[] = [
  { id: "CS-8201", name: "Chinedu Okeke", class_name: "Primary 5", login_email: "c.okeke@cornerstreams.edu", parent_name: "Mr. & Mrs. Okeke", parent_email: "okeke.family@gmail.com", parent_id: "p-8201" },
  { id: "CS-8202", name: "Amina Yusuf", class_name: "Primary 5", login_email: "a.yusuf@cornerstreams.edu", parent_name: "Alhaji Bello Yusuf", parent_email: "bello.yusuf@yahoo.com", parent_id: "p-8202" },
  { id: "CS-8203", name: "Emeka Adebayo", class_name: "Primary 5", login_email: "e.adebayo@cornerstreams.edu", parent_name: "Dr. & Dr. Adebayo", parent_email: "adebayo.clinic@hotmail.com", parent_id: "p-8203" },
  { id: "CS-8204", name: "Fatima Danjuma", class_name: "Primary 4", login_email: "f.danjuma@cornerstreams.edu", parent_name: "Hajiya Danjuma", parent_email: "fatima.p@danjuma.ng", parent_id: "p-8204" },
  { id: "CS-8205", name: "Kelechi Nnamdi", class_name: "Primary 4", login_email: "k.nnamdi@cornerstreams.edu", parent_name: "Chief Nnamdi", parent_email: "nnamdi.holdings@gmail.com", parent_id: "p-8205" },
  { id: "CS-8206", name: "Blessing Eze", class_name: "Secondary 1", login_email: "b.eze@cornerstreams.edu", parent_name: "Engr. Timothy Eze", parent_email: "tim.eze@construction.ng", parent_id: "p-8206" },
  { id: "CS-8207", name: "Tunde Bakare", class_name: "Secondary 2", login_email: "t.bakare@cornerstreams.edu", parent_name: "Barrister Bakare", parent_email: "bakare.chambers@law.ng", parent_id: "p-8207" },
  { id: "CS-8208", name: "Zainab Ibrahim", class_name: "Secondary 2", login_email: "z.ibrahim@cornerstreams.edu", parent_name: "Mrs. Halima Ibrahim", parent_email: "halima.i@gmail.com", parent_id: "p-8208" },
  { id: "CS-8209", name: "David Ojo", class_name: "Nursery 2", login_email: "d.ojo@cornerstreams.edu", parent_name: "Mr. Samuel Ojo", parent_email: "sojo@techcorp.io", parent_id: "p-8209" },
  { id: "CS-8210", name: "Chisom Igwe", class_name: "Creche", login_email: "c.igwe@cornerstreams.edu", parent_name: "Dr. Mrs. Igwe", parent_email: "chisom.mom@gmail.com", parent_id: "p-8210" }
];

const AVAILABLE_CLASSES = [
  'All Classes',
  'Creche',
  'Nursery 1',
  'Nursery 2',
  'Montessori Toddlers',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Secondary 1',
  'Secondary 2',
  'Secondary 3'
];

export default function CommunicationHub({ currentProfile }: CommunicationHubProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Message Form State
  const [messageType, setMessageType] = useState<'announcement' | 'material' | 'assignment'>('announcement');
  const [targetRole, setTargetRole] = useState<string>('all');
  const [targetClass, setTargetClass] = useState<string>('');
  const [messageContent, setMessageContent] = useState<string>('');
  
  // Bulk Selection States
  const [students, setStudents] = useState<StudentRecord[]>(DEFAULT_STUDENTS);
  const [dispatchScope, setDispatchScope] = useState<'class_broadcast' | 'bulk_individual'>('class_broadcast');
  const [bulkTargetRole, setBulkTargetRole] = useState<'students' | 'parents' | 'both'>('both');
  const [recipientSearch, setRecipientSearch] = useState<string>('');
  const [selectedRecipientKeys, setSelectedRecipientKeys] = useState<string[]>([]);
  
  // Custom Select Dropdown toggles per AGENTS.md rules
  const [isAudienceOpen, setIsAudienceOpen] = useState<boolean>(false);
  const [isClassOpen, setIsClassOpen] = useState<boolean>(false);
  const [isBulkRoleOpen, setIsBulkRoleOpen] = useState<boolean>(false);

  // Modal State for Viewing Target Recipients List on Feed
  const [viewingRecipients, setViewingRecipients] = useState<{
    sender_name?: string;
    message_type: string;
    recipients: { id: string; name: string; type: 'student' | 'parent'; class_name?: string; subtext?: string }[];
  } | null>(null);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentProfile.role === 'Super_Admin' || currentProfile.role === 'School_Admin';
  const isTeacher = currentProfile.role === 'Class_Teacher' || currentProfile.role === 'Non_Class_Teacher';
  const isStudent = currentProfile.role === 'Student';
  const isParent = currentProfile.role === 'Parent';
  const isComposer = true; // All 5 roles can compose & send messages

  // Feed filtering & search states
  const [feedSearchQuery, setFeedSearchQuery] = useState<string>('');
  const [feedFilterTab, setFeedFilterTab] = useState<'all' | 'direct' | 'announcement' | 'material' | 'assignment' | 'unread'>('all');
  const [isPlanComparisonOpen, setIsPlanComparisonOpen] = useState<boolean>(false);

  // Load student records from API or local cache
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.students) && data.students.length > 0) {
          setStudents(data.students);
          return;
        }
      }
      // Check local storage fallback
      const saved = localStorage.getItem("CS_STUDENTS");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStudents(parsed);
          return;
        }
      }
    } catch (e) {
      // Keep DEFAULT_STUDENTS seed
    }
  };

  // Set default form targets based on role
  useEffect(() => {
    if (currentProfile.role === 'School_Admin') {
      setTargetRole('admin');
    } else {
      setTargetRole('all');
    }
  }, [currentProfile.role]);

  // Read message stream on mount and role change
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Poll stream every 10 seconds
    return () => clearInterval(interval);
  }, [currentProfile]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/messages/my-stream');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setUnreadCount(data.unread_count || 0);
        setApiError(null);
      } else {
        loadSimulatedMessages();
      }
    } catch (e) {
      loadSimulatedMessages();
    } finally {
      setIsLoading(false);
    }
  };

  const loadSimulatedMessages = () => {
    const saved = localStorage.getItem('CS_SIMULATED_MESSAGES');
    let msgList: MessageType[] = [];
    if (saved) {
      msgList = JSON.parse(saved);
    } else {
      msgList = [
        {
          id: 'msg-seed-1',
          sender_id: 'admin-1',
          sender_role: 'School_Admin',
          sender_name: 'Principal Alao',
          school_id: 'primary',
          target_role: 'all',
          target_class: null,
          target_school_id: null,
          message_type: 'announcement',
          content: 'The Terminal CBT Examination timetable has been finalized and uploaded. Parents, please ensure tuition collection clearances are verified with central registrar under Financials.',
          attachment_url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          read_by: []
        },
        {
          id: 'msg-seed-2',
          sender_id: 'teacher-2',
          sender_role: 'Class_Teacher',
          sender_name: 'Mr. Kelechi (Primary 5B)',
          school_id: 'primary',
          target_role: 'parents',
          target_class: 'Primary 5',
          target_school_id: null,
          message_type: 'material',
          content: 'Reading comprehension slides for active school syllabus on automated irrigation and crop engineering topics attached. Parents, please supervise reviews.',
          attachment_url: '/uploads/syllabus_sample.pdf',
          created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          read_by: [],
          target_recipients: [
            { id: "p-8201", name: "Mr. & Mrs. Okeke", type: "parent", class_name: "Primary 5", subtext: "Parent of Chinedu Okeke" },
            { id: "p-8202", name: "Alhaji Bello Yusuf", type: "parent", class_name: "Primary 5", subtext: "Parent of Amina Yusuf" },
            { id: "p-8203", name: "Dr. & Dr. Adebayo", type: "parent", class_name: "Primary 5", subtext: "Parent of Emeka Adebayo" }
          ]
        },
        {
          id: 'msg-seed-3',
          sender_id: 'teacher-3',
          sender_role: 'Class_Teacher',
          sender_name: 'Ms. Ngozi',
          school_id: 'secondary',
          target_role: 'students',
          target_class: 'Secondary 2',
          target_school_id: null,
          message_type: 'assignment',
          content: 'Submit the computer coding fundamentals assignment before Tuesday midnight. Upload final python file or text outputs inside the portal.',
          attachment_url: null,
          created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
          read_by: ['active-user-1']
        }
      ];
      localStorage.setItem('CS_SIMULATED_MESSAGES', JSON.stringify(msgList));
    }

    const filtered = msgList.filter(msg => {
      // 1. Always show sent messages by current user
      if (msg.sender_id === currentProfile.id) return true;

      // 2. Super_Admin & School_Admin see all
      if (currentProfile.role === 'Super_Admin' || currentProfile.role === 'School_Admin') {
        return true;
      }

      // 3. Direct recipient check
      if (msg.target_recipients && Array.isArray(msg.target_recipients)) {
        const matched = msg.target_recipients.some((r: any) => 
          r.id === currentProfile.id || 
          r.id === `st-${currentProfile.id}` || 
          r.id === `pr-${currentProfile.id}` ||
          (r.name && r.name.toLowerCase().includes(currentProfile.fullName.toLowerCase()))
        );
        if (matched) return true;
      }

      const role = currentProfile.role;
      const target = msg.target_role;

      if (target === 'all') return true;
      if (role === 'Class_Teacher' || role === 'Non_Class_Teacher') {
        return target === 'teachers' || target === 'admin' || target === 'both';
      }
      if (role === 'Student') {
        if (target !== 'students' && target !== 'both') return false;
        if (msg.target_class && currentProfile.gradeLevel && currentProfile.gradeLevel.toLowerCase() !== msg.target_class.toLowerCase()) {
          return false;
        }
        return true;
      }
      if (role === 'Parent') {
        return target === 'parents' || target === 'both' || target === 'admin';
      }

      return false;
    });

    const user_id = currentProfile.id;
    const finalDocs = filtered.map(d => ({
      ...d,
      unread: !d.read_by.includes(user_id)
    }));

    setMessages(finalDocs);
    setUnreadCount(finalDocs.filter(d => d.unread).length);
  };

  const markAllAsRead = () => {
    const user_id = currentProfile.id;
    setMessages(prev => prev.map(m => ({
      ...m,
      unread: false,
      read_by: m.read_by.includes(user_id) ? m.read_by : [...m.read_by, user_id]
    })));
    setUnreadCount(0);

    const saved = localStorage.getItem('CS_SIMULATED_MESSAGES');
    if (saved) {
      const list: MessageType[] = JSON.parse(saved);
      const updated = list.map(m => ({
        ...m,
        read_by: m.read_by.includes(user_id) ? m.read_by : [...m.read_by, user_id]
      }));
      localStorage.setItem('CS_SIMULATED_MESSAGES', JSON.stringify(updated));
    }
  };

  const markAsRead = async (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, unread: false, read_by: [...m.read_by, currentProfile.id] } : m));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch(`/api/messages/${messageId}/read`, { method: 'POST' });
    } catch (e) {
      const saved = localStorage.getItem('CS_SIMULATED_MESSAGES');
      if (saved) {
        const list: MessageType[] = JSON.parse(saved);
        const updated = list.map(m => {
          if (m.id === messageId && !m.read_by.includes(currentProfile.id)) {
            return { ...m, read_by: [...m.read_by, currentProfile.id] };
          }
          return m;
        });
        localStorage.setItem('CS_SIMULATED_MESSAGES', JSON.stringify(updated));
      }
    }
  };

  // Derive all recipient items filtered by active class and search query
  const allAvailableRecipientItems = useMemo<RecipientItem[]>(() => {
    const list: RecipientItem[] = [];

    // Filter students by active class filter
    const classFilteredStudents = students.filter(st => {
      if (!targetClass || targetClass === 'All Classes') return true;
      return st.class_name?.toLowerCase() === targetClass.toLowerCase();
    });

    classFilteredStudents.forEach(st => {
      // Include student entry
      if (bulkTargetRole === 'students' || bulkTargetRole === 'both') {
        list.push({
          key: `st-${st.id}`,
          id: st.id,
          name: st.name,
          subtext: `${st.class_name} • Student ID #${st.id}`,
          type: 'student',
          class_name: st.class_name,
          student_id: st.id
        });
      }

      // Include parent entry if parent details exist
      if (bulkTargetRole === 'parents' || bulkTargetRole === 'both') {
        const pName = st.parent_name || `Parent of ${st.name}`;
        const pEmail = st.parent_email || `parent.${st.id.toLowerCase()}@cornerstreams.edu`;
        list.push({
          key: `pr-${st.id}`,
          id: st.parent_id || `pr-${st.id}`,
          name: pName,
          subtext: `Parent of ${st.name} (${st.class_name}) • ${pEmail}`,
          type: 'parent',
          class_name: st.class_name,
          parent_name: pName,
          parent_email: pEmail
        });
      }
    });

    return list;
  }, [students, targetClass, bulkTargetRole]);

  // Filter recipient items by search query
  const searchedRecipientItems = useMemo(() => {
    if (!recipientSearch.trim()) return allAvailableRecipientItems;
    const q = recipientSearch.toLowerCase();
    return allAvailableRecipientItems.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.subtext.toLowerCase().includes(q) ||
      item.class_name.toLowerCase().includes(q)
    );
  }, [allAvailableRecipientItems, recipientSearch]);

  // Select / Deselect All Handlers
  const handleSelectAllFiltered = () => {
    const filteredKeys = searchedRecipientItems.map(item => item.key);
    setSelectedRecipientKeys(prev => Array.from(new Set([...prev, ...filteredKeys])));
  };

  const handleDeselectAllFiltered = () => {
    const filteredKeys = new Set(searchedRecipientItems.map(item => item.key));
    setSelectedRecipientKeys(prev => prev.filter(k => !filteredKeys.has(k)));
  };

  const toggleRecipientKey = (key: string) => {
    setSelectedRecipientKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Drag over handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    setSelectedFile(file);
    setUploading(true);
    setUploadError(null);
    setAttachmentUrl(null);

    if (file.size > MAX_SIZE) {
      setUploadError("File size exceeds maximum limit of 5MB. Please choose a smaller attachment.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachmentUrl(data.url);
        setUploadError(null);
      } else if (res.status === 413) {
        setUploadError("File size exceeds maximum limit of 5MB server checks.");
      } else {
        const errData = await res.json().catch(() => ({ detail: 'Upload failed' }));
        setUploadError(errData.detail || "An unexpected error occurred during network transmission.");
      }
    } catch (e) {
      setTimeout(() => {
        const fakeUrl = URL.createObjectURL(file);
        setAttachmentUrl(fakeUrl);
        setUploading(false);
      }, 1200);
      return;
    }

    setUploading(false);
  };

  const triggerSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    // Prepare targeted bulk recipients metadata if bulk_individual is active
    let targetRecipientsPayload: any[] | undefined = undefined;
    if (dispatchScope === 'bulk_individual' && selectedRecipientKeys.length > 0) {
      targetRecipientsPayload = allAvailableRecipientItems
        .filter(item => selectedRecipientKeys.includes(item.key))
        .map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          class_name: item.class_name,
          subtext: item.subtext
        }));
    }

    const payload = {
      target_role: dispatchScope === 'bulk_individual' 
        ? (bulkTargetRole === 'both' ? 'students & parents' : bulkTargetRole) 
        : targetRole,
      target_class: targetClass && targetClass !== 'All Classes' ? targetClass : null,
      target_school_id: currentProfile.role === 'Super_Admin' ? null : (currentProfile.arm || null),
      message_type: messageType,
      content: messageContent,
      attachment_url: attachmentUrl,
      target_recipients: targetRecipientsPayload
    };

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessageContent('');
        setSelectedFile(null);
        setAttachmentUrl(null);
        setSelectedRecipientKeys([]);
        fetchMessages();
      } else {
        submitOfflineFallback(payload);
      }
    } catch (err) {
      submitOfflineFallback(payload);
    }
  };

  const submitOfflineFallback = (payload: any) => {
    const listSaved = localStorage.getItem('CS_SIMULATED_MESSAGES');
    const msgList: MessageType[] = listSaved ? JSON.parse(listSaved) : [];
    
    const newMsg: MessageType = {
      id: `msg-custom-${Date.now()}`,
      sender_id: currentProfile.id,
      sender_role: currentProfile.role,
      sender_name: currentProfile.fullName,
      school_id: currentProfile.arm || null,
      target_role: payload.target_role,
      target_class: payload.target_class,
      target_school_id: payload.target_school_id,
      message_type: payload.message_type,
      content: payload.content,
      attachment_url: payload.attachment_url,
      created_at: new Date().toISOString(),
      read_by: [currentProfile.id],
      target_recipients: payload.target_recipients
    };

    const updatedList = [newMsg, ...msgList];
    localStorage.setItem('CS_SIMULATED_MESSAGES', JSON.stringify(updatedList));

    // Dispatch System Notification for notification bell & top header badges
    try {
      const notifTargetRole = payload.target_role === 'all' ? 'all' : 
                              payload.target_role === 'teachers' ? 'Class_Teacher' :
                              payload.target_role === 'students' ? 'Student' :
                              payload.target_role === 'parents' ? 'Parent' : 'all';
      
      const newNotif = {
        id: `notif-msg-${Date.now()}`,
        title: `New ${payload.message_type.toUpperCase()} from ${currentProfile.fullName}`,
        message: payload.content.slice(0, 100) + (payload.content.length > 100 ? '...' : ''),
        category: 'system',
        createdAt: new Date().toISOString(),
        isRead: false,
        targetRole: notifTargetRole,
        actionTab: 'messages'
      };

      const existingNotifs = JSON.parse(localStorage.getItem('CS_NOTIFICATIONS') || '[]');
      localStorage.setItem('CS_NOTIFICATIONS', JSON.stringify([newNotif, ...existingNotifs]));
    } catch (e) {
      console.error("Failed to store notification alert", e);
    }
    
    setMessageContent('');
    setSelectedFile(null);
    setAttachmentUrl(null);
    setSelectedRecipientKeys([]);
    fetchMessages();
  };

  const removeAttachment = () => {
    setSelectedFile(null);
    setAttachmentUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Label helpers for custom selects
  const audienceOptions = [
    ...(!isTeacher ? [{ value: 'all', label: 'All School Roles' }] : []),
    { value: 'parents', label: 'Parents Only' },
    { value: 'students', label: 'Students Only' },
    { value: 'teachers', label: 'Teachers Only' },
    ...(isAdmin ? [{ value: 'admin', label: 'Administrators Only' }] : [])
  ];

  const getAudienceLabel = (val: string) => {
    const match = audienceOptions.find(o => o.value === val);
    return match ? match.label : val;
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden" id="cs-communication-hub-workspace">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>Communication & Resource Hub</span>
              <span className="px-2 py-0.5 text-[9px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md">
                5-Role Messaging Active
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Instant school broadcasts, direct teacher-parent-student chats & lesson materials.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] font-extrabold rounded-lg transition cursor-pointer flex items-center gap-1"
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              Mark All as Read
            </button>
          )}
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            {unreadCount} Unread Messages
          </span>
        </div>
      </div>

      {/* WHATSAPP & SMS NOTIFICATION QUOTA SOFT NUDGE BANNER */}
      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-3 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                WhatsApp API Broadcast Channel Quota
              </span>
              <span className="text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 rounded">
                Tier 1 &bull; 500 Free SMS/mo
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono">
              420 / 500 monthly WhatsApp &amp; SMS alerts used <strong className="text-amber-300">(84% capacity reached)</strong>. Top up or upgrade plan for unlimited broadcasts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPlanComparisonOpen(true)}
          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-indigo-500 hover:opacity-95 text-white font-mono font-extrabold text-[10.5px] uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Top Up / Upgrade Quota</span>
        </button>
      </div>

      {/* PLAN COMPARISON MODAL */}
      <InteractivePlanComparisonModal
        isOpen={isPlanComparisonOpen}
        onClose={() => setIsPlanComparisonOpen(false)}
      />

      {/* DETAILED SPLIT WORKSPACE PANEL */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        
        {/* COMPOSER CARD (LEFT COLUMN - Visible to admins and teachers) */}
        {isComposer && (
          <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 bg-indigo-950 text-white border-b border-indigo-900 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider">Message Broadcaster</span>
              </div>
              <span className="text-[9px] text-[#9cbfee] font-mono leading-none">STREAM RECEPTACLE ACTIVE</span>
            </div>
            
            <form onSubmit={triggerSubmitMessage} className="p-4 flex-1 overflow-y-auto space-y-4">
              
              {/* Message Type Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-black">Message Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { type: 'announcement', label: 'Announcement', icon: Megaphone },
                    { type: 'material', label: 'Material', icon: BookOpen },
                    { type: 'assignment', label: 'Assignment', icon: Clipboard }
                  ].map(btn => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setMessageType(btn.type as any)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition cursor-pointer ${
                        messageType === btn.type
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black scale-[1.02] shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-bold'
                      }`}
                    >
                      <btn.icon className={`w-4 h-4 mb-1 ${messageType === btn.type ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="text-[10px] leading-tight">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DISPATCH SCOPE MODE SWITCH (Class-wide vs Bulk Individual) */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-black">Dispatch Target Strategy</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDispatchScope('class_broadcast')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                      dispatchScope === 'class_broadcast'
                        ? 'bg-white text-indigo-900 font-black shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Class Broadcast</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchScope('bulk_individual')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${
                      dispatchScope === 'bulk_individual'
                        ? 'bg-white text-indigo-900 font-black shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bulk Individual Selection</span>
                  </button>
                </div>
              </div>

              {/* Scope Audiences & Custom React Select Containers per AGENTS.md rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Target Audience Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 font-black">
                    {dispatchScope === 'bulk_individual' ? 'Target Entity Type' : 'Target Audience'}
                  </label>

                  {dispatchScope === 'class_broadcast' ? (
                    /* CUSTOM REACT SELECT FOR TARGET AUDIENCE */
                    <div className="relative inline-block text-left w-full">
                      <button
                        type="button"
                        onClick={() => { setIsAudienceOpen(!isAudienceOpen); setIsClassOpen(false); setIsBulkRoleOpen(false); }}
                        className="flex items-center justify-between w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                      >
                        <span className="truncate">{getAudienceLabel(targetRole)}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isAudienceOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isAudienceOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsAudienceOpen(false)} />
                          <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden animate-in fade-in duration-100">
                            <div className="py-1 max-h-52 overflow-y-auto">
                              {audienceOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setTargetRole(opt.value);
                                    setIsAudienceOpen(false);
                                  }}
                                  className={`flex items-center justify-between w-full px-3.5 py-2 text-xs text-left transition-all ${
                                    targetRole === opt.value
                                      ? "bg-indigo-50 text-indigo-900 font-black"
                                      : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {targetRole === opt.value && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* CUSTOM REACT SELECT FOR BULK RECIPIENT ENTITY ROLE */
                    <div className="relative inline-block text-left w-full">
                      <button
                        type="button"
                        onClick={() => { setIsBulkRoleOpen(!isBulkRoleOpen); setIsAudienceOpen(false); setIsClassOpen(false); }}
                        className="flex items-center justify-between w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                      >
                        <span className="truncate">
                          {bulkTargetRole === 'students' ? 'Students Only' : bulkTargetRole === 'parents' ? 'Parents Only' : 'Students & Parents Both'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isBulkRoleOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isBulkRoleOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsBulkRoleOpen(false)} />
                          <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden">
                            <div className="py-1">
                              {[
                                { id: 'both', label: 'Students & Parents Both' },
                                { id: 'students', label: 'Students Only' },
                                { id: 'parents', label: 'Parents Only' }
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setBulkTargetRole(opt.id as any);
                                    setIsBulkRoleOpen(false);
                                  }}
                                  className={`flex items-center justify-between w-full px-3.5 py-2 text-xs text-left transition-all ${
                                    bulkTargetRole === opt.id
                                      ? "bg-indigo-50 text-indigo-900 font-black"
                                      : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {bulkTargetRole === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Active Class Filter Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 font-black">Active Class Filter</label>
                  
                  {/* CUSTOM REACT SELECT FOR ACTIVE CLASS FILTER */}
                  <div className="relative inline-block text-left w-full">
                    <button
                      type="button"
                      onClick={() => { setIsClassOpen(!isClassOpen); setIsAudienceOpen(false); setIsBulkRoleOpen(false); }}
                      className="flex items-center justify-between w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                    >
                      <span className="truncate">{targetClass || 'Whole Section (Global)'}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isClassOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isClassOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsClassOpen(false)} />
                        <div className="absolute left-0 mt-1.5 w-full rounded-xl bg-white border border-slate-200 shadow-xl z-40 overflow-hidden">
                          <div className="py-1 max-h-52 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => { setTargetClass(''); setIsClassOpen(false); }}
                              className={`flex items-center justify-between w-full px-3.5 py-2 text-xs text-left transition-all ${
                                !targetClass
                                  ? "bg-indigo-50 text-indigo-900 font-black"
                                  : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                              }`}
                            >
                              <span>Whole Section (Global)</span>
                              {!targetClass && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            </button>

                            {AVAILABLE_CLASSES.filter(c => c !== 'All Classes').map((cls) => (
                              <button
                                key={cls}
                                type="button"
                                onClick={() => {
                                  setTargetClass(cls);
                                  setIsClassOpen(false);
                                }}
                                className={`flex items-center justify-between w-full px-3.5 py-2 text-xs text-left transition-all ${
                                  targetClass === cls
                                    ? "bg-indigo-50 text-indigo-900 font-black"
                                    : "text-slate-700 hover:bg-emerald-600 hover:text-white font-medium"
                                }`}
                              >
                                <span>{cls}</span>
                                {targetClass === cls && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* BULK SELECTION RECIPIENT ROSTER CONTAINER */}
              {dispatchScope === 'bulk_individual' && (
                <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Filtered Recipient Roster ({searchedRecipientItems.length})</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      {selectedRecipientKeys.length} Selected
                    </span>
                  </div>

                  {/* Search Bar for Recipient Roster */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Search profiles by name, ID, or parent email..."
                      className="w-full pl-8 pr-7 h-8 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                    {recipientSearch && (
                      <button
                        type="button"
                        onClick={() => setRecipientSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick Action Select All / Deselect All Controls */}
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-indigo-700 font-extrabold hover:underline flex items-center gap-1"
                    >
                      <CheckSquare className="w-3 h-3 text-indigo-600" />
                      Select All Filtered ({searchedRecipientItems.length})
                    </button>
                    {selectedRecipientKeys.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeselectAllFiltered}
                        className="text-rose-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <Square className="w-3 h-3 text-rose-500" />
                        Deselect Filtered
                      </button>
                    )}
                  </div>

                  {/* Scrollable Recipient Checkbox Cards */}
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    {searchedRecipientItems.map((item) => {
                      const isChecked = selectedRecipientKeys.includes(item.key);
                      return (
                        <div
                          key={item.key}
                          onClick={() => toggleRecipientKey(item.key)}
                          className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-indigo-50/90 border-indigo-300 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by container click
                              className="w-3.5 h-3.5 accent-indigo-600 rounded shrink-0 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
                                <span className={`px-1.5 py-0.2 text-[8px] font-mono font-black rounded uppercase ${
                                  item.type === 'student' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {item.type}
                                </span>
                              </div>
                              <span className="text-[9.5px] text-slate-500 font-mono block truncate mt-0.2">
                                {item.subtext}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {searchedRecipientItems.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-4">
                        No student or parent recipients match the active filters.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Message Content Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-black">Material & Content Text</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Draft syllabus updates, home lessons, or administrative announcements here..."
                  className="w-full h-24 p-3 border border-slate-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* INTERACTIVE DRAG-N-DROP FILE ATTACHMENT AREA */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-black">Resource Attachment (Max 5MB)</label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-3.5 text-center transition cursor-pointer ${
                    isDragOver 
                      ? 'border-emerald-500 bg-emerald-50/40' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  />

                  <div className="flex flex-col items-center justify-center gap-1.5">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5 text-indigo-500" />
                    )}

                    <span className="text-[11px] font-black uppercase text-slate-700 tracking-wide">
                      {uploading ? 'Negotiating Stream Upload...' : 'Select or Drag Attaching Resource'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono tracking-wider">
                      PDF, Office Docs, Images (Enforced 5MB Limit)
                    </span>
                  </div>
                </div>

                {/* FILE UPLOAD STATE FEEDBACK BOX */}
                {selectedFile && (
                  <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate leading-tight">
                          {selectedFile.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {uploading && (
                        <span className="text-[8px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                          SENDING
                        </span>
                      )}
                      {attachmentUrl && !uploading && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">UPLOADED</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-0.5"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* EXCEPTION & ERROR REPORTING BLOCK */}
                {uploadError && (
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 leading-tight">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-wider">Transmission Blocked</p>
                      <p className="text-[9px] font-medium">{uploadError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || (dispatchScope === 'bulk_individual' && selectedRecipientKeys.length === 0)}
                className={`w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer shadow-2xs transition ${
                  uploading || (dispatchScope === 'bulk_individual' && selectedRecipientKeys.length === 0)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <Send className="w-4 h-4" />
                {dispatchScope === 'bulk_individual'
                  ? `Dispatch Bulk Message (${selectedRecipientKeys.length} Selected)`
                  : 'Dispatch Educational Material'}
              </button>

            </form>
          </div>
        )}

        {/* MESSAGES FEEDS STREAM (RIGHT COLUMN) */}
        <div className={`${isComposer ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden`}>
          
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Message & Announcement Stream</span>
              </span>
              
              {/* Live Search Input */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search messages & senders..."
                  value={feedSearchQuery}
                  onChange={(e) => setFeedSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition"
                />
                {feedSearchQuery && (
                  <button
                    onClick={() => setFeedSearchQuery('')}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
              {[
                { id: 'all', label: 'All Messages' },
                { id: 'unread', label: 'Unread Only 🔴' },
                { id: 'announcement', label: 'Announcements 📢' },
                { id: 'material', label: 'Materials 📚' },
                { id: 'assignment', label: 'Assignments 📝' },
                { id: 'direct', label: 'Direct Messages 💬' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFeedFilterTab(tab.id as any)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition cursor-pointer ${
                    feedFilterTab === tab.id
                      ? 'bg-indigo-950 text-white font-black shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.filter(msg => {
              if (feedFilterTab === 'unread' && !msg.unread) return false;
              if (feedFilterTab === 'direct' && !(msg.target_recipients && msg.target_recipients.length > 0)) return false;
              if (feedFilterTab === 'announcement' && msg.message_type !== 'announcement') return false;
              if (feedFilterTab === 'material' && msg.message_type !== 'material') return false;
              if (feedFilterTab === 'assignment' && msg.message_type !== 'assignment') return false;

              if (feedSearchQuery.trim()) {
                const q = feedSearchQuery.toLowerCase();
                const contentMatch = msg.content?.toLowerCase().includes(q);
                const senderMatch = msg.sender_name?.toLowerCase().includes(q);
                const classMatch = msg.target_class?.toLowerCase().includes(q);
                return contentMatch || senderMatch || classMatch;
              }
              return true;
            }).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                <Megaphone className="w-8 h-8 text-slate-300 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-wider">No matching messages found</p>
                <p className="text-[10px] leading-relaxed max-w-xs">Try clearing your search query or switching filter tabs.</p>
              </div>
            ) : (
              messages.filter(msg => {
                if (feedFilterTab === 'unread' && !msg.unread) return false;
                if (feedFilterTab === 'direct' && !(msg.target_recipients && msg.target_recipients.length > 0)) return false;
                if (feedFilterTab === 'announcement' && msg.message_type !== 'announcement') return false;
                if (feedFilterTab === 'material' && msg.message_type !== 'material') return false;
                if (feedFilterTab === 'assignment' && msg.message_type !== 'assignment') return false;

                if (feedSearchQuery.trim()) {
                  const q = feedSearchQuery.toLowerCase();
                  const contentMatch = msg.content?.toLowerCase().includes(q);
                  const senderMatch = msg.sender_name?.toLowerCase().includes(q);
                  const classMatch = msg.target_class?.toLowerCase().includes(q);
                  return contentMatch || senderMatch || classMatch;
                }
                return true;
              }).map(msg => (
                <div
                  key={msg.id}
                  onClick={() => msg.unread && markAsRead(msg.id)}
                  className={`p-4 rounded-xl border transition-all duration-300 relative ${
                    msg.unread 
                      ? 'bg-indigo-50/40 border-indigo-200 shadow-2xs cursor-pointer hover:bg-indigo-50/70' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Unread dot indicator */}
                  {msg.unread && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  )}

                  {/* Header metadata row */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className={`p-1.5 rounded-lg border ${
                      msg.message_type === 'announcement' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                      msg.message_type === 'material' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                      'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                      {msg.message_type === 'announcement' ? <Megaphone className="w-3.5 h-3.5" /> :
                       msg.message_type === 'material' ? <BookOpen className="w-3.5 h-3.5" /> :
                       <Clipboard className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-700 leading-tight">
                            {msg.sender_name || 'System Administrator'}
                          </span>
                          <span className="text-[8px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider">
                            {msg.sender_role.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Quick Reply Trigger */}
                        {msg.sender_id !== currentProfile.id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMessageContent(`Replying to ${msg.sender_name || 'Sender'}: `);
                              const elem = document.getElementById('cs-communication-hub-workspace');
                              if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-bold rounded-md transition flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3 text-indigo-600" />
                            Reply
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-mono leading-none flex-wrap">
                        <span>{new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.target_class && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 font-bold uppercase">{msg.target_class}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="uppercase tracking-wider">Audience: {msg.target_role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Text body */}
                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>

                  {/* TARGET RECIPIENTS BULK BADGE (If message was dispatched to specific selected recipients) */}
                  {msg.target_recipients && msg.target_recipients.length > 0 && (
                    <div className="mt-3 p-2 bg-indigo-50/60 border border-indigo-200/80 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10.5px] font-bold text-indigo-950 truncate">
                            Bulk Direct Dispatch: {msg.target_recipients.length} Selected Recipients
                          </p>
                          <p className="text-[9px] font-mono text-indigo-700/80">
                            Delivered to specific student & parent profiles
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingRecipients({
                            sender_name: msg.sender_name,
                            message_type: msg.message_type,
                            recipients: msg.target_recipients || []
                          });
                        }}
                        className="px-2 py-1 bg-white border border-indigo-200 text-indigo-700 text-[9.5px] font-bold rounded-md hover:bg-indigo-600 hover:text-white transition"
                      >
                        View Roster
                      </button>
                    </div>
                  )}

                  {/* Attached resources banner downloads */}
                  {msg.attachment_url && (
                    <div className="mt-3 p-2 bg-slate-50 border border-slate-200/50 rounded-lg flex items-center justify-between group/btn transition hover:border-slate-300">
                      <div className="flex items-center gap-2 min-w-0">
                        {msg.attachment_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <div className="w-8 h-8 rounded overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                            <img src={msg.attachment_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded border border-indigo-100 bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-700 truncate leading-tight">
                            {msg.attachment_url.split('/').pop()?.replace(/^\d+_[a-f0-9]{8}_/, '') || 'Attached Resource File'}
                          </p>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">Clears paper trap requirements</p>
                        </div>
                      </div>

                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 px-2.5 bg-white border border-slate-250 hover:border-indigo-500 rounded-md text-[9px] font-black text-slate-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      >
                        <Download className="w-3 h-3 text-indigo-500" />
                        GET ASSET
                      </a>
                    </div>
                  )}

                  {/* Message read checkbox acknowledgement indicator for sender */}
                  {msg.sender_id === currentProfile.id && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Acknowledged by {msg.read_by.length} members</span>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* VIEW RECIPIENTS ROSTER MODAL */}
      {viewingRecipients && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Targeted Bulk Recipients ({viewingRecipients.recipients.length})
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Dispatched by {viewingRecipients.sender_name || 'Faculty Member'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRecipients(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {viewingRecipients.recipients.map((rec, idx) => (
                <div key={rec.id || idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                      rec.type === 'student' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {rec.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs truncate">{rec.name}</span>
                        <span className={`px-1.5 py-0.2 text-[8px] font-mono font-bold rounded uppercase ${
                          rec.type === 'student' ? 'bg-white text-indigo-700 border border-indigo-200' : 'bg-white text-emerald-700 border border-emerald-200'
                        }`}>
                          {rec.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">
                        {rec.subtext || rec.class_name || 'Classroom Profile'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingRecipients(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
