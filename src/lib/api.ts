import { mockUsers } from '../mockData';

// Setup Mock backend state in LocalStorage for dynamic user interaction
const initDb = () => {
  if (!localStorage.getItem("CS_SCHOOL")) {
    localStorage.setItem("CS_SCHOOL", JSON.stringify({
      id: "sch-1",
      name: "Corner Streams Private School",
      principal_name: "Chief Folasade Adebayo",
      address: "Block 12, Garki Area 11, Abuja, Nigeria",
      phone: "+234 814 188 0550",
      email: "bursar@cornerstreams.edu.ng",
      motto: "Knowledge. Discipline. Excellence.",
      logo_url: "",
      founded_year: "2004",
      website: "https://cornerstreams.edu.ng",
      brand_color: "#002147",
      ca_weights: [20, 20],
      exam_max: 60,
      subscription_tier: "unified_enterprise",
      subscription_duration: "full_session",
      subscription_expires_at: "2027-06-30T00:00:00.000",
      verification_status: "active",
      kill_switch: false,
      benchmark: 50,
      classes: ["Primary 1 Diamond", "Primary 2 Gold", "JSS 1 Crystal", "SS 2 Science", "SS 3 Art"]
    }));
  }

  if (!localStorage.getItem("CS_STUDENTS_LIST")) {
    const list = [
      { id: "st-1", name: "Folasade Amira Adekunle", class_name: "SS 2 Science", age: 16, gender: "Female", parent_email: "amira.adekunle@health.ng", balance_due: 0, login_email: "folasade@cornerstreams.edu.ng", term_average: 78 },
      { id: "st-2", name: "Jeremiah David Benson", class_name: "SS 2 Science", age: 17, gender: "Male", parent_email: "alaobenson@gmail.com", balance_due: 45000, login_email: "jeremiah@cornerstreams.edu.ng", term_average: 64 },
      { id: "st-3", name: "Chibuzor Emeka Silas", class_name: "SS 2 Science", age: 16, gender: "Male", parent_email: "amira.adekunle@health.ng", balance_due: 0, login_email: "chibuzor@cornerstreams.edu.ng", term_average: 55 },
      { id: "st-4", name: "Dada Oluwaseun Emmanuel", class_name: "SS 2 Science", age: 17, gender: "Male", parent_email: "seundada@gmail.com", balance_due: 80000, login_email: "oluwaseun@cornerstreams.edu.ng", term_average: 48 },
    ];
    localStorage.setItem("CS_STUDENTS_LIST", JSON.stringify(list));
  }

  if (!localStorage.getItem("CS_RECEIPTS")) {
    localStorage.setItem("CS_RECEIPTS", JSON.stringify([
      { id: "rcp-3", tier: "SS 2 Science Fee Clearance", duration: "1st Term", amount_ngn: 45000, status: "pending", created_at: "2026-06-25T11:45:00.000Z", submitted_by: "Chief Alao Benson", student_id: "st-2", whatsapp_code: "651928", "channel": "Wema ALAT Digital Transfer", "reference_id": "ALAT-TRF-4927163" },
      { id: "rcp-4", tier: "SS 2 Science Fee Clearance", duration: "1st Term", amount_ngn: 80000, status: "pending", created_at: "2026-06-26T14:15:00.000Z", submitted_by: "Hajia Fatima Yusuf", student_id: "st-4", whatsapp_code: "942183", "channel": "GTBank Instant Transfer", "reference_id": "GTB-REF-1048273" },
      { id: "rcp-1", tier: "financial_ledger", duration: "1_term", amount_ngn: 40000, status: "approved", created_at: "2026-01-10T12:00:00.000Z", submitted_by: "bursar@cornerstreams.edu.ng", whatsapp_code: "294827" },
      { id: "rcp-2", tier: "unified_enterprise", duration: "full_session", amount_ngn: 200000, status: "approved", created_at: "2026-05-15T09:30:00.000Z", submitted_by: "bursar@cornerstreams.edu.ng", whatsapp_code: "119483" }
    ]));
  }

  if (!localStorage.getItem("CS_SUBJECTS")) {
    localStorage.setItem("CS_SUBJECTS", JSON.stringify([
      { class_name: "SS 2 Science", subjects: ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Civic Education"] },
      { class_name: "SS 3 Art", subjects: ["English Language", "Literature in English", "Government", "Christian Religious Studies"] }
    ]));
  }

  if (!localStorage.getItem("CS_USERS_LIST")) {
    const list = [
      { id: "u-1", name: "Chief Folasade Adebayo", email: "bursar@cornerstreams.edu.ng", role: "school_admin", assigned_classes: [] },
      { id: "u-2", name: "Mrs. Folasade Adebayo", email: "f.adebayo@cornerstreams.edu", role: "teacher", assigned_class: "SS 2 Science", assigned_classes: ["SS 2 Science"], assigned_subjects: ["Mathematics", "Physics"], password_changed_by_user: false },
      { id: "u-3", name: "Dr. Amira Adekunle", email: "amira.adekunle@health.ng", role: "parent", password_changed_by_user: false },
      { id: "u-4", name: "Chief Alao Benson", email: "alaobenson@gmail.com", role: "parent", password_changed_by_user: false },
    ];
    localStorage.setItem("CS_USERS_LIST", JSON.stringify(list));
  }

  if (!localStorage.getItem("CS_MESSAGES")) {
    localStorage.setItem("CS_MESSAGES", JSON.stringify([
      { id: "msg-1", message_type: "announcement", target_role: "all", target_class: null, content: "Welcome back! Terminal exams resume next month. Ensure all student registries are accurate.", created_at: "2026-06-01T08:00:00.000Z", unread: true },
      { id: "msg-2", message_type: "material", target_role: "students", target_class: "SS 2 Science", content: "Physics Chapter 4: Waves, Oscillation & Harmonic Motion lecture notes", attachment_url: "https://example.com/physics_notes.pdf", created_at: "2026-06-10T14:20:00.000Z", unread: false }
    ]));
  }

  if (!localStorage.getItem("CS_CBT_EXAMS")) {
    localStorage.setItem("CS_CBT_EXAMS", JSON.stringify([
      {
        id: "ex-1",
        title: "SS 2 Mid-Term Mathematics Test",
        class_name: "SS 2 Science",
        subject: "Mathematics",
        term: "1st Term",
        year: "2025/2026",
        duration_min: 30,
        published: true,
        status: "published",
        question_count: 5,
        questions: [
          { type: "mcq", question: "Solve for x: 2x + 7 = 15", options: ["x = 4", "x = 5", "x = 8", "x = 3"], correct_idx: 0 },
          { type: "mcq", question: "What is the square root of 144?", options: ["12", "14", "10", "16"], correct_idx: 0 },
          { type: "mcq", question: "In a right-angled triangle, what is the sine of 90 degrees?", options: ["0", "0.5", "1", "0.866"], correct_idx: 2 },
          { type: "mcq", question: "What is 25 percent of 200?", options: ["50", "40", "25", "75"], correct_idx: 0 },
          { type: "true_false", question: "The sum of angles in a triangle is 180 degrees.", options: ["True", "False"], correct_idx: 0 }
        ]
      }
    ]));
  }

  const existingLeadsStr = localStorage.getItem("CS_LEADS");
  let existingLeads = [];
  try {
    existingLeads = existingLeadsStr ? JSON.parse(existingLeadsStr) : [];
  } catch (e) {
    existingLeads = [];
  }
  if (!Array.isArray(existingLeads) || existingLeads.length === 0) {
    localStorage.setItem("CS_LEADS", JSON.stringify([
      {
        id: "lead-1",
        school: "Royal Springlands High",
        name: "Mr. Ebenezer Nwosu",
        email: "springlandshigh@outlook.com",
        phone: "+2348162234123",
        message: "Hello Corner Streams, we would like a demo of the CBT Exam Engine. We have about 450 students. Kindly reach out via WhatsApp.",
        created_at: "2026-06-23",
        resolved: false
      },
      {
        id: "lead-2",
        school: "Golden Crest Model School",
        name: "Hajia Fatima Yusuf",
        email: "goldencrestmodel@gmail.com",
        phone: "+2347039988112",
        message: "Can we configure multiple CA columns for primary and secondary sections separately? We are a mixed school.",
        created_at: "2026-06-21",
        resolved: false
      },
      {
        id: "lead-3",
        school: "Excel Heritage Academy",
        name: "Dr. Stephen Okafor",
        email: "okafor.stephen@excelheritage.edu.ng",
        phone: "+2348056677889",
        message: "Our bursar really loved the financial ledger demo. We are making our transfer today. Please verify once we upload.",
        created_at: "2026-06-19",
        resolved: true
      }
    ]));
  }
};

initDb();

const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || "[]");
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const api = {
  get: async (url: string, config?: any) => {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 50));

    if (url === "/schools/me") {
      return { data: { school: JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}") } };
    }
    if (url === "/students") {
      return { data: { students: getLocal("CS_STUDENTS_LIST") } };
    }
    if (url === "/payments/bank-receipts") {
      return { data: { receipts: getLocal("CS_RECEIPTS") } };
    }
    if (url === "/subjects") {
      const cls = config?.params?.class_name;
      const all = getLocal("CS_SUBJECTS");
      if (cls) {
        return { data: { class_subjects: all.filter((s: any) => s.class_name === cls) } };
      }
      return { data: { class_subjects: all } };
    }
    if (url === "/users") {
      return { data: { users: getLocal("CS_USERS_LIST") } };
    }
    if (url === "/analytics/school") {
      return {
        data: {
          by_class: [{ class: "Primary 1", count: 42 }, { class: "Primary 2", count: 38 }, { class: "SS 2 Science", count: 120 }],
          debt_buckets: [{ bucket: "0 (Paid)", count: 2 }, { bucket: "< ₦50K", count: 1 }, { bucket: "≥ ₦50K", count: 1 }],
          by_gender: [{ gender: "Female", count: 58 }, { gender: "Male", count: 62 }],
          cbt_total_attempts: 12,
          cbt_avg_pct: 71,
          cbt_series: [{ month: "May", attempts: 5 }, { month: "June", attempts: 12 }],
          subject_averages: [{ subject: "Mathematics", average: 64 }, { subject: "Physics", average: 72 }]
        }
      };
    }
    if (url === "/superadmin/stats") {
      return {
        data: {
          schools: getLocal("CS_SCHOOL") ? 1 : 0,
          users: getLocal("CS_USERS_LIST").length,
          students: getLocal("CS_STUDENTS_LIST").length,
          leads: getLocal("CS_LEADS").length,
          open_leads: getLocal("CS_LEADS").filter((l: any) => !l.resolved).length,
          pending_schools: 1
        }
      };
    }
    if (url === "/superadmin/schools") {
      const sch = JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}");
      return { data: { schools: [sch] } };
    }
    if (url === "/superadmin/users") {
      return { data: { users: getLocal("CS_USERS_LIST") } };
    }
    if (url === "/superadmin/students") {
      return { data: { students: getLocal("CS_STUDENTS_LIST") } };
    }
    if (url === "/leads") {
      return { data: { leads: getLocal("CS_LEADS") } };
    }
    if (url === "/superadmin/verification-queue") {
      const sch = JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}");
      const items = sch.verification_status !== "active" ? [{
        school_id: sch.id,
        school_name: sch.name,
        admin_email: sch.email,
        whatsapp_phone: sch.phone,
        verification_status: "pending_verification",
        verification_code: "294827",
        latest_receipt: { id: "rcp-1", whatsapp_code: "294827", file_data_url: "https://example.com/receipt.jpg" }
      }] : [];
      return { data: { items } };
    }
    if (url === "/cbt/exams") {
      return { data: { exams: getLocal("CS_CBT_EXAMS") } };
    }
    if (url === "/messages/my-stream") {
      const msgs = getLocal("CS_MESSAGES");
      return { data: { messages: msgs, unread_count: msgs.filter((m: any) => m.unread).length } };
    }
    if (url === "/scores") {
      return {
        data: {
          scores: [
            { subject: "Mathematics", ca_scores: [14, 15], ca_score: 29, exam_score: 48 },
            { subject: "Physics", ca_scores: [16, 12], ca_score: 28, exam_score: 51 }
          ],
          skill_ratings: [
            { skill_name: "Punctuality", rating: 4 },
            { skill_name: "Neatness", rating: 5 }
          ]
        }
      };
    }
    throw new Error(`404: Route ${url} not found`);
  },
  post: async (url: string, data: any) => {
    await new Promise((r) => setTimeout(r, 60));

    if (url === "/payments/bank-receipt-public" || url === "/payments/bank-receipt") {
      const receipts = getLocal("CS_RECEIPTS");
      const val = {
        id: "rcp-" + Math.random().toString(36).substr(2, 9),
        tier: data.tier || "unified_enterprise",
        duration: data.duration || "full_session",
        amount_ngn: data.amount_ngn || 200000,
        status: "pending",
        created_at: new Date().toISOString(),
        submitted_by: data.school_email || "user@edu.ng",
        whatsapp_code: data.whatsapp_code,
        note: data.note || ""
      };
      receipts.unshift(val);
      setLocal("CS_RECEIPTS", receipts);
      return { data: { success: true, receipt: val } };
    }
    if (url === "/schools/me/classes") {
      const sch = JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}");
      sch.classes = Array.from(new Set([...(sch.classes || []), data.class_name]));
      localStorage.setItem("CS_SCHOOL", JSON.stringify(sch));
      return { data: { classes: sch.classes } };
    }
    if (url.startsWith("/cbt/exams") && url.endsWith("/approve")) {
      return { data: { success: true } };
    }
    if (url === "/students") {
      const students = getLocal("CS_STUDENTS_LIST");
      const st = { id: "st-" + Math.random().toString(36).substr(2, 9), ...data };
      students.push(st);
      setLocal("CS_STUDENTS_LIST", students);
      return { data: { student: st } };
    }
    if (url === "/users") {
      const users = getLocal("CS_USERS_LIST");
      const u = { id: "u-" + Math.random().toString(36).substr(2, 9), ...data };
      users.push(u);
      setLocal("CS_USERS_LIST", users);
      return { data: { user: u } };
    }
    if (url === "/scores/batch") {
      return { data: { success: true, saved: data.items } };
    }
    if (url === "/scores/skills") {
      return { data: { success: true } };
    }
    if (url === "/cbt/exams") {
      const exams = getLocal("CS_CBT_EXAMS");
      const exam = { id: "ex-" + Math.random().toString(36).substr(2, 9), ...data, status: "published", question_count: data.questions.length };
      exams.unshift(exam);
      setLocal("CS_CBT_EXAMS", exams);
      return { data: { exam } };
    }
    if (url === "/messages") {
      const msgs = getLocal("CS_MESSAGES");
      const msg = { id: "msg-" + Math.random().toString(36).substr(2, 9), ...data, created_at: new Date().toISOString(), unread: true };
      msgs.unshift(msg);
      setLocal("CS_MESSAGES", msgs);
      return { data: { message: msg } };
    }
    if (url === "/leads") {
      const leads = getLocal("CS_LEADS");
      const leadObj = {
        id: "lead-" + Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: data.email,
        school: data.school,
        phone: data.phone || "",
        message: data.message || "",
        resolved: false,
        created_at: new Date().toISOString().split("T")[0]
      };
      leads.unshift(leadObj);
      setLocal("CS_LEADS", leads);

      const msgs = getLocal("CS_MESSAGES");
      msgs.unshift({
        id: "msg-lead-" + Math.random().toString(36).substr(2, 5),
        message_type: "lead_inquiry",
        target_role: "Super_Admin",
        content: `[NEW LEAD / PROSPECT INQUIRY] School: ${data.school} | Client: ${data.name} (${data.email}) - Message: ${data.message || 'Requested demo'}`,
        created_at: new Date().toISOString(),
        unread: true
      });
      setLocal("CS_MESSAGES", msgs);

      return { data: { success: true, lead: leadObj } };
    }
    if (url.includes("/read")) {
      const id = url.split("/")[2];
      const msgs = getLocal("CS_MESSAGES").map((m: any) => m.id === id ? { ...m, unread: false } : m);
      setLocal("CS_MESSAGES", msgs);
      return { data: { success: true } };
    }
    if (url.endsWith("/reset-password")) {
      return { data: { ...data, password: "NewMockPassword123!" } };
    }
    if (url.endsWith("/promote")) {
      return { data: { success: true } };
    }
    if (url.endsWith("/demote")) {
      return { data: { success: true } };
    }
    return { data: { success: true } };
  },
  put: async (url: string, data: any) => {
    await new Promise((r) => setTimeout(r, 60));

    if (url === "/schools/me") {
      const sch = JSON.parse(localStorage.getItem("CS_SCHOOL") || "{}");
      const next = { ...sch, ...data };
      localStorage.setItem("CS_SCHOOL", JSON.stringify(next));
      return { data: { school: next } };
    }
    if (url === "/subjects") {
      const subjs = getLocal("CS_SUBJECTS").filter((s: any) => s.class_name !== data.class_name);
      subjs.push(data);
      setLocal("CS_SUBJECTS", subjs);
      return { data: { success: true } };
    }
    return { data: { success: true } };
  },
  delete: async (url: string) => {
    return { data: { success: true } };
  },
  patch: async (url: string, data: any) => {
    return { data: { success: true } };
  }
};

export const formatApiError = (detail: any) => {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
  return null;
};
