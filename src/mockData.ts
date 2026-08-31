/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, CbtExam, GradeRecord, BillingRecord } from './types';

export const mockUsers: UserProfile[] = [
  {
    id: 'usr-admin-1',
    username: 'CS-SUPER-ADMIN',
    fullName: 'Mervyndean Hilary',
    role: 'Super_Admin',
    email: 'mervyn@cornernerstreams.com',
    phone: '+234 812 345 6789',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
  },
  {
    id: 'usr-school-admin-1',
    username: 'CS-SCH-001',
    fullName: 'Dr. David K. Macaulay',
    role: 'School_Admin',
    email: 'principal@cornerstreams.edu',
    phone: '+234 814 188 0550',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
  },
  {
    id: 'usr-tch-1',
    username: 'CS-TCH-001',
    fullName: 'Mrs. Folasade Adebayo',
    role: 'Class_Teacher',
    email: 'f.adebayo@cornerstreams.edu',
    phone: '+234 803 241 5566',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150',
    arm: 'Secondary',
    gradeLevel: 'Grade 11 / SS 2',
    classCohort: 'SS 2A',
  },
  {
    id: 'usr-tch-2',
    username: 'CS-TCH-002',
    fullName: 'Dr. Emeka Nwosu',
    role: 'Non_Class_Teacher',
    email: 'e.nwosu@cornerstreams.edu',
    phone: '+234 809 111 2223',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150',
    arm: 'Secondary',
    gradeLevel: 'Grade 10 / SS 1',
    classCohort: 'SS 1B', // but marked as Non-Class Teacher, they have no cohort grading permissions
  },
  {
    id: 'usr-par-1',
    username: 'CS-PAR-001',
    fullName: 'Chief Alao Benson',
    role: 'Parent',
    email: 'alaobenson@gmail.com',
    phone: '+234 802 999 0001',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
    studentIds: ['usr-stu-2'], // Jeremiah David Benson
  },
  {
    id: 'usr-par-2',
    username: 'CS-PAR-002',
    fullName: 'Dr. Amira Adekunle',
    role: 'Parent',
    email: 'amira.adekunle@health.ng',
    phone: '+234 815 444 8888',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150',
    studentIds: ['usr-stu-1', 'usr-stu-3'], // Folasade Adekunle & Chibuzor Silas (Guardian)
  },
  {
    id: 'usr-stu-1',
    username: 'CS-SEC-0042',
    fullName: 'Folasade Amira Adekunle',
    role: 'Student',
    email: 'folasade@cornerstreams.edu',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
    arm: 'Secondary',
    gradeLevel: 'Grade 11 / SS 2',
    classCohort: 'SS 2A',
    parentId: 'usr-par-2',
  },
  {
    id: 'usr-stu-2',
    username: 'CS-SEC-0043',
    fullName: 'Jeremiah David Benson',
    role: 'Student',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
    arm: 'Secondary',
    gradeLevel: 'Grade 11 / SS 2',
    classCohort: 'SS 2A',
    parentId: 'usr-par-1',
  },
  {
    id: 'usr-stu-3',
    username: 'CS-SEC-0044',
    fullName: 'Chibuzor Emeka Silas',
    role: 'Student',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
    arm: 'Secondary',
    gradeLevel: 'Grade 11 / SS 2',
    classCohort: 'SS 2A',
    parentId: 'usr-par-2',
  },
  {
    id: 'usr-stu-4',
    username: 'CS-SEC-0045',
    fullName: 'Dada Oluwaseun Emmanuel',
    role: 'Student',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150&h=150',
    arm: 'Secondary',
    gradeLevel: 'Grade 11 / SS 2',
    classCohort: 'SS 2A',
    parentId: 'usr-par-1', // Shared family friend
  }
];

