import React, { useState, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Upload, CheckCircle2, AlertCircle, AlertTriangle, 
  Download, Sparkles, Trash2, Edit2, Check, RefreshCw, X, 
  FileSpreadsheet, ArrowRight, ArrowLeft, ShieldCheck, Users,
  ChevronDown, SlidersHorizontal, Layers,
  Search, CheckCheck, Eye, FileText, RotateCcw, UserPlus,
  FileDown, ShieldAlert
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { 
  acquireGoogleWorkspaceToken, 
  openGoogleSheetPicker, 
  readSpreadsheetRange, 
  fetchSpreadsheetMetadata,
  getCachedGoogleAccessToken
} from "@/lib/googleWorkspace";

export interface StudentRowItem {
  id: string;
  name: string;
  class_name: string;
  age: number;
  gender: "Male" | "Female" | string;
  parent_email: string;
  parent_phone?: string;
  balance_due: number;
  admission_no?: string;
  blood_group?: string;
  genotype?: string;
  login_email?: string;
  term_average?: number;
}

export interface ValidatedStudentRow {
  index: number;
  rawRowNumber: number; // 1-based original line in spreadsheet (starts at 2 after header)
  data: StudentRowItem;
  status: "valid" | "warning" | "error";
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export interface SkippedRowDetail {
  index: number;
  rawRowNumber: number;
  data: Partial<StudentRowItem>;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  reasons: string[];
  suggestedFix: string;
}

export interface ImportSummaryResult {
  timestamp: string;
  fileName: string;
  totalProcessed: number;
  successfulCount: number;
  failedCount: number;
  parentAccountsCreated: number;
  classesUpdated: number;
  newClasses: string[];
  importedStudents: StudentRowItem[];
  skippedRows: SkippedRowDetail[];
}

export interface SchemaFieldDefinition {
  key: keyof StudentRowItem;
  label: string;
  required: boolean;
  type: "string" | "number" | "email" | "gender";
  description: string;
  aliases: string[];
  sampleFallback: string;
}

export const PLATFORM_SCHEMA_FIELDS: SchemaFieldDefinition[] = [
  {
    key: "name",
    label: "Student Full Name",
    required: true,
    type: "string",
    description: "Official full name of learner (First name & Surname)",
    aliases: ["student full name", "full name", "student name", "name", "student", "learner name", "learner", "pupil name", "candidate name"],
    sampleFallback: "David Macaulay"
  },
  {
    key: "class_name",
    label: "Class / Cohort",
    required: true,
    type: "string",
    description: "Classroom stream allocation (e.g., SS 2 Science, JSS 1 Gold)",
    aliases: ["class", "class name", "classroom", "cohort", "grade", "arm", "stream", "standard", "level"],
    sampleFallback: "SS 2 Science"
  },
  {
    key: "age",
    label: "Age (Years)",
    required: true,
    type: "number",
    description: "Student age in years (valid range: 3 to 30 years)",
    aliases: ["age", "student age", "years", "age (years)", "age (yrs)", "dob_age"],
    sampleFallback: "16"
  },
  {
    key: "gender",
    label: "Gender / Sex",
    required: true,
    type: "gender",
    description: "Gender identity (Male / Female / M / F)",
    aliases: ["gender", "sex", "student gender", "gender identity"],
    sampleFallback: "Male"
  },
  {
    key: "parent_email",
    label: "Parent / Guardian Email",
    required: true,
    type: "email",
    description: "Primary contact email for fees, report cards, & portal sync",
    aliases: ["parent email", "parent contact email", "guardian email", "email", "parent_email", "contact email", "guardian mail", "father email", "mother email"],
    sampleFallback: "parent.guardian@example.com"
  },
  {
    key: "parent_phone",
    label: "Parent Phone / WhatsApp",
    required: false,
    type: "string",
    description: "Mobile contact number for automated SMS & emergency alerts",
    aliases: ["parent phone", "guardian phone", "phone number", "parent contact", "whatsapp phone", "phone", "mobile", "tel", "contact no"],
    sampleFallback: "+2348031234567"
  },
  {
    key: "balance_due",
    label: "Outstanding Balance / Fees Due",
    required: false,
    type: "number",
    description: "Outstanding tuition / registry arrears in Naira (₦) (Defaults to ₦0)",
    aliases: ["balance due", "outstanding balance", "fees due", "balance", "tuition due", "arrears", "outstanding", "amount due", "fee arrears", "debt"],
    sampleFallback: "₦0"
  },
  {
    key: "admission_no",
    label: "Admission / Student ID Number",
    required: false,
    type: "string",
    description: "Unique student matriculation / registration badge (e.g., CS-2026-001)",
    aliases: ["admission number", "admission no", "student id", "reg no", "registration no", "id", "matric no", "roll no", "badge no"],
    sampleFallback: "CS-2026-001"
  },
  {
    key: "blood_group",
    label: "Blood Group",
    required: false,
    type: "string",
    description: "Medical blood group classification (e.g., O+, A+, B+, AB+)",
    aliases: ["blood group", "blood", "blood type", "bloodgroup", "bg"],
    sampleFallback: "O+"
  },
  {
    key: "genotype",
    label: "Genotype",
    required: false,
    type: "string",
    description: "Medical genotype classification (e.g., AA, AS, AC, SS)",
    aliases: ["genotype", "geno", "gene type", "genotype group"],
    sampleFallback: "AA"
  },
  {
    key: "login_email",
    label: "Student Portal Email",
    required: false,
    type: "email",
    description: "Direct student dashboard login username / institutional email",
    aliases: ["student email", "login email", "portal email", "school email", "student mail", "username"],
    sampleFallback: "david.macaulay@cornerstreams.edu.ng"
  }
];

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: (importedStudents: StudentRowItem[]) => void;
  currentProfile?: any;
  existingClasses?: string[];
}

export function BulkUploadDialog({ 
  open, 
  onOpenChange, 
  onUploadSuccess, 
  existingClasses = ["SS 2 Science", "SS 1 Gold", "SS 3 Art", "JSS 1 Crystal", "JSS 2 Blue", "JSS 3 Alpha"]
}: BulkUploadDialogProps) {
  // Wizard steps: 1 = upload, 2 = column mapping, 3 = review & validation, 4 = summary & audit report
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  
  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  
  // Mapping state: Platform Field Key -> Selected Raw CSV Column Name (or empty string for unmapped)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  
  // Custom dropdown open states (for No Native Selects rule)
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [inlineGenderOpenIndex, setInlineGenderOpenIndex] = useState<number | null>(null);

  const [validatedRows, setValidatedRows] = useState<ValidatedStudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "valid" | "errors" | "warnings">("all");
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<StudentRowItem>>({});
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [createParentAccounts, setCreateParentAccounts] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // STEP 4 SUMMARY & AUDIT STATE
  const [summaryResult, setSummaryResult] = useState<ImportSummaryResult | null>(null);
  const [summaryTab, setSummaryTab] = useState<"skipped" | "success">("skipped");
  const [summarySearchQuery, setSummarySearchQuery] = useState<string>("");

  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Import directly from Google Drive / Google Sheets using Google Picker
  const handleGoogleSheetImport = async () => {
    setIsGoogleLoading(true);
    try {
      let token = getCachedGoogleAccessToken();
      if (!token) {
        toast.info("Connecting to your Google Account...");
        token = await acquireGoogleWorkspaceToken();
      }

      await openGoogleSheetPicker(
        token,
        async (pickedDoc) => {
          try {
            setLoading(true);
            toast.loading(`Opening Google Sheet: ${pickedDoc.name}...`, { id: "sheet-fetch" });
            
            // 1. Fetch metadata to get first sheet title
            const metadata = await fetchSpreadsheetMetadata(pickedDoc.id, token!);
            const firstSheetTitle = metadata.sheets?.[0]?.properties?.title || "Sheet1";
            
            // 2. Fetch sheet values
            const values = await readSpreadsheetRange(pickedDoc.id, `${firstSheetTitle}!A1:Z500`, token!);
            toast.dismiss("sheet-fetch");

            if (!values || values.length <= 1) {
              toast.error("The selected Google Sheet does not contain enough data rows.");
              setLoading(false);
              return;
            }

            const headerRow = values[0];
            const dataRows = values.slice(1);

            // Convert into object rows
            const jsonRows = dataRows.map((row: any[]) => {
              const obj: Record<string, any> = {};
              headerRow.forEach((h: string, i: number) => {
                obj[h] = row[i] !== undefined ? String(row[i]) : "";
              });
              return obj;
            });

            setRawHeaders(headerRow);
            setRawRows(jsonRows);

            // Run smart auto-matching
            const initialMapping = autoDetectMappings(headerRow);
            setColumnMapping(initialMapping);

            setCurrentStep(2);
            toast.success(`Loaded "${pickedDoc.name}" (${jsonRows.length} rows). Please verify column mappings.`);
          } catch (err: any) {
            console.error("Error reading Google Sheet data:", err);
            toast.dismiss("sheet-fetch");
            toast.error(err.message || "Failed to load Google Sheet data. Please ensure file permissions.");
          } finally {
            setLoading(false);
          }
        },
        () => {
          toast.info("Google Sheet selection cancelled.");
        }
      );
    } catch (err: any) {
      console.error("Google Sheets Picker error:", err);
      toast.error(err.message || "Could not open Google Picker.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 1. Download CSV Sample Template
  const downloadCsvTemplate = () => {
    try {
      const headers = [
        "Student Full Name",
        "Class",
        "Age",
        "Gender",
        "Parent Email",
        "Parent Phone",
        "Balance Due",
        "Admission Number",
        "Blood Group",
        "Genotype"
      ];

      const sampleRows = [
        ["David Macaulay", "SS 2 Science", "16", "Male", "david.macaulay@parent.com", "+2348031234567", "0", "CS-2026-001", "O+", "AA"],
        ["Esther Nwosu", "SS 1 Gold", "15", "Female", "esther.nwosu@parent.com", "+2348059876543", "15000", "CS-2026-002", "A+", "AS"],
        ["Chinedu Obi", "SS 3 Art", "17", "Male", "chinedu.obi@parent.com", "+2348123456789", "0", "CS-2026-003", "B+", "AA"],
        ["Fatima Al-Mansoor", "JSS 1 Crystal", "11", "Female", "fatima.parent@gmail.com", "+2348149871122", "25000", "CS-2026-004", "O-", "AA"],
        ["Oluwaseun Benson", "SS 2 Science", "16", "Male", "alaobenson@gmail.com", "+2348023456781", "45000", "CS-2026-005", "O+", "AC"]
      ];

      const csvContent = [
        headers.join(","),
        ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "CornerStreams_Student_Batch_Import_Template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("CSV Student Import Template downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate CSV template.");
    }
  };

  // 2. Download Excel Sample Template (.xlsx)
  const downloadExcelTemplate = () => {
    try {
      const headers = [
        "Student Full Name",
        "Class",
        "Age",
        "Gender",
        "Parent Email",
        "Parent Phone",
        "Balance Due",
        "Admission Number",
        "Blood Group",
        "Genotype"
      ];
      const data = [
        ["David Macaulay", "SS 2 Science", "16", "Male", "david.macaulay@parent.com", "+2348031234567", "0", "CS-2026-001", "O+", "AA"],
        ["Esther Nwosu", "SS 1 Gold", "15", "Female", "esther.nwosu@parent.com", "+2348059876543", "15000", "CS-2026-002", "A+", "AS"],
        ["Chinedu Obi", "SS 3 Art", "17", "Male", "chinedu.obi@parent.com", "+2348123456789", "0", "CS-2026-003", "B+", "AA"],
        ["Fatima Al-Mansoor", "JSS 1 Crystal", "11", "Female", "fatima.parent@gmail.com", "+2348149871122", "25000", "CS-2026-004", "O-", "AA"],
        ["Oluwaseun Benson", "SS 2 Science", "16", "Male", "alaobenson@gmail.com", "+2348023456781", "45000", "CS-2026-005", "O+", "AC"]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      
      ws["!cols"] = [
        { wch: 24 }, { wch: 16 }, { wch: 8 }, { wch: 10 },
        { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 18 },
        { wch: 12 }, { wch: 10 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students Template");
      XLSX.writeFile(wb, "CornerStreams_Student_Batch_Import_Template.xlsx");
      toast.success("Excel Student Import Template downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel template.");
    }
  };

  // 3. Smart Column Auto-Matching Engine
  const autoDetectMappings = (headers: string[]): Record<string, string> => {
    const initialMapping: Record<string, string> = {};
    const usedHeaders = new Set<string>();

    PLATFORM_SCHEMA_FIELDS.forEach(schema => {
      // 1. Exact match with aliases
      for (const alias of schema.aliases) {
        const found = headers.find(h => {
          const cleanH = h.trim().toLowerCase();
          const cleanAlias = alias.trim().toLowerCase();
          return cleanH === cleanAlias && !usedHeaders.has(h);
        });
        if (found) {
          initialMapping[schema.key] = found;
          usedHeaders.add(found);
          return;
        }
      }

      // 2. Fuzzy match (normalized alphanumeric)
      for (const alias of schema.aliases) {
        const found = headers.find(h => {
          const normH = h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
          const normAlias = alias.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
          return (normH === normAlias || normH.includes(normAlias) || normAlias.includes(normH)) && !usedHeaders.has(h);
        });
        if (found) {
          initialMapping[schema.key] = found;
          usedHeaders.add(found);
          return;
        }
      }

      // Unmapped by default
      initialMapping[schema.key] = "";
    });

    return initialMapping;
  };

  // 4. Validation Logic Engine
  const validateStudentRecord = (
    item: any, 
    index: number, 
    allRawItems: any[], 
    existingDbStudents: any[],
    rawRowNumber?: number
  ): ValidatedStudentRow => {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // 1. Full Name Check
    const rawName = String(item.name || "").trim();
    if (!rawName) {
      errors.name = "Student Full Name is required.";
    } else if (rawName.length < 2) {
      errors.name = "Name must be at least 2 characters long.";
    } else {
      const parts = rawName.split(/\s+/).filter(Boolean);
      if (parts.length < 2) {
        warnings.name = "Consider providing both First Name & Surname.";
      }
    }

    // 2. Class Check
    const rawClass = String(item.class_name || "").trim();
    if (!rawClass) {
      errors.class_name = "Classroom allocation is required.";
    } else {
      const matched = existingClasses.find(
        c => c.toLowerCase() === rawClass.toLowerCase()
      );
      if (!matched) {
        warnings.class_name = `"${rawClass}" is a new classroom. It will be auto-created.`;
      }
    }

    // 3. Age Check
    const rawAge = Number(item.age);
    if (isNaN(rawAge) || rawAge === 0) {
      errors.age = "Age must be a valid number.";
    } else if (rawAge < 3 || rawAge > 30) {
      errors.age = "Age must be between 3 and 30 years.";
    } else if (rawAge < 5 || rawAge > 22) {
      warnings.age = `Age (${rawAge}) is unusual for primary/secondary curriculum.`;
    }

    // 4. Gender Check
    const rawGender = String(item.gender || "").trim().toLowerCase();
    let normalizedGender: "Male" | "Female" | string = "Male";
    if (["m", "male", "boy", "m."].includes(rawGender)) {
      normalizedGender = "Male";
    } else if (["f", "female", "girl", "f."].includes(rawGender)) {
      normalizedGender = "Female";
    } else if (!rawGender) {
      errors.gender = "Gender (Male/Female) is required.";
    } else {
      errors.gender = `Invalid gender "${item.gender}". Use "Male" or "Female".`;
    }

    // 5. Parent Email Check
    const rawParentEmail = String(item.parent_email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawParentEmail) {
      errors.parent_email = "Parent / Guardian email is required for alerts.";
    } else if (!emailRegex.test(rawParentEmail)) {
      errors.parent_email = `Invalid email syntax "${rawParentEmail}".`;
    }

    // 6. Parent Phone Check (Optional)
    const rawPhone = String(item.parent_phone || "").trim();
    if (rawPhone) {
      const cleanDigits = rawPhone.replace(/[^\d+]/g, "");
      if (cleanDigits.length < 8 || cleanDigits.length > 16) {
        warnings.parent_phone = "Phone number looks irregular. Confirm international format.";
      }
    }

    // 7. Balance Due Check
    let rawBalance = item.balance_due;
    if (typeof rawBalance === "string") {
      rawBalance = Number(rawBalance.replace(/[₦,$\s]/g, ""));
    }
    if (isNaN(rawBalance) || rawBalance < 0) {
      errors.balance_due = "Balance due must be a non-negative amount.";
      rawBalance = 0;
    }

    // 8. Duplicate Checks
    if (rawName && rawClass) {
      const duplicatesInBatch = allRawItems.filter((other, oIdx) => 
        oIdx !== index &&
        String(other.name || "").trim().toLowerCase() === rawName.toLowerCase() &&
        String(other.class_name || "").trim().toLowerCase() === rawClass.toLowerCase()
      );
      if (duplicatesInBatch.length > 0) {
        warnings.name = "Duplicate student name detected in this uploaded batch.";
      }

      const dbMatch = existingDbStudents.find(
        (st: any) => 
          String(st.name || "").toLowerCase() === rawName.toLowerCase() &&
          String(st.class_name || "").toLowerCase() === rawClass.toLowerCase()
      );
      if (dbMatch) {
        warnings.name = `Student already exists in database (#${dbMatch.id}). Import will update existing record.`;
      }
    }

    let status: "valid" | "warning" | "error" = "valid";
    if (Object.keys(errors).length > 0) {
      status = "error";
    } else if (Object.keys(warnings).length > 0) {
      status = "warning";
    }

    const cleanStudentName = rawName || `Student #${index + 1}`;
    const nameSlug = cleanStudentName.toLowerCase().replace(/[^a-z0-9]/g, ".");
    const generatedLoginEmail = `${nameSlug}@cornerstreams.edu.ng`;
    const generatedId = item.admission_no || `CS-2026-${String(index + 1).padStart(4, "0")}`;

    const parsedData: StudentRowItem = {
      id: item.id || `st-bulk-${index}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanStudentName,
      class_name: rawClass || "SS 2 Science",
      age: rawAge || 16,
      gender: normalizedGender,
      parent_email: rawParentEmail || "parent@example.com",
      parent_phone: rawPhone || undefined,
      balance_due: rawBalance || 0,
      admission_no: generatedId,
      blood_group: item.blood_group || "O+",
      genotype: item.genotype || "AA",
      login_email: item.login_email || generatedLoginEmail,
      term_average: 65
    };

    return {
      index,
      rawRowNumber: rawRowNumber ?? (index + 2),
      data: parsedData,
      status,
      errors,
      warnings
    };
  };

  // 5. File Processing (CSV & XLSX)
  const processFile = (selectedFile: File) => {
    const isCsvOrExcel = 
      selectedFile.name.endsWith(".xlsx") || 
      selectedFile.name.endsWith(".xls") || 
      selectedFile.name.endsWith(".csv");

    if (!isCsvOrExcel) {
      toast.error("Please upload a valid CSV (.csv) or Excel (.xlsx, .xls) file.");
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
        
        // Extract raw JSON rows
        const rawJsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        
        if (!rawJsonRows || rawJsonRows.length === 0) {
          toast.error("The uploaded file contains no data rows.");
          setLoading(false);
          return;
        }

        // Get headers from first row keys
        const extractedHeaders: string[] = Object.keys(rawJsonRows[0] || {});
        setRawHeaders(extractedHeaders);
        setRawRows(rawJsonRows);

        // Run smart auto-matching
        const initialMapping = autoDetectMappings(extractedHeaders);
        setColumnMapping(initialMapping);

        // Move to Step 2: Column Mapping Interface
        setCurrentStep(2);
        toast.info(`Extracted ${extractedHeaders.length} columns & ${rawJsonRows.length} rows. Please review column mappings.`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse file. Ensure it is a standard CSV or Excel file.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  // 6. Execute Mapping and Generate Validated Rows (Proceed to Step 3)
  const applyMappingAndValidate = () => {
    // Check required fields
    const missingRequired = PLATFORM_SCHEMA_FIELDS.filter(
      f => f.required && (!columnMapping[f.key] || columnMapping[f.key].trim() === "")
    );

    if (missingRequired.length > 0) {
      toast.error(`Please map all required fields: ${missingRequired.map(f => f.label).join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      // Map raw rows based on current columnMapping
      const mappedItems = rawRows.map(raw => {
        const getVal = (schemaKey: string) => {
          const mappedHeader = columnMapping[schemaKey];
          if (!mappedHeader || raw[mappedHeader] === undefined) return "";
          return raw[mappedHeader];
        };

        return {
          name: getVal("name"),
          class_name: getVal("class_name"),
          age: getVal("age"),
          gender: getVal("gender"),
          parent_email: getVal("parent_email"),
          parent_phone: getVal("parent_phone"),
          balance_due: getVal("balance_due"),
          admission_no: getVal("admission_no"),
          blood_group: getVal("blood_group"),
          genotype: getVal("genotype"),
          login_email: getVal("login_email")
        };
      });

      const existingDbStudents = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");

      const validated = mappedItems.map((item, idx) => 
        validateStudentRecord(item, idx, mappedItems, existingDbStudents, idx + 2)
      );

      setValidatedRows(validated);
      setCurrentStep(3);

      const validCnt = validated.filter(r => r.status === "valid").length;
      const warningCnt = validated.filter(r => r.status === "warning").length;
      const errorCnt = validated.filter(r => r.status === "error").length;

      if (errorCnt === 0) {
        toast.success(`🎉 All ${validated.length} records parsed cleanly!`);
      } else {
        toast.warning(`Mapped ${validated.length} records: ${validCnt + warningCnt} ready, ${errorCnt} flagged.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply column mapping to data rows.");
    } finally {
      setLoading(false);
    }
  };

  // 7. Auto-Fix Common Issues (Step 3)
  const handleAutoFix = () => {
    if (validatedRows.length === 0) return;

    const existingDbStudents = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");

    const fixed = validatedRows.map(row => {
      const d = { ...row.data };

      if (d.name) {
        d.name = d.name
          .trim()
          .replace(/\s+/g, " ")
          .split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }

      const g = String(d.gender || "").toLowerCase().trim();
      if (["m", "male", "boy", "m."].includes(g)) {
        d.gender = "Male";
      } else if (["f", "female", "girl", "f."].includes(g)) {
        d.gender = "Female";
      } else if (!d.gender) {
        d.gender = "Male";
      }

      if (!d.age || isNaN(d.age) || d.age < 3) {
        d.age = 15;
      }

      if (!d.class_name) {
        d.class_name = existingClasses[0] || "SS 2 Science";
      }

      if (!d.balance_due || isNaN(d.balance_due) || d.balance_due < 0) {
        d.balance_due = 0;
      }

      if (!d.parent_email || !d.parent_email.includes("@")) {
        const slug = d.name.toLowerCase().replace(/[^a-z0-9]/g, ".");
        d.parent_email = `parent.${slug || 'guardian'}@gmail.com`;
      }

      return validateStudentRecord(d, row.index, validatedRows.map(v => v.data), existingDbStudents, row.rawRowNumber);
    });

    setValidatedRows(fixed);
    toast.success("Applied smart auto-fixes: standardized names, genders, fallback emails & balances!");
  };

  // 8. Inline Row Edit & Save
  const handleStartEdit = (row: ValidatedStudentRow) => {
    setEditingRowIndex(row.index);
    setEditFormData({ ...row.data });
    setInlineGenderOpenIndex(null);
  };

  const handleSaveEdit = (index: number) => {
    const existingDbStudents = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
    const updated = [...validatedRows];
    const targetIdx = updated.findIndex(r => r.index === index);

    if (targetIdx !== -1) {
      const mergedData = { ...updated[targetIdx].data, ...editFormData };
      const revalidated = validateStudentRecord(
        mergedData, 
        index, 
        updated.map(u => u.data), 
        existingDbStudents,
        updated[targetIdx].rawRowNumber
      );
      updated[targetIdx] = revalidated;
      setValidatedRows(updated);
      setEditingRowIndex(null);
      setEditFormData({});
      setInlineGenderOpenIndex(null);
      toast.success("Row updated and revalidated!");
    }
  };

  const handleDeleteRow = (index: number) => {
    const existingDbStudents = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
    const filtered = validatedRows.filter(r => r.index !== index);
    const reindexed = filtered.map((r, idx) => 
      validateStudentRecord(r.data, idx, filtered.map(f => f.data), existingDbStudents, r.rawRowNumber)
    );
    setValidatedRows(reindexed);
    toast.info("Record removed from batch import list.");
  };

  // 9. Final Batch Import Execution -> Transition to Step 4 Summary
  const handleConfirmImport = async () => {
    const rowsToImport = skipInvalid 
      ? validatedRows.filter(r => r.status !== "error")
      : validatedRows;

    const rowsSkipped = validatedRows.filter(r => r.status === "error");

    if (rowsToImport.length === 0) {
      toast.error("No valid records available to import. Please resolve flagged issues.");
      return;
    }

    setLoading(true);

    try {
      const currentList: StudentRowItem[] = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");
      const currentProfiles = JSON.parse(localStorage.getItem("CS_STUDENT_PROFILES") || "[]");
      const currentUsers = JSON.parse(localStorage.getItem("CS_USERS_LIST") || "[]");
      const currentSchool = JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}");

      const newStudentItems: StudentRowItem[] = [];
      const newParentUsers: any[] = [];
      const discoveredNewClasses: string[] = [];

      rowsToImport.forEach((row, idx) => {
        const item = row.data;
        
        const studentEntity: StudentRowItem = {
          id: item.id || `st-imp-${Date.now()}-${idx}`,
          name: item.name,
          class_name: item.class_name,
          age: item.age,
          gender: item.gender,
          parent_email: item.parent_email,
          parent_phone: item.parent_phone,
          balance_due: item.balance_due,
          admission_no: item.admission_no || `CS-2026-${String(currentList.length + idx + 1).padStart(4, "0")}`,
          blood_group: item.blood_group || "O+",
          genotype: item.genotype || "AA",
          login_email: item.login_email || `${item.name.toLowerCase().replace(/\s+/g, ".")}@cornerstreams.edu.ng`,
          term_average: 65
        };

        newStudentItems.push(studentEntity);

        if (item.class_name && !currentSchool.classes?.includes(item.class_name)) {
          discoveredNewClasses.push(item.class_name);
        }

        if (createParentAccounts && item.parent_email) {
          const parentExists = currentUsers.some(
            (u: any) => u.email?.toLowerCase() === item.parent_email.toLowerCase()
          );
          if (!parentExists) {
            newParentUsers.push({
              id: `u-p-${Date.now()}-${idx}`,
              name: `Parent of ${item.name}`,
              email: item.parent_email,
              phone: item.parent_phone || "",
              role: "parent",
              linked_students: [studentEntity.name],
              assigned_classes: [item.class_name],
              created_at: new Date().toISOString()
            });
          }
        }
      });

      const mergedStudents = [...currentList];
      newStudentItems.forEach(newSt => {
        const existingIdx = mergedStudents.findIndex(
          st => st.name.toLowerCase() === newSt.name.toLowerCase() && st.class_name === newSt.class_name
        );
        if (existingIdx !== -1) {
          mergedStudents[existingIdx] = { ...mergedStudents[existingIdx], ...newSt };
        } else {
          mergedStudents.push(newSt);
        }
      });
      localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(mergedStudents));

      const mergedProfiles = [...currentProfiles];
      newStudentItems.forEach(newSt => {
        if (!mergedProfiles.some((p: any) => p.name === newSt.name)) {
          mergedProfiles.push({
            id: newSt.id,
            name: newSt.name,
            class_name: newSt.class_name,
            gender: newSt.gender,
            email: newSt.login_email,
            parent_email: newSt.parent_email,
            admission_no: newSt.admission_no
          });
        }
      });
      localStorage.setItem("CS_STUDENT_PROFILES", JSON.stringify(mergedProfiles));

      if (newParentUsers.length > 0) {
        const mergedUsers = [...currentUsers, ...newParentUsers];
        localStorage.setItem("CS_USERS_LIST", JSON.stringify(mergedUsers));
      }

      if (discoveredNewClasses.length > 0) {
        const uniqueClasses = Array.from(new Set([...(currentSchool.classes || []), ...discoveredNewClasses]));
        currentSchool.classes = uniqueClasses;
        localStorage.setItem("CS_SCHOOL", JSON.stringify(currentSchool));
      }

      // Compile detailed skipped rows list with specific error analysis
      const detailedSkippedRows: SkippedRowDetail[] = rowsSkipped.map((row) => {
        const errMessages = Object.entries(row.errors).map(([field, msg]) => {
          const fieldDef = PLATFORM_SCHEMA_FIELDS.find(f => f.key === field);
          const fieldLabel = fieldDef ? fieldDef.label : field;
          return `${fieldLabel}: ${msg}`;
        });

        let suggestedFix = "Provide missing mandatory values or correct format.";
        if (row.errors.name) suggestedFix = "Specify full student name (First name & Surname).";
        else if (row.errors.parent_email) suggestedFix = "Provide valid parent email with standard @ format.";
        else if (row.errors.class_name) suggestedFix = "Assign a valid classroom cohort stream.";
        else if (row.errors.age) suggestedFix = "Enter a numeric age between 3 and 30 years.";
        else if (row.errors.gender) suggestedFix = "Select Male or Female.";

        return {
          index: row.index,
          rawRowNumber: row.rawRowNumber,
          data: row.data,
          errors: row.errors,
          warnings: row.warnings,
          reasons: errMessages,
          suggestedFix
        };
      });

      const summary: ImportSummaryResult = {
        timestamp: new Date().toISOString(),
        fileName: file?.name || "batch_import_file.xlsx",
        totalProcessed: validatedRows.length,
        successfulCount: newStudentItems.length,
        failedCount: detailedSkippedRows.length,
        parentAccountsCreated: newParentUsers.length,
        classesUpdated: discoveredNewClasses.length,
        newClasses: discoveredNewClasses,
        importedStudents: newStudentItems,
        skippedRows: detailedSkippedRows
      };

      setSummaryResult(summary);
      setSummaryTab(detailedSkippedRows.length > 0 ? "skipped" : "success");

      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("cs_students_updated"));
      window.dispatchEvent(new Event("cs_school_updated"));

      if (onUploadSuccess) {
        onUploadSuccess(newStudentItems);
      }

      // Advance directly to Step 4: Summary & Audit Log View
      setCurrentStep(4);

      toast.success(
        `🎉 Successfully imported ${newStudentItems.length} student learners!`,
        {
          description: `${newParentUsers.length} linked parent accounts mapped, ${discoveredNewClasses.length} classroom cohorts updated.`,
          duration: 5000
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Encountered an unexpected error while importing records.");
    } finally {
      setLoading(false);
    }
  };

  // 10. DOWNLOAD SKIPPED ROWS AUDIT LOG (CSV)
  const downloadSkippedRowsCsv = () => {
    if (!summaryResult || summaryResult.skippedRows.length === 0) {
      toast.info("No skipped or failed rows to export.");
      return;
    }

    try {
      const headers = [
        "Spreadsheet Row #",
        "Student Full Name",
        "Target Class",
        "Age",
        "Gender",
        "Parent Email",
        "Parent Phone",
        "Balance Due (NGN)",
        "Admission Number",
        "Failed Fields",
        "Failure Reasons",
        "Suggested Fix / Action"
      ];

      const rows = summaryResult.skippedRows.map(item => [
        String(item.rawRowNumber),
        item.data.name || "N/A",
        item.data.class_name || "N/A",
        String(item.data.age || "N/A"),
        item.data.gender || "N/A",
        item.data.parent_email || "N/A",
        item.data.parent_phone || "N/A",
        String(item.data.balance_due || 0),
        item.data.admission_no || "N/A",
        Object.keys(item.errors).join("; "),
        item.reasons.join(" | "),
        item.suggestedFix
      ]);

      const csvContent = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeDate = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute("download", `CornerStreams_Skipped_Rows_Audit_Log_${safeDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Skipped rows audit log (.csv) downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate CSV audit log.");
    }
  };

  // 11. DOWNLOAD SKIPPED ROWS AUDIT LOG (Excel .xlsx)
  const downloadSkippedRowsExcel = () => {
    if (!summaryResult || summaryResult.skippedRows.length === 0) {
      toast.info("No skipped or failed rows to export.");
      return;
    }

    try {
      const headers = [
        "Spreadsheet Row #",
        "Student Full Name",
        "Target Class",
        "Age",
        "Gender",
        "Parent Email",
        "Parent Phone",
        "Balance Due (NGN)",
        "Admission Number",
        "Failed Fields",
        "Validation Failure Details",
        "Suggested Action"
      ];

      const rows = summaryResult.skippedRows.map(item => [
        item.rawRowNumber,
        item.data.name || "N/A",
        item.data.class_name || "N/A",
        item.data.age || "N/A",
        item.data.gender || "N/A",
        item.data.parent_email || "N/A",
        item.data.parent_phone || "N/A",
        item.data.balance_due || 0,
        item.data.admission_no || "N/A",
        Object.keys(item.errors).join("; "),
        item.reasons.join(" | "),
        item.suggestedFix
      ]);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      ws["!cols"] = [
        { wch: 18 }, { wch: 26 }, { wch: 16 }, { wch: 8 }, 
        { wch: 10 }, { wch: 28 }, { wch: 18 }, { wch: 18 },
        { wch: 18 }, { wch: 24 }, { wch: 45 }, { wch: 35 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Skipped Rows Audit");

      // Also append successfully imported tab if any
      if (summaryResult.importedStudents.length > 0) {
        const successHeaders = [
          "Admission Number",
          "Student Full Name",
          "Class / Cohort",
          "Age",
          "Gender",
          "Parent Email",
          "Parent Phone",
          "Balance Due (NGN)",
          "Blood Group",
          "Genotype",
          "Portal Username"
        ];
        const successRows = summaryResult.importedStudents.map(st => [
          st.admission_no,
          st.name,
          st.class_name,
          st.age,
          st.gender,
          st.parent_email,
          st.parent_phone || "N/A",
          st.balance_due,
          st.blood_group || "N/A",
          st.genotype || "N/A",
          st.login_email || "N/A"
        ]);
        const wsSuccess = XLSX.utils.aoa_to_sheet([successHeaders, ...successRows]);
        wsSuccess["!cols"] = [
          { wch: 18 }, { wch: 26 }, { wch: 16 }, { wch: 8 },
          { wch: 10 }, { wch: 28 }, { wch: 18 }, { wch: 18 },
          { wch: 12 }, { wch: 10 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, wsSuccess, "Imported Students");
      }

      const safeDate = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `CornerStreams_Skipped_Rows_Audit_Log_${safeDate}.xlsx`);
      toast.success("Skipped rows Excel audit log (.xlsx) downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel audit log.");
    }
  };

  // 12. DOWNLOAD JSON FULL AUDIT REPORT
  const downloadAuditLogJson = () => {
    if (!summaryResult) return;
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(summaryResult, null, 2));
      const downloadAnchor = document.createElement("a");
      const safeDate = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `CornerStreams_Import_Audit_${safeDate}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Complete JSON diagnostic report downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download JSON audit report.");
    }
  };

  // 13. DOWNLOAD ENROLLED STUDENTS REGISTER (CSV)
  const downloadEnrolledStudentsCsv = () => {
    if (!summaryResult || summaryResult.importedStudents.length === 0) {
      toast.info("No enrolled students in this session to export.");
      return;
    }

    try {
      const headers = [
        "Admission Number",
        "Student Full Name",
        "Class / Cohort",
        "Age",
        "Gender",
        "Parent Email",
        "Parent Phone",
        "Balance Due (NGN)",
        "Blood Group",
        "Genotype",
        "Portal Login Email"
      ];

      const rows = summaryResult.importedStudents.map(st => [
        st.admission_no || "N/A",
        st.name,
        st.class_name,
        String(st.age),
        st.gender,
        st.parent_email,
        st.parent_phone || "N/A",
        String(st.balance_due),
        st.blood_group || "N/A",
        st.genotype || "N/A",
        st.login_email || "N/A"
      ]);

      const csvContent = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeDate = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute("download", `CornerStreams_Enrolled_Register_${safeDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Enrolled student register (.csv) downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export enrolled student roster.");
    }
  };

  // 14. RETRY ONLY SKIPPED ROWS
  const handleRetrySkippedRows = () => {
    if (!summaryResult || summaryResult.skippedRows.length === 0) return;

    const existingDbStudents = JSON.parse(localStorage.getItem("CS_STUDENTS_LIST") || "[]");

    // Convert skipped rows back into validatedRows so the admin can fix and re-import
    const retryRows: ValidatedStudentRow[] = summaryResult.skippedRows.map((sr, idx) => {
      const cleanStudent: StudentRowItem = {
        id: sr.data.id || `st-retry-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: sr.data.name || "",
        class_name: sr.data.class_name || existingClasses[0] || "SS 2 Science",
        age: sr.data.age || 16,
        gender: sr.data.gender || "Male",
        parent_email: sr.data.parent_email || "",
        parent_phone: sr.data.parent_phone,
        balance_due: sr.data.balance_due || 0,
        admission_no: sr.data.admission_no,
        blood_group: sr.data.blood_group || "O+",
        genotype: sr.data.genotype || "AA",
        login_email: sr.data.login_email,
        term_average: 65
      };

      return validateStudentRecord(cleanStudent, idx, [], existingDbStudents, sr.rawRowNumber);
    });

    setValidatedRows(retryRows);
    setCurrentStep(3);
    toast.info(`Loaded ${retryRows.length} skipped records into the validation table. Fix errors and re-import.`);
  };

  const handleClose = () => {
    setFile(null);
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setValidatedRows([]);
    setEditingRowIndex(null);
    setEditFormData({});
    setSearchQuery("");
    setSummaryResult(null);
    setSummarySearchQuery("");
    setCurrentStep(1);
    setOpenDropdownKey(null);
    onOpenChange(false);
  };

  // Helper calculation for Mapping Health
  const requiredFields = useMemo(() => PLATFORM_SCHEMA_FIELDS.filter(f => f.required), []);
  const mappedRequiredCount = useMemo(() => {
    return requiredFields.filter(f => Boolean(columnMapping[f.key])).length;
  }, [requiredFields, columnMapping]);
  const isMappingComplete = mappedRequiredCount === requiredFields.length;

  // Live sample preview based on current mapping
  const liveSampleRows = useMemo(() => {
    if (rawRows.length === 0) return [];
    return rawRows.slice(0, 3).map((raw, idx) => {
      const studentName = columnMapping.name ? raw[columnMapping.name] : `Student #${idx + 1}`;
      const className = columnMapping.class_name ? raw[columnMapping.class_name] : "SS 2 Science";
      const age = columnMapping.age ? raw[columnMapping.age] : 16;
      const gender = columnMapping.gender ? raw[columnMapping.gender] : "Male";
      const parentEmail = columnMapping.parent_email ? raw[columnMapping.parent_email] : "parent@example.com";
      const balanceDue = columnMapping.balance_due ? raw[columnMapping.balance_due] : 0;
      const admissionNo = columnMapping.admission_no ? raw[columnMapping.admission_no] : `CS-2026-00${idx + 1}`;

      return {
        name: studentName,
        class_name: className,
        age,
        gender,
        parent_email: parentEmail,
        balance_due: balanceDue,
        admission_no: admissionNo
      };
    });
  }, [rawRows, columnMapping]);

  // Filtered rows for Step 3 Presentation
  const validCount = validatedRows.filter(r => r.status === "valid").length;
  const warningCount = validatedRows.filter(r => r.status === "warning").length;
  const errorCount = validatedRows.filter(r => r.status === "error").length;

  const displayedRows = validatedRows.filter(row => {
    if (activeFilter === "valid" && row.status !== "valid") return false;
    if (activeFilter === "errors" && row.status !== "error") return false;
    if (activeFilter === "warnings" && row.status !== "warning") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        row.data.name.toLowerCase().includes(q) ||
        row.data.class_name.toLowerCase().includes(q) ||
        row.data.parent_email.toLowerCase().includes(q) ||
        (row.data.admission_no && row.data.admission_no.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered lists for Step 4
  const filteredSkippedList = useMemo(() => {
    if (!summaryResult) return [];
    if (!summarySearchQuery.trim()) return summaryResult.skippedRows;
    const q = summarySearchQuery.toLowerCase();
    return summaryResult.skippedRows.filter(sr => 
      (sr.data.name && sr.data.name.toLowerCase().includes(q)) ||
      (sr.data.class_name && sr.data.class_name.toLowerCase().includes(q)) ||
      (sr.data.parent_email && sr.data.parent_email.toLowerCase().includes(q)) ||
      sr.reasons.some(r => r.toLowerCase().includes(q))
    );
  }, [summaryResult, summarySearchQuery]);

  const filteredSuccessList = useMemo(() => {
    if (!summaryResult) return [];
    if (!summarySearchQuery.trim()) return summaryResult.importedStudents;
    const q = summarySearchQuery.toLowerCase();
    return summaryResult.importedStudents.filter(st => 
      st.name.toLowerCase().includes(q) ||
      st.class_name.toLowerCase().includes(q) ||
      st.parent_email.toLowerCase().includes(q) ||
      (st.admission_no && st.admission_no.toLowerCase().includes(q))
    );
  }, [summaryResult, summarySearchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white border border-slate-200 shadow-2xl rounded-2xl"
        onClick={() => {
          // Close custom select dropdowns when clicking outside
          if (openDropdownKey) setOpenDropdownKey(null);
        }}
      >
        
        {/* HEADER & STEPPER SECTION */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Enrollment Ingestion Engine
                </span>
                <span className="text-slate-400 text-[10px] font-mono">• CSV / Excel Schema Mapper</span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Batch Student Ingestion &amp; Schema Mapper</span>
              </DialogTitle>
            </div>

            {/* Template Download Buttons */}
            {currentStep !== 4 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Download CSV sample template"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV Template</span>
                </button>

                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="h-8 px-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Download Excel (.xlsx) formatted template"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  <span>Excel Template</span>
                </button>
              </div>
            )}
          </div>

          {/* STEPPER PROGRESS BAR (4 STEPS) */}
          <div className="grid grid-cols-4 gap-2 pt-4 mt-1 border-t border-slate-800/80">
            {/* Step 1 */}
            <div 
              onClick={() => { if (rawRows.length > 0 && currentStep !== 4) setCurrentStep(1); }}
              className={`flex items-center gap-2 p-1.5 rounded-lg transition text-left ${
                currentStep === 4 ? "cursor-default text-slate-400" : "cursor-pointer"
              } ${
                currentStep === 1 
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/30" 
                  : rawRows.length > 0 
                  ? "text-slate-300 hover:bg-slate-800/50" 
                  : "text-slate-500"
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                currentStep === 1 
                  ? "bg-emerald-500 text-slate-950 font-black" 
                  : rawRows.length > 0 
                  ? "bg-emerald-500/30 text-emerald-300" 
                  : "bg-slate-800 text-slate-500"
              }`}>
                {rawRows.length > 0 && currentStep !== 1 ? "✓" : "1"}
              </div>
              <div className="truncate">
                <span className="text-[11px] font-bold block leading-none">Upload</span>
                <span className="text-[9px] text-slate-400 truncate">
                  {file ? file.name : "CSV / XLSX"}
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div 
              onClick={() => { if (rawRows.length > 0 && currentStep !== 4) setCurrentStep(2); }}
              className={`flex items-center gap-2 p-1.5 rounded-lg transition text-left ${
                currentStep === 4 ? "cursor-default text-slate-400" : rawRows.length > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              } ${
                currentStep === 2 
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/30" 
                  : validatedRows.length > 0 
                  ? "text-slate-300 hover:bg-slate-800/50" 
                  : "text-slate-500"
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                currentStep === 2 
                  ? "bg-emerald-500 text-slate-950 font-black" 
                  : validatedRows.length > 0 
                  ? "bg-emerald-500/30 text-emerald-300" 
                  : "bg-slate-800 text-slate-500"
              }`}>
                {validatedRows.length > 0 && currentStep > 2 ? "✓" : "2"}
              </div>
              <div className="truncate">
                <span className="text-[11px] font-bold block leading-none">Mapping</span>
                <span className="text-[9px] text-slate-400 truncate">
                  {rawRows.length > 0 ? `${mappedRequiredCount}/${requiredFields.length} Req` : "Schema"}
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div 
              onClick={() => { if (validatedRows.length > 0 && currentStep !== 4) setCurrentStep(3); }}
              className={`flex items-center gap-2 p-1.5 rounded-lg transition text-left ${
                currentStep === 4 ? "cursor-default text-slate-400" : validatedRows.length > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              } ${
                currentStep === 3 
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/30" 
                  : currentStep === 4
                  ? "text-slate-300 hover:bg-slate-800/50"
                  : "text-slate-500"
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                currentStep === 3 
                  ? "bg-emerald-500 text-slate-950 font-black" 
                  : currentStep === 4
                  ? "bg-emerald-500/30 text-emerald-300" 
                  : "bg-slate-800 text-slate-500"
              }`}>
                {currentStep === 4 ? "✓" : "3"}
              </div>
              <div className="truncate">
                <span className="text-[11px] font-bold block leading-none">Validate</span>
                <span className="text-[9px] text-slate-400 truncate">
                  {validatedRows.length > 0 ? `${validatedRows.length} Rows` : "Inspector"}
                </span>
              </div>
            </div>

            {/* Step 4 */}
            <div 
              className={`flex items-center gap-2 p-1.5 rounded-lg transition text-left ${
                currentStep === 4 
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/30" 
                  : "text-slate-500 opacity-60"
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                currentStep === 4 
                  ? "bg-emerald-500 text-slate-950 font-black" 
                  : "bg-slate-800 text-slate-500"
              }`}>
                4
              </div>
              <div className="truncate">
                <span className="text-[11px] font-bold block leading-none">Summary</span>
                <span className="text-[9px] text-slate-400 truncate">
                  {summaryResult ? `${summaryResult.successfulCount} Ingested` : "Audit Log"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WORKSPACE BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* =========================================================================
              STEP 1: UPLOAD DROPZONE
              ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  setDragOver(false); 
                  if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); 
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3.5 transition-all text-center ${
                  dragOver 
                    ? "border-emerald-500 bg-emerald-50/50 scale-[0.99]" 
                    : "border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/30"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-sm">
                  <Upload className="w-7 h-7" />
                </div>

                <div className="space-y-1 max-w-md">
                  <h4 className="text-sm font-bold text-slate-900">
                    Click to browse or drag &amp; drop student CSV / Excel file
                  </h4>
                  <p className="text-xs text-slate-500">
                    Supports <strong className="text-slate-700">.CSV, .XLSX, .XLS</strong> files. You can map any custom column names (e.g., "Full Name", "Student ID", "Tuition Due") in the next step!
                  </p>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".xlsx,.xls,.csv" 
                />

                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                  <Button 
                    type="button"
                    variant="default" 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md pointer-events-none"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                    Select Local File (.csv / .xlsx)
                  </Button>

                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    disabled={isGoogleLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoogleSheetImport();
                    }}
                    className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-4 py-2 rounded-xl text-xs shadow-sm hover:border-emerald-500"
                  >
                    {isGoogleLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1.5 animate-spin text-emerald-600" />
                        Connecting Google Drive...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                          <path fill="#0F9D58" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                          <path fill="#FFF" d="M14 6H7v12h10V9l-3-3zm-1 3.5V7.5L15.5 10H13zM9 13h6v1.5H9V13zm0-2h6v1.5H9V11zm0 4h4v1.5H9V15z"/>
                        </svg>
                        Import with Google Picker / Sheets
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* FIELD VALIDATION GUIDELINES CARD */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Supported Platform Fields &amp; Auto-Detection
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    {showInstructions ? "Hide details" : "View schema specification"}
                  </button>
                </div>

                {showInstructions && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-[11px] border-t border-slate-200">
                    {PLATFORM_SCHEMA_FIELDS.map(f => (
                      <div key={f.key} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-indigo-950 font-bold">{f.label}</strong>
                          {f.required ? (
                            <Badge className="bg-rose-50 text-rose-700 text-[9px] font-bold border-rose-200">Required</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-600 text-[9px] font-bold">Optional</Badge>
                          )}
                        </div>
                        <p className="text-slate-500 text-[10.5px] leading-tight">{f.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 2: COLUMN MAPPING & SCHEMA MATCHING INTERFACE
              ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              
              {/* TOP MAPPING RIBBON & HEALTH INDICATOR */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900">
                        Map CSV Columns to Corner Streams Fields
                      </h4>
                      <Badge className="bg-slate-200 text-slate-700 text-[10px] font-mono">
                        {rawHeaders.length} Columns Detected
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Select which column in your spreadsheet corresponds to each required and optional learner field.
                    </span>
                  </div>
                </div>

                {/* Mapping Controls / Presets */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const detected = autoDetectMappings(rawHeaders);
                      setColumnMapping(detected);
                      toast.success("Re-evaluated smart column mappings based on header aliases.");
                    }}
                    className="h-8 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Auto-detect matches"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Auto-Match</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cleared: Record<string, string> = {};
                      PLATFORM_SCHEMA_FIELDS.forEach(f => { cleared[f.key] = ""; });
                      setColumnMapping(cleared);
                      toast.info("Cleared all column mappings.");
                    }}
                    className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* MAPPING STATUS BADGE SUMMARY */}
              <div className="p-3 bg-indigo-950 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center ${
                    isMappingComplete ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`} />
                  <span className="font-bold">
                    {isMappingComplete ? (
                      <span className="text-emerald-300">✅ All {requiredFields.length} Required Schema Fields Successfully Mapped</span>
                    ) : (
                      <span className="text-amber-300">⚠️ {requiredFields.length - mappedRequiredCount} Required Schema Field(s) Remaining</span>
                    )}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 font-mono">
                  {rawRows.length} data rows ready to ingest
                </div>
              </div>

              {/* COLUMN MAPPING ACCORDION / GRID */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-100/70 border-b border-slate-200 grid grid-cols-12 text-xs font-bold text-slate-600">
                  <div className="col-span-12 sm:col-span-5">Corner Streams Target Field</div>
                  <div className="col-span-12 sm:col-span-7">Source Column in Uploaded File &amp; Preview</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {PLATFORM_SCHEMA_FIELDS.map((schema) => {
                    const isMapped = Boolean(columnMapping[schema.key]);
                    const selectedColumn = columnMapping[schema.key] || "";
                    const sampleValue = selectedColumn && rawRows[0] ? rawRows[0][selectedColumn] : "";
                    const isDropdownOpen = openDropdownKey === schema.key;

                    return (
                      <div 
                        key={schema.key} 
                        className={`p-3.5 transition-colors grid grid-cols-12 gap-3 items-center ${
                          schema.required && !isMapped 
                            ? "bg-rose-50/50" 
                            : isMapped 
                            ? "bg-white hover:bg-slate-50/60" 
                            : "bg-slate-50/30"
                        }`}
                      >
                        {/* Target Field Info */}
                        <div className="col-span-12 sm:col-span-5 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{schema.label}</span>
                            {schema.required ? (
                              <Badge className="bg-rose-100 text-rose-700 text-[9px] font-bold border-rose-200">
                                Required
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-500 text-[9px]">
                                Optional
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10.5px] text-slate-500 leading-snug">
                            {schema.description}
                          </p>
                        </div>

                        {/* Custom Select Box */}
                        <div className="col-span-12 sm:col-span-7 relative">
                          <div className="flex items-center gap-2">
                            
                            {/* CUSTOM SELECT TRIGGER */}
                            <div className="relative flex-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownKey(isDropdownOpen ? null : schema.key);
                                }}
                                className={`w-full h-9 px-3 text-xs rounded-xl border flex items-center justify-between transition-all text-left bg-white cursor-pointer ${
                                  schema.required && !isMapped
                                    ? "border-rose-300 ring-2 ring-rose-100 text-slate-700"
                                    : isMapped
                                    ? "border-emerald-400 bg-emerald-50/20 text-slate-900 font-semibold"
                                    : "border-slate-300 text-slate-500 hover:border-indigo-400"
                                }`}
                              >
                                <span className="truncate">
                                  {selectedColumn ? (
                                    <span className="flex items-center gap-1.5 text-slate-800">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <strong>{selectedColumn}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">-- Do Not Map / Skip Field --</span>
                                  )}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                              </button>

                              {/* CUSTOM POPUP SELECT OPTIONS (Strictly No Native Selects) */}
                              {isDropdownOpen && (
                                <div 
                                  className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Skip option */}
                                  <div
                                    onClick={() => {
                                      setColumnMapping(prev => ({ ...prev, [schema.key]: "" }));
                                      setOpenDropdownKey(null);
                                    }}
                                    className={`p-2.5 text-xs text-slate-500 hover:bg-slate-100 cursor-pointer flex items-center justify-between ${
                                      !selectedColumn ? "bg-slate-100 font-bold text-slate-900" : ""
                                    }`}
                                  >
                                    <span className="italic">-- Do Not Map (Skip this field) --</span>
                                    {!selectedColumn && <Check className="w-3.5 h-3.5 text-slate-600" />}
                                  </div>

                                  {/* Header Options from CSV */}
                                  {rawHeaders.map((header) => {
                                    const isSelected = selectedColumn === header;
                                    const sampleVal = rawRows[0] ? rawRows[0][header] : "";
                                    
                                    return (
                                      <div
                                        key={header}
                                        onClick={() => {
                                          setColumnMapping(prev => ({ ...prev, [schema.key]: header }));
                                          setOpenDropdownKey(null);
                                        }}
                                        className={`p-2.5 text-xs cursor-pointer transition flex items-center justify-between ${
                                          isSelected 
                                            ? "bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 text-white font-bold" 
                                            : "hover:bg-emerald-50 hover:text-emerald-900 text-slate-800"
                                        }`}
                                      >
                                        <div className="truncate pr-2">
                                          <div className="font-semibold">{header}</div>
                                          {sampleVal !== undefined && sampleVal !== "" && (
                                            <span className={`text-[10px] truncate block ${isSelected ? "text-emerald-100 font-normal" : "text-slate-400"}`}>
                                              e.g., "{String(sampleVal)}"
                                            </span>
                                          )}
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Clear Selection Button */}
                            {isMapped && (
                              <button
                                type="button"
                                onClick={() => setColumnMapping(prev => ({ ...prev, [schema.key]: "" }))}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Unmap this field"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Real sample value hint under selector */}
                          {isMapped && sampleValue !== "" && (
                            <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-slate-500 font-mono">
                              <span className="text-slate-400">Row 1 preview:</span>
                              <strong className="text-indigo-900 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-xs">
                                {String(sampleValue)}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LIVE TRANSFORMATION PREVIEW OF FIRST 3 ROWS */}
              {liveSampleRows.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-indigo-600" />
                      Live Data Transformation Preview (First 3 Records)
                    </span>
                    <Badge className="bg-white text-slate-600 border border-slate-200 text-[10px]">
                      Simulated Ingestion Output
                    </Badge>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2 font-mono text-[10px]">#</th>
                          <th className="p-2">Learner Full Name</th>
                          <th className="p-2">Allocated Class</th>
                          <th className="p-2">Age / Gender</th>
                          <th className="p-2">Parent Contact Email</th>
                          <th className="p-2 text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {liveSampleRows.map((sample, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-2 text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-sans font-bold text-slate-900">{sample.name || "--"}</td>
                            <td className="p-2 text-indigo-700">{sample.class_name || "--"}</td>
                            <td className="p-2 text-slate-600">{sample.age} yrs • {sample.gender}</td>
                            <td className="p-2 text-slate-600">{sample.parent_email || "--"}</td>
                            <td className="p-2 text-right text-emerald-700 font-bold">₦{Number(sample.balance_due || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              STEP 3: VALIDATION & EDIT INSPECTOR TABLE
              ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              
              {/* STATUS SUMMARY RIBBON */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    activeFilter === "all" ? "bg-indigo-950 text-white border-indigo-900 shadow-sm" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Total Rows</span>
                    <span className="text-base font-black">{validatedRows.length}</span>
                  </div>
                  <FileSpreadsheet className="w-5 h-5 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("valid")}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    activeFilter === "valid" ? "bg-emerald-700 text-white border-emerald-800 shadow-sm" : "bg-emerald-50/50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/60"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Clean / Valid</span>
                    <span className="text-base font-black">{validCount}</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("warnings")}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    activeFilter === "warnings" ? "bg-amber-600 text-white border-amber-700 shadow-sm" : "bg-amber-50/50 text-amber-800 border-amber-200 hover:bg-amber-100/60"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Warnings</span>
                    <span className="text-base font-black">{warningCount}</span>
                  </div>
                  <AlertTriangle className="w-5 h-5 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("errors")}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    activeFilter === "errors" ? "bg-rose-700 text-white border-rose-800 shadow-sm" : "bg-rose-50/50 text-rose-800 border-rose-200 hover:bg-rose-100/60"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">Critical Errors</span>
                    <span className="text-base font-black">{errorCount}</span>
                  </div>
                  <AlertCircle className="w-5 h-5 opacity-70" />
                </button>
              </div>

              {/* SEARCH & AUTO-FIX CONTROLS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input 
                    type="text"
                    placeholder="Search candidate, class, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 pl-8 text-xs bg-slate-50 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleAutoFix}
                    className="h-8 px-3 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Auto-standardize titles, genders, default ages and clean spaces"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Auto-Standardize All</span>
                  </button>
                </div>
              </div>

              {/* VALIDATION DATA TABLE */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2.5 font-mono text-[10px] text-slate-500">Row #</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Student Full Name</th>
                        <th className="p-2.5">Class / Stream</th>
                        <th className="p-2.5 text-center">Age</th>
                        <th className="p-2.5 text-center">Gender</th>
                        <th className="p-2.5">Parent Contact Email</th>
                        <th className="p-2.5 text-right">Balance Due</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedRows.map((row) => {
                        const isEditing = editingRowIndex === row.index;
                        const isGenderOpen = inlineGenderOpenIndex === row.index;

                        return (
                          <tr 
                            key={row.index} 
                            className={`transition-colors ${
                              row.status === "error" 
                                ? "bg-rose-50/40 hover:bg-rose-50/70" 
                                : row.status === "warning" 
                                ? "bg-amber-50/30 hover:bg-amber-50/60" 
                                : "hover:bg-slate-50/60"
                            }`}
                          >
                            {/* Line Number */}
                            <td className="p-2.5 font-mono text-[11px] text-slate-400 font-bold">
                              #{row.rawRowNumber}
                            </td>

                            {/* Status Flag */}
                            <td className="p-2.5">
                              {row.status === "valid" && (
                                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-emerald-200">
                                  Valid
                                </Badge>
                              )}
                              {row.status === "warning" && (
                                <span title={Object.values(row.warnings).join(" ")}>
                                  <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-amber-200">
                                    Warning
                                  </Badge>
                                </span>
                              )}
                              {row.status === "error" && (
                                <span title={Object.values(row.errors).join(" ")}>
                                  <Badge className="bg-rose-100 text-rose-800 text-[10px] font-bold border-rose-200">
                                    Invalid
                                  </Badge>
                                </span>
                              )}
                            </td>

                            {/* Student Name */}
                            <td className="p-2.5">
                              {isEditing ? (
                                <Input 
                                  value={editFormData.name ?? ""} 
                                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                  className="h-7 text-xs bg-white"
                                />
                              ) : (
                                <div>
                                  <span className={`font-bold ${row.errors.name ? "text-rose-700 underline font-semibold" : "text-slate-900"}`}>
                                    {row.data.name}
                                  </span>
                                  {row.errors.name && (
                                    <span className="text-[10px] text-rose-600 block">⚠️ {row.errors.name}</span>
                                  )}
                                  {row.warnings.name && !row.errors.name && (
                                    <span className="text-[10px] text-amber-600 block">{row.warnings.name}</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Class */}
                            <td className="p-2.5">
                              {isEditing ? (
                                <Input 
                                  value={editFormData.class_name ?? ""} 
                                  onChange={(e) => setEditFormData({ ...editFormData, class_name: e.target.value })}
                                  className="h-7 text-xs bg-white"
                                />
                              ) : (
                                <div>
                                  <span className={`font-medium ${row.errors.class_name ? "text-rose-700 font-bold underline" : "text-indigo-700 font-semibold"}`}>
                                    {row.data.class_name}
                                  </span>
                                  {row.warnings.class_name && (
                                    <span className="text-[10px] text-amber-600 block">✨ Auto-create class</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Age */}
                            <td className="p-2.5 text-center">
                              {isEditing ? (
                                <Input 
                                  type="number"
                                  value={editFormData.age ?? ""} 
                                  onChange={(e) => setEditFormData({ ...editFormData, age: Number(e.target.value) })}
                                  className="h-7 w-14 text-xs bg-white text-center mx-auto"
                                />
                              ) : (
                                <span className={`font-mono ${row.errors.age ? "text-rose-700 font-bold underline" : "text-slate-700"}`}>
                                  {row.data.age}
                                </span>
                              )}
                            </td>

                            {/* Gender */}
                            <td className="p-2.5 text-center relative">
                              {isEditing ? (
                                <div className="relative inline-block text-left">
                                  <button
                                    type="button"
                                    onClick={() => setInlineGenderOpenIndex(isGenderOpen ? null : row.index)}
                                    className="h-7 px-2 border rounded-md text-xs bg-white flex items-center justify-between gap-1 cursor-pointer"
                                  >
                                    <span>{editFormData.gender || "Male"}</span>
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  </button>
                                  {isGenderOpen && (
                                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 w-24">
                                      <div 
                                        onClick={() => { setEditFormData({ ...editFormData, gender: "Male" }); setInlineGenderOpenIndex(null); }}
                                        className="px-2.5 py-1 text-xs hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer"
                                      >
                                        Male
                                      </div>
                                      <div 
                                        onClick={() => { setEditFormData({ ...editFormData, gender: "Female" }); setInlineGenderOpenIndex(null); }}
                                        className="px-2.5 py-1 text-xs hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer"
                                      >
                                        Female
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className={row.errors.gender ? "text-rose-700 font-bold" : "text-slate-700"}>
                                  {row.data.gender}
                                </span>
                              )}
                            </td>

                            {/* Parent Email */}
                            <td className="p-2.5">
                              {isEditing ? (
                                <Input 
                                  type="email"
                                  value={editFormData.parent_email ?? ""} 
                                  onChange={(e) => setEditFormData({ ...editFormData, parent_email: e.target.value })}
                                  className="h-7 text-xs bg-white"
                                />
                              ) : (
                                <div>
                                  <span className={`font-mono ${row.errors.parent_email ? "text-rose-700 font-bold underline" : "text-slate-600"}`}>
                                    {row.data.parent_email}
                                  </span>
                                  {row.errors.parent_email && (
                                    <span className="text-[10px] text-rose-600 block">⚠️ {row.errors.parent_email}</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Balance */}
                            <td className="p-2.5 text-right">
                              {isEditing ? (
                                <Input 
                                  type="number"
                                  value={editFormData.balance_due ?? ""} 
                                  onChange={(e) => setEditFormData({ ...editFormData, balance_due: Number(e.target.value) })}
                                  className="h-7 text-xs bg-white text-right"
                                />
                              ) : (
                                <span className="font-mono font-bold text-emerald-700">
                                  ₦{(row.data.balance_due || 0).toLocaleString()}
                                </span>
                              )}
                            </td>

                            {/* Actions (Edit/Save/Delete) */}
                            <td className="p-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(row.index)}
                                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition cursor-pointer"
                                      title="Save Edits"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingRowIndex(null)}
                                      className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(row)}
                                      className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                                      title="Edit Record"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRow(row.index)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                      title="Remove Row"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {displayedRows.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                            No records match the selected filter query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* IMPORT SETTINGS TOGGLES */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipInvalid}
                    onChange={(e) => setSkipInvalid(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-slate-700 font-medium">
                    Automatically skip rows with critical errors during import ({errorCount} rows)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={createParentAccounts}
                    onChange={(e) => setCreateParentAccounts(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-slate-700 font-medium">
                    Auto-register linked parent accounts in Directory
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 4: SUMMARY VIEW & SKIPPED ROWS AUDIT LOG (USER REQUEST)
              ========================================================================= */}
          {currentStep === 4 && summaryResult && (
            <div className="space-y-4">
              
              {/* HERO RESULT CARD */}
              <div className={`p-5 rounded-2xl text-white relative overflow-hidden shadow-lg ${
                summaryResult.failedCount === 0 
                  ? "bg-gradient-to-br from-indigo-950 via-indigo-900 to-emerald-950 border border-emerald-500/30" 
                  : "bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-800"
              }`}>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                        Ingestion Complete
                      </Badge>
                      <span className="text-slate-400 text-xs font-mono">
                        Source: {summaryResult.fileName}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                      {summaryResult.failedCount === 0 ? (
                        <>
                          <CheckCheck className="w-6 h-6 text-emerald-400" />
                          <span>100% Ingestion Success! All {summaryResult.successfulCount} Students Onboarded</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          <span>
                            {summaryResult.successfulCount} Students Ingested • {summaryResult.failedCount} Row(s) Excluded
                          </span>
                        </>
                      )}
                    </h3>

                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Learner profiles have been synced to the Digital Identity Registry and Enrollment records. Parent accounts and classroom streams have been verified.
                    </p>
                  </div>

                  {/* Summary Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {summaryResult.failedCount > 0 && (
                      <button
                        type="button"
                        onClick={downloadSkippedRowsCsv}
                        className="h-9 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                        title="Download CSV audit log of skipped rows"
                      >
                        <Download className="w-4 h-4 text-white" />
                        <span>Download Skipped Log (CSV)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={downloadEnrolledStudentsCsv}
                      className="h-9 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                      title="Download clean CSV of newly enrolled students"
                    >
                      <FileDown className="w-4 h-4 text-emerald-400" />
                      <span>Export Enrolled (CSV)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 METRIC STATS CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Successfully Imported */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-emerald-700">
                    <span className="text-[11px] font-black uppercase tracking-wider">Successfully Ingested</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-emerald-950">
                    {summaryResult.successfulCount}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium block">
                    {Math.round((summaryResult.successfulCount / (summaryResult.totalProcessed || 1)) * 100)}% of submitted batch
                  </span>
                </div>

                {/* 2. Skipped / Failed Rows */}
                <div className={`p-3.5 rounded-2xl border space-y-1 ${
                  summaryResult.failedCount > 0 
                    ? "bg-rose-50/70 border-rose-200" 
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <div className={`flex items-center justify-between ${
                    summaryResult.failedCount > 0 ? "text-rose-700" : "text-slate-600"
                  }`}>
                    <span className="text-[11px] font-black uppercase tracking-wider">Skipped / Flagged</span>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className={`text-2xl font-black ${
                    summaryResult.failedCount > 0 ? "text-rose-950" : "text-slate-900"
                  }`}>
                    {summaryResult.failedCount}
                  </div>
                  <span className={`text-[10px] font-medium block ${
                    summaryResult.failedCount > 0 ? "text-rose-700" : "text-slate-500"
                  }`}>
                    {summaryResult.failedCount > 0 ? "Diagnostic log available" : "Zero errors encountered"}
                  </span>
                </div>

                {/* 3. Parent Accounts Created */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-indigo-700">
                    <span className="text-[11px] font-black uppercase tracking-wider">Parent Portals</span>
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-indigo-950">
                    {summaryResult.parentAccountsCreated}
                  </div>
                  <span className="text-[10px] text-indigo-700 font-medium block">
                    Mapped in Directory
                  </span>
                </div>

                {/* 4. Classroom Cohorts */}
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-purple-700">
                    <span className="text-[11px] font-black uppercase tracking-wider">Cohorts Updated</span>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-purple-950">
                    {summaryResult.classesUpdated}
                  </div>
                  <span className="text-[10px] text-purple-700 font-medium block">
                    {summaryResult.classesUpdated > 0 ? `${summaryResult.newClasses.join(", ")}` : "Existing streams used"}
                  </span>
                </div>
              </div>

              {/* SEGMENTED TAB SELECTOR: SKIPPED ROWS VS ENROLLED STUDENTS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-200">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSummaryTab("skipped")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      summaryTab === "skipped" 
                        ? "bg-white text-rose-700 shadow-xs" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Skipped / Flagged Rows ({summaryResult.failedCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSummaryTab("success")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      summaryTab === "success" 
                        ? "bg-white text-emerald-700 shadow-xs" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ingested Students ({summaryResult.successfulCount})</span>
                  </button>
                </div>

                {/* Filter Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder={`Search ${summaryTab === "skipped" ? "skipped" : "ingested"} records...`}
                    value={summarySearchQuery}
                    onChange={(e) => setSummarySearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-slate-50 rounded-xl"
                  />
                </div>
              </div>

              {/* ==========================================
                  TAB A: SKIPPED ROWS AUDIT LOG & EXPORT
                  ========================================== */}
              {summaryTab === "skipped" && (
                <div className="space-y-3">
                  {summaryResult.failedCount > 0 ? (
                    <>
                      {/* Diagnostic Alert */}
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-rose-900">
                              {summaryResult.failedCount} Row(s) were excluded from registry ingestion
                            </span>
                            <p className="text-[11px] text-rose-700">
                              These records were omitted to maintain clean, compliant student identity records. You can download the diagnostic audit log or retry importing just these rows.
                            </p>
                          </div>
                        </div>

                        {/* Export & Retry Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={downloadSkippedRowsCsv}
                            className="h-7.5 px-2.5 bg-white hover:bg-rose-100/60 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Download CSV audit log"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>CSV Log</span>
                          </button>

                          <button
                            type="button"
                            onClick={downloadSkippedRowsExcel}
                            className="h-7.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Download Excel formatted audit report"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Excel (.xlsx)</span>
                          </button>

                          <button
                            type="button"
                            onClick={downloadAuditLogJson}
                            className="h-7.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Download JSON Report"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>JSON</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRetrySkippedRows}
                            className="h-7.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Load skipped rows into validation table to fix and re-import"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Fix &amp; Retry</span>
                          </button>
                        </div>
                      </div>

                      {/* Skipped Rows Table */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto max-h-[320px]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 text-slate-700 font-bold">
                              <tr>
                                <th className="p-2.5 font-mono text-[10px]">Row #</th>
                                <th className="p-2.5">Candidate / Name</th>
                                <th className="p-2.5">Target Class</th>
                                <th className="p-2.5">Contact Attempted</th>
                                <th className="p-2.5">Specific Validation Failures</th>
                                <th className="p-2.5">Recommended Fix</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredSkippedList.map((sr) => (
                                <tr key={sr.index} className="hover:bg-rose-50/30 transition-colors">
                                  <td className="p-2.5 font-mono text-[11px] font-bold text-rose-700">
                                    Row {sr.rawRowNumber}
                                  </td>
                                  <td className="p-2.5 font-bold text-slate-900">
                                    {sr.data.name || <span className="text-slate-400 italic">[Empty Name]</span>}
                                  </td>
                                  <td className="p-2.5 text-slate-700 font-medium">
                                    {sr.data.class_name || <span className="text-slate-400 italic">[No Class]</span>}
                                  </td>
                                  <td className="p-2.5 font-mono text-slate-600 text-[11px]">
                                    {sr.data.parent_email || <span className="text-slate-400 italic">[Missing Email]</span>}
                                  </td>
                                  <td className="p-2.5 space-y-1">
                                    {sr.reasons.map((reason, rIdx) => (
                                      <span 
                                        key={rIdx} 
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-semibold mr-1 mb-1 border border-rose-200"
                                      >
                                        <AlertCircle className="w-3 h-3 text-rose-600" />
                                        <span>{reason}</span>
                                      </span>
                                    ))}
                                  </td>
                                  <td className="p-2.5 text-[11px] text-slate-600 italic">
                                    {sr.suggestedFix}
                                  </td>
                                </tr>
                              ))}

                              {filteredSkippedList.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                                    No skipped rows match the search query.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Zero errors clean state */
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-8 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-950">No Skipped Rows</h4>
                      <p className="text-xs text-emerald-700 max-w-md mx-auto">
                        Every single record in your batch import was validated and ingested with 100% compliance.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ==========================================
                  TAB B: INGESTED STUDENTS REGISTER
                  ========================================== */}
              {summaryTab === "success" && (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto max-h-[320px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 text-slate-700 font-bold">
                          <tr>
                            <th className="p-2.5 font-mono text-[10px]">Admission ID</th>
                            <th className="p-2.5">Learner Name</th>
                            <th className="p-2.5">Class Cohort</th>
                            <th className="p-2.5 text-center">Age / Sex</th>
                            <th className="p-2.5">Parent Contact</th>
                            <th className="p-2.5 text-right">Balance Due</th>
                            <th className="p-2.5 text-right">Registry Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredSuccessList.map((st, idx) => (
                            <tr key={st.id || idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-2.5 font-mono text-[11px] font-bold text-indigo-700">
                                {st.admission_no || `CS-2026-${String(idx + 1).padStart(4, "0")}`}
                              </td>
                              <td className="p-2.5 font-bold text-slate-900">
                                {st.name}
                              </td>
                              <td className="p-2.5 text-indigo-700 font-semibold">
                                {st.class_name}
                              </td>
                              <td className="p-2.5 text-center text-slate-600 font-mono text-[11px]">
                                {st.age} yrs • {st.gender}
                              </td>
                              <td className="p-2.5 font-mono text-slate-600 text-[11px]">
                                {st.parent_email}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                                ₦{(st.balance_due || 0).toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right">
                                <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-bold border-emerald-200">
                                  Enrolled &amp; Synced
                                </Badge>
                              </td>
                            </tr>
                          ))}

                          {filteredSuccessList.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                                No student records match the search filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* DIALOG FOOTER */}
        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex flex-row justify-between items-center shrink-0">
          <div>
            {currentStep === 1 ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClose}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
            ) : currentStep === 2 ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Upload</span>
              </Button>
            ) : currentStep === 3 ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentStep(2)}
                className="text-xs font-bold gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Mapping</span>
              </Button>
            ) : (
              /* Step 4: Summary back/restart options */
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setRawHeaders([]);
                  setRawRows([]);
                  setColumnMapping({});
                  setValidatedRows([]);
                  setSummaryResult(null);
                  setCurrentStep(1);
                }}
                className="text-xs font-bold gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Another Batch</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 2 && (
              <Button
                variant="default"
                size="sm"
                disabled={!isMappingComplete || loading}
                onClick={applyMappingAndValidate}
                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer gap-1.5"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mapping Data...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Validation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                variant="default"
                size="sm"
                disabled={loading || (skipInvalid ? (validCount + warningCount === 0) : errorCount > 0)}
                onClick={handleConfirmImport}
                className="h-9 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer gap-1.5"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Registry Sync...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Confirm &amp; Onboard {skipInvalid ? validCount + warningCount : validatedRows.length} Students
                    </span>
                  </>
                )}
              </Button>
            )}

            {currentStep === 4 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleClose}
                className="h-9 px-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Done &amp; View in Registry</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkUploadDialog;