export const mockExams: CbtExam[] = [
  {
    id: 'ex-01',
    title: 'Mid-Term Resiliency Mathematics Assessment',
    subject: 'Mathematics',
    durationMinutes: 45,
    published: true,
    publishedToStudents: true,
    uploadedAt: '2026-07-23T14:30:00.000Z',
    uploadedBy: 'Mrs. Folasade Adebayo',
    targetClass: 'SS 2A',
    uploadSource: 'excel',
    questions: [
      {
        id: 'q1',
        text: 'Evaluate standard quadratic parameters: If x² - 5x + 6 = 0, what are the possible vectors of x?',
        options: ['x = 2 or x = 3', 'x = -2 or x = -3', 'x = 1 or x = 5', 'x = 0 or x = 6'],
        correctOptionIndex: 0,
        marks: 10,
      },
      {
        id: 'q2',
        text: 'The core difference between physical ledgers and digital cloud state sync processes is:',
        options: [
          'Digital sheets have high replication latency',
          'Physical registers are completely immune to water damage',
          'Digital cloud records offer instantaneous network resiliency tracking and zero paper overhead',
          'There is no actual architectural difference'
        ],
        correctOptionIndex: 2,
        marks: 10,
      },
      {
        id: 'q3',
        text: 'Solve for variable Z in the linear system: 3Z + 12 = 48.',
        options: ['Z = 12', 'Z = 10', 'Z = 14', 'Z = 16'],
        correctOptionIndex: 0,
        marks: 10,
      },
      {
        id: 'q4',
        text: 'What is the surface area calculation of a sphere template of radius r = 7 cm? (Take π ≈ 22/7)',
        options: ['154 cm²', '308 cm²', '616 cm²', '462 cm²'],
        correctOptionIndex: 2,
        marks: 10,
      }
    ]
  },
  {
    id: 'ex-02',
    title: 'SS 2 Physics Optics & Electromagnetism Test',
    subject: 'Physics',
    durationMinutes: 30,
    published: false,
    publishedToStudents: false,
    uploadedAt: '2026-07-24T00:15:00.000Z',
    uploadedBy: 'Dr. Emeka Nwosu',
    targetClass: 'SS 2A',
    uploadSource: 'excel',
    questions: [
      {
        id: 'pq1',
        text: 'Calculate the focal length of a concave mirror with radius of curvature R = 30 cm.',
        options: ['15 cm', '30 cm', '60 cm', '7.5 cm'],
        correctOptionIndex: 0,
        marks: 10,
      },
      {
        id: 'pq2',
        text: 'Which phenomenon best explains the dispersion of white light in a glass prism?',
        options: ['Total Internal Reflection', 'Diffraction', 'Refraction at different wavelengths', 'Polarization'],
        correctOptionIndex: 2,
        marks: 10,
      },
      {
        id: 'pq3',
        text: 'SI unit of Magnetic Flux Density (B) is:',
        options: ['Tesla', 'Weber', 'Henry', 'Gauss'],
        correctOptionIndex: 0,
        marks: 10,
      }
    ]
  },
  {
    id: 'ex-03',
    title: 'General English Comprehension & Grammar Examination',
    subject: 'English Language',
    durationMinutes: 60,
    published: true,
    publishedToStudents: true,
    uploadedAt: '2026-07-22T09:00:00.000Z',
    uploadedBy: 'Mrs. Folasade Adebayo',
    targetClass: 'SS 2A',
    uploadSource: 'excel',
    questions: [
      {
        id: 'eq1',
        text: 'Identify the synonym of the word "Meticulous":',
        options: ['Careless', 'Painstaking', 'Hasty', 'Obscure'],
        correctOptionIndex: 1,
        marks: 10,
      },
      {
        id: 'eq2',
        text: 'Choose the correct preposition: "The principal congratulated the students _____ their outstanding score."',
        options: ['for', 'on', 'about', 'with'],
        correctOptionIndex: 1,
        marks: 10,
      }
    ]
  }
];

export const defaultGradeRecords: GradeRecord[] = [
  {
    id: 'gr-01',
    studentId: 'usr-stu-1',
    studentName: 'Folasade Amira Adekunle',
    subjectCode: 'MTH401',
    subjectName: 'Mathematics SS 2',
    caType: '4_CA',
    scores: {
      ca1: 9,
      ca2: 8,
      ca3: 9,
      ca4: 10,
      exam: 54,
    },
    totalScore: 90,
    gradeLetter: 'A',
    remark: 'EXCELLENT OUTSTANDING ACHIEVEMENT',
    term: 'First Term',
    session: '2023/2024',
    teacherVerified: true,
  },
  {
    id: 'gr-02',
    studentId: 'usr-stu-2',
    studentName: 'Jeremiah David Benson',
    subjectCode: 'MTH401',
    subjectName: 'Mathematics SS 2',
    caType: '4_CA',
    scores: {
      ca1: 4,
      ca2: 5,
      ca3: 6,
      ca4: 4,
      exam: 32,
    },
    totalScore: 51,
    gradeLetter: 'C',
    remark: 'GOOD CREDIT. DESERVES ENCOURAGEMENT',
    term: 'First Term',
    session: '2023/2024',
    teacherVerified: true,
  },
  {
    id: 'gr-03',
    studentId: 'usr-stu-3',
    studentName: 'Chibuzor Emeka Silas',
    subjectCode: 'MTH401',
    subjectName: 'Mathematics SS 2',
    caType: '4_CA',
    scores: {
      ca1: 7,
      ca2: 8,
      ca3: 8,
      ca4: 8,
      exam: 45,
    },
    totalScore: 76,
    gradeLetter: 'B',
    remark: 'VERY GOOD EFFORT. KEEP THE TEMPO UP',
    term: 'First Term',
    session: '2023/2024',
    teacherVerified: true,
  },
  {
    id: 'gr-04',
    studentId: 'usr-stu-4',
    studentName: 'Dada Oluwaseun Emmanuel',
    subjectCode: 'MTH401',
    subjectName: 'Mathematics SS 2',
    caType: '4_CA',
    scores: {
      ca1: 9,
      ca2: 9,
      ca3: 0,
      ca4: 0,
      exam: 0,
    },
    totalScore: 18,
    gradeLetter: 'F',
    remark: 'FAIL. STUDENT RE-SITTING REQUIRED',
    term: 'First Term',
    session: '2023/2024',
    teacherVerified: false,
  }
];

export const mockBillingRecords: BillingRecord[] = [
  {
    id: 'bl-01',
    parentId: 'usr-par-2', // Amira Adekunle
    studentId: 'usr-stu-1', // Folasade Amira Adekunle
    studentName: 'Folasade Amira Adekunle',
    invoiceNumber: 'INV/2024/SS2/042',
    term: 'First Term',
    session: '2023/2024',
    tuitionFee: 150000,
    admissionFee: 0,
    cbtProcessingFee: 15000,
    miscellaneousFee: 5000,
    totalAmount: 170000,
    amountPaid: 170000,
    status: 'PAID',
    history: [
      {
        transactionId: 'TXN-9988221',
        amount: 170000,
        paymentMethod: 'Bank Transfer (CBN Reconciled)',
        date: '2023-09-04 10:14',
        description: 'Term 1 Complete Clearance Invoice CS-881'
      }
    ]
  },
  {
    id: 'bl-02',
    parentId: 'usr-par-2', // Amira Adekunle
    studentId: 'usr-stu-3', // Chibuzor Silas
    studentName: 'Chibuzor Emeka Silas',
    invoiceNumber: 'INV/2024/SS2/044',
    term: 'First Term',
    session: '2023/2024',
    tuitionFee: 150000,
    admissionFee: 20000,
    cbtProcessingFee: 15000,
    miscellaneousFee: 5000,
    totalAmount: 190000,
    amountPaid: 80000,
    status: 'PARTIALLY_PAID',
    history: [
      {
        transactionId: 'TXN-9988452',
        amount: 80000,
        paymentMethod: 'POS Terminal Sync',
        date: '2023-09-08 14:22',
        description: 'Admission fee + partial term tuition'
      }
    ]
  },
  {
    id: 'bl-03',
    parentId: 'usr-par-1', // Chief Alao Benson
    studentId: 'usr-stu-2', // Jeremiah David Benson
    studentName: 'Jeremiah David Benson',
    invoiceNumber: 'INV/2024/SS2/043',
    term: 'First Term',
    session: '2023/2024',
    tuitionFee: 150000,
    admissionFee: 0,
    cbtProcessingFee: 15000,
    miscellaneousFee: 10000,
    totalAmount: 175000,
    amountPaid: 0,
    status: 'PENDING',
    history: []
  }
];

export const mockLedgerEntries: any[] = [
  {
    id: 'LEDG-001',
    date: '2026-07-25 09:30',
    sector: 'Tuition & Academic Fees',
    type: 'INFLOW',
    title: 'SS2 Term 1 Full Tuition & CBT Levy Clearance',
    amount: 170000,
    payerOrPayee: 'Amira Adekunle (Parent of Folasade Adekunle)',
    paymentMethod: 'Bank Transfer (CBN Reconciled)',
    status: 'RECONCILED',
    reference: 'REF-CS-88102',
    receiptNumber: 'RCP/2026/0719',
    notes: 'Verified via Zenith Bank NIBSS instant settlement portal.',
    approvedBy: 'Bursar Mrs. Folasade Adebayo'
  },
  {
    id: 'LEDG-002',
    date: '2026-07-24 14:15',
    sector: 'Infrastructure & Maintenance',
    type: 'OUTFLOW',
    title: 'Main Science Wing 15kVA Solar Inverter Battery Replacement',
    amount: 850000,
    payerOrPayee: 'Lagos Solar Power Solutions Ltd',
    paymentMethod: 'Bank Transfer',
    status: 'RECONCILED',
    reference: 'INV-LS-9921',
    receiptNumber: 'VCH/2026/0402',
    notes: '4x LFP Lithium battery packs installed and tested in CBT server room.',
    approvedBy: 'Super Admin David Macaulay'
  },
  {
    id: 'LEDG-003',
    date: '2026-07-22 11:00',
    sector: 'ICT & CBT Engine Infrastructure',
    type: 'OUTFLOW',
    title: 'LAN Mesh Offline Server Node & Wi-Fi Access Points',
    amount: 320000,
    payerOrPayee: 'TechServ Networks Nigeria',
    paymentMethod: 'Bank Transfer',
    status: 'RECONCILED',
    reference: 'TSN-40192',
    receiptNumber: 'VCH/2026/0398',
    notes: 'Dual-band Gigabit Access Points deployed across SS 1 - SS 3 CBT Halls.',
    approvedBy: 'Super Admin David Macaulay'
  },
  {
    id: 'LEDG-004',
    date: '2026-07-20 08:00',
    sector: 'Staff Payroll & Allowances',
    type: 'OUTFLOW',
    title: 'Academic & Non-Academic Staff July Monthly Salary Disbursement',
    amount: 4850000,
    payerOrPayee: 'Corner Streams Teaching & Admin Staff (28 Personnel)',
    paymentMethod: 'Bank Transfer (Bulk Payroll)',
    status: 'RECONCILED',
    reference: 'PRL-JULY-2026',
    receiptNumber: 'PRL/2026/0701',
    notes: 'Includes CBT invigilation bonuses and health insurance deductions.',
    approvedBy: 'Bursar Mrs. Folasade Adebayo'
  },
  {
    id: 'LEDG-005',
    date: '2026-07-18 16:45',
    sector: 'Tuition & Academic Fees',
    type: 'INFLOW',
    title: 'SS2 Partial Tuition Deposit + Admission Fee',
    amount: 80000,
    payerOrPayee: 'Chibuzor Silas (Parent)',
    paymentMethod: 'POS Terminal Sync',
    status: 'RECONCILED',
    reference: 'POS-883912',
    receiptNumber: 'RCP/2026/0688',
    notes: 'Card payment processed at Bursary counter POS terminal.',
    approvedBy: 'Assistant Bursar Mr. Timothy'
  },
  {
    id: 'LEDG-006',
    date: '2026-07-15 10:20',
    sector: 'Transport & Fleet Operations',
    type: 'OUTFLOW',
    title: 'School Bus Fleet (Buses A, B & C) Diesel Refill & Oil Filter Service',
    amount: 240000,
    payerOrPayee: 'TotalEnergies Service Station Victoria Island',
    paymentMethod: 'Corporate Card',
    status: 'RECONCILED',
    reference: 'TOT-2026-904',
    receiptNumber: 'VCH/2026/0380',
    notes: '500 Liters AGO diesel purchased for morning & afternoon student routes.',
    approvedBy: 'Transport Manager Mr. Audu'
  },
  {
    id: 'LEDG-007',
    date: '2026-07-12 13:00',
    sector: 'Stationery & Exam Supplies',
    type: 'OUTFLOW',
    title: 'Custom Answer Sheets & WAEC Standard Graph Papers Printing',
    amount: 180000,
    payerOrPayee: 'Academy Press Plc',
    paymentMethod: 'Bank Transfer',
    status: 'RECONCILED',
    reference: 'AP-2026-339',
    receiptNumber: 'VCH/2026/0375',
    notes: '10,000 serialized examination booklets printed for Term 3 finals.',
    approvedBy: 'Bursar Mrs. Folasade Adebayo'
  },
  {
    id: 'LEDG-008',
    date: '2026-07-10 11:30',
    sector: 'Canteen, Events & Co-Curricular',
    type: 'INFLOW',
    title: 'Inter-House Sports T-Shirt Sales & Sponsorship Registration',
    amount: 650000,
    payerOrPayee: 'Parent-Teacher Association & Sponsors',
    paymentMethod: 'Bank Transfer (CBN Reconciled)',
    status: 'RECONCILED',
    reference: 'SPRT-2026-01',
    receiptNumber: 'RCP/2026/0650',
    notes: 'Collected for Yellow, Blue, Green, and Red House sportswear.',
    approvedBy: 'Sports Master Mr. Kingsley'
  }
];

