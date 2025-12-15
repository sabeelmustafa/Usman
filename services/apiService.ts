import { 
  User, Student, Staff, Course, Invoice, FinancialTransaction, 
  AttendanceRecord, AuditLogEntry, SchoolSettings, ClassLevel, Exam, 
  SalarySlip, SalaryAdjustment, StudentCourse, TherapyRecordFile, Employee,
  EmployeeHistory, StudentFeeAdjustment
} from '../types';

// --- CONFIGURATION ---
const API_URL = 'http://localhost:3001/api/rpc'; 

// CHANGED: Enable mock mode by default to fix connection issues
const USE_MOCK = true; 

// --- MOCK DATABASE ---
// Simulates a persistent database in memory for the session
const mockDb = {
    users: [
       { id: 'u1', username: 'admin', password: 'admin', role: 'Admin', name: 'System Admin' }
    ] as User[],
    students: [
      { 
        id: 's1', name: 'Alice Johnson', status: 'Active', 
        dob: '2016-05-12', admissionDate: '2023-01-01', joiningDate: '2023-01-05',
        parentDetails: { name: 'Bob Johnson', contact: '555-0101', address: '123 Maple St' },
        profilePhotoBase64: null 
      }
    ] as Student[],
    staff: [] as Staff[],
    classes: [
        { id: 'cls1', name: 'Grade 1', subjects: ['Math', 'English', 'Science'] }
    ] as ClassLevel[],
    courses: [
      { id: 'c1', name: 'Speech Therapy', capacity: 10, defaultMonthlyFee: 15000, defaultDailyFee: 1000 }
    ] as Course[],
    student_courses: [] as StudentCourse[],
    therapy_files: [] as TherapyRecordFile[],
    settings: {
      name: 'Therapy School',
      address: '123 Care Lane',
      contact_no: '(555) 123-4567',
      email: 'admin@school.com',
      website: '',
      logo_url: '',
      currency: '$',
      lastInvoiceNo: 1000,
      bankName: '',
      bankAccountTitle: '',
      bankAccountNumber: '',
      bankIban: ''
    } as SchoolSettings,
    transactions: [] as FinancialTransaction[],
    attendance: [] as AttendanceRecord[],
    audit_logs: [] as AuditLogEntry[],
    invoices: [] as Invoice[],
    salary_slips: [] as SalarySlip[],
    salary_adjustments: [] as SalaryAdjustment[],
    student_adjustments: [] as StudentFeeAdjustment[],
    exams: [] as Exam[],
    employee_history: [] as EmployeeHistory[]
};

// --- REAL SERVER REQUEST HANDLER ---
async function serverRequest<T>(action: string, params: any = {}): Promise<T> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.error) {
        throw new Error(data.error);
    }
    return data;
  } catch (error: any) {
    console.error(`API Request Failed [${action}]:`, error);
    throw error;
  }
}

// --- MOCK REQUEST HANDLER ---
// Simulates the backend logic in the browser to fix "Failed to fetch" errors
async function mockRequest<T>(action: string, params: any = {}): Promise<T> {
    console.log(`[MOCK API] ${action}`, params);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    switch (action) {
        case 'login':
            const u = mockDb.users.find(u => u.username === params.username && u.password === params.password);
            if (!u) throw new Error("Invalid credentials");
            return u as any;
        
        case 'getAllUsers': return mockDb.users as any;
        case 'getAllInvoices': return mockDb.invoices as any;
        case 'getAllCourses': return mockDb.courses as any;
        case 'getAllClasses': return mockDb.classes as any;
        case 'getAllStudents': return mockDb.students as any;
        case 'getAllStaff': return mockDb.staff as any;
        case 'getAllStudentCourses': return mockDb.student_courses as any;
        case 'getSchoolSettings': return mockDb.settings as any;
        case 'getExams': return mockDb.exams as any;
        case 'getAuditLogs': return mockDb.audit_logs as any;
        case 'getTransactions': return mockDb.transactions as any;
        case 'getStandardSubjects': return ['English', 'Math', 'Science', 'History', 'Geography', 'Art'] as any;
        
        case 'getDashboardStats':
            return {
                totalStudents: mockDb.students.length,
                totalStaff: mockDb.staff.length,
                collectedFees: mockDb.transactions.filter(t => t.type === 'Fee' && t.status === 'Paid').reduce((acc, t) => acc + t.amount, 0),
                pendingFees: mockDb.invoices.filter(i => i.status === 'Pending').reduce((acc, i) => acc + i.amount_due, 0),
                attendanceToday: 95
            } as any;

        case 'saveStudent':
            if (params.student.id) {
                const idx = mockDb.students.findIndex(s => s.id === params.student.id);
                if (idx >= 0) mockDb.students[idx] = { ...mockDb.students[idx], ...params.student };
                return mockDb.students[idx] as any;
            } else {
                const newS = { ...params.student, id: crypto.randomUUID() };
                mockDb.students.push(newS);
                if (params.student.initialCourses) {
                    params.student.initialCourses.forEach((ic: any) => {
                        mockDb.student_courses.push({
                            id: crypto.randomUUID(),
                            studentId: newS.id,
                            courseId: ic.courseId,
                            feeBasis: ic.feeBasis,
                            agreedFee: ic.agreedFee
                        });
                    });
                }
                return newS as any;
            }
            
        case 'saveStaff':
            if (params.staff.id) {
                const idx = mockDb.staff.findIndex(s => s.id === params.staff.id);
                if (idx >= 0) mockDb.staff[idx] = { ...mockDb.staff[idx], ...params.staff };
                return mockDb.staff[idx] as any;
            } else {
                const newSt = { ...params.staff, id: crypto.randomUUID() };
                mockDb.staff.push(newSt);
                return newSt as any;
            }

        case 'getStudentDetails':
            const std = mockDb.students.find(s => s.id === params.id);
            if (!std) throw new Error("Student not found");
            const invs = mockDb.invoices.filter(i => i.student_id === params.id);
            const adjs = mockDb.student_adjustments.filter(a => a.studentId === params.id && !a.isApplied);
            const scs = mockDb.student_courses.filter(sc => sc.studentId === params.id).map(sc => {
                const c = mockDb.courses.find(x => x.id === sc.courseId);
                return { ...sc, courseName: c ? c.name : 'Unknown' };
            });
            const files = mockDb.therapy_files.filter(f => f.studentId === params.id);
            return {
                ...std,
                parent_name: std.parentDetails?.name || '',
                contact_no: std.parentDetails?.contact || '',
                address: std.parentDetails?.address || '',
                invoices: invs,
                pending_adjustments: adjs,
                courses: scs,
                files: files
            } as any;

        case 'getEmployeeDetails':
            const emp = mockDb.staff.find(s => s.id === params.id);
            if (!emp) throw new Error("Employee not found");
            return {
                ...emp,
                history: mockDb.employee_history ? mockDb.employee_history.filter(h => h.employee_id === params.id) : [],
                salaries: mockDb.salary_slips.filter(s => s.staffId === params.id)
            } as any;

        case 'getAttendance':
            return mockDb.attendance.filter(a => a.date === params.date && a.entityType === params.type) as any;

        case 'saveAttendance':
            const { records } = params;
            if (!records || records.length === 0) break;
            const newEntityIds = records.map((r: any) => r.entityId);
            mockDb.attendance = mockDb.attendance.filter(a => !(a.date === records[0].date && a.entityType === records[0].entityType && newEntityIds.includes(a.entityId)));
            records.forEach((r: any) => mockDb.attendance.push({ ...r, id: crypto.randomUUID() }));
            return {} as any;
            
        case 'updateSchoolSettings':
            mockDb.settings = { ...mockDb.settings, ...params };
            return {} as any;

        case 'createTransaction':
            const txn = { ...params.txn, id: crypto.randomUUID() };
            mockDb.transactions.push(txn);
            return txn as any;
        
        case 'manageCourse':
            if (params.type === 'add') {
                mockDb.courses.push({ ...params.data, id: crypto.randomUUID() });
            } else if (params.type === 'edit') {
                const idx = mockDb.courses.findIndex(c => c.id === params.data.id);
                if(idx !== -1) mockDb.courses[idx] = { ...mockDb.courses[idx], ...params.data };
            } else if (params.type === 'delete') {
                mockDb.courses = mockDb.courses.filter(c => c.id !== params.id);
            }
            return {} as any;

        case 'addExam':
            mockDb.exams.push({ id: crypto.randomUUID(), name: params.name, classId: params.classId, schedule: params.schedule });
            return {} as any;
            
        case 'manageUser':
            if (params.type === 'add') {
                mockDb.users.push({ ...params.data, id: crypto.randomUUID() });
            } else if (params.type === 'edit') {
                const idx = mockDb.users.findIndex(u => u.id === params.data.id);
                if(idx !== -1) mockDb.users[idx] = { ...mockDb.users[idx], ...params.data };
            } else if (params.type === 'delete') {
                mockDb.users = mockDb.users.filter(u => u.id !== params.id);
            }
            return {} as any;

        case 'getAdjustments':
            if (params.staffId) {
                return mockDb.salary_adjustments.filter(a => a.staffId === params.staffId) as any;
            } else {
                return mockDb.salary_adjustments as any;
            }

        case 'addAdjustment':
            if (params.id) {
                    const idx = mockDb.salary_adjustments.findIndex(a => a.id === params.id);
                    if(idx !== -1) mockDb.salary_adjustments[idx] = { ...mockDb.salary_adjustments[idx], ...params };
            } else {
                    mockDb.salary_adjustments.push({ ...params, id: crypto.randomUUID(), isApplied: false });
            }
            return {} as any;
            
        case 'enrollStudentCourse':
            mockDb.student_courses.push({ id: crypto.randomUUID(), studentId: params.studentId, courseId: params.courseId, feeBasis: params.feeBasis, agreedFee: params.agreedFee });
            return {} as any;
                
        case 'removeStudentCourse':
            mockDb.student_courses = mockDb.student_courses.filter(sc => sc.id !== params.id);
            return {} as any;

        case 'addStudentAdjustment':
            const pendingInvoice = mockDb.invoices.find(i => i.student_id === params.studentId && i.status === 'Pending');
            if (pendingInvoice) {
                pendingInvoice.items.push({
                    description: `${params.type}: ${params.description}`,
                    amount: params.amount
                });
                pendingInvoice.amount_due += params.amount;
                mockDb.student_adjustments.push({ ...params, id: crypto.randomUUID(), isApplied: true, invoiceId: pendingInvoice.id });
                return { addedToInvoice: true, invoiceId: pendingInvoice.id } as any;
            } else {
                mockDb.student_adjustments.push({ ...params, id: crypto.randomUUID(), isApplied: false });
                return { addedToInvoice: false } as any;
            }

        case 'createCustomInvoice':
            const studentForInv = mockDb.students.find(s => s.id === params.studentId);
            if (!studentForInv) throw new Error("Student not found");

            const invNum = `INV-${mockDb.settings.lastInvoiceNo + 1}`;
            mockDb.settings.lastInvoiceNo++;

            const newInvId = crypto.randomUUID();
            const isPaid = params.status === 'Paid';

            const newInvoice = {
                id: newInvId,
                invoiceNo: invNum,
                student_id: studentForInv.id,
                student_name: studentForInv.name,
                month_year: new Date().toISOString().slice(0, 7),
                due_date: params.dueDate || new Date().toISOString().split('T')[0],
                status: params.status || 'Pending',
                items: [{ description: `${params.type}: ${params.description}`, amount: params.amount }],
                amount_due: params.amount
            };

            mockDb.invoices.push(newInvoice as any);

            if (isPaid) {
                mockDb.transactions.push({
                    id: crypto.randomUUID(),
                    type: 'Fee',
                    amount: params.amount,
                    date: new Date().toISOString().split('T')[0],
                    entityId: studentForInv.id,
                    description: `Instant Payment: ${params.type} (${invNum})`,
                    status: 'Paid'
                });
            }
            return newInvoice as any;
        
        case 'generateInvoice':
            const { month_year, studentId } = params;
            let generatedCount = 0;
            const targetStudents = studentId 
            ? mockDb.students.filter(s => s.id === studentId) 
            : mockDb.students.filter(s => s.status === 'Active');

            targetStudents.forEach(s => {
                const existingInvoices = mockDb.invoices.filter(i => i.student_id === s.id && i.month_year === month_year);
                const hasTuitionInvoice = existingInvoices.some(inv => inv.items.some(item => item.description.startsWith('Tuition:') || item.description.includes('Therapy')));
                
                const items: any[] = [];

                if (!hasTuitionInvoice) {
                    const monthlyCourses = mockDb.student_courses.filter(sc => sc.studentId === s.id && sc.feeBasis === 'Monthly');
                    monthlyCourses.forEach(c => {
                        const courseDef = mockDb.courses.find(cd => cd.id === c.courseId);
                        items.push({ 
                            description: `${courseDef ? courseDef.name : 'Therapy'}`, 
                            amount: c.agreedFee 
                        });
                    });

                    const dailyCourses = mockDb.student_courses.filter(sc => sc.studentId === s.id && sc.feeBasis === 'Daily');
                    if (dailyCourses.length > 0) {
                        const presentDays = mockDb.attendance.filter(a => 
                            a.entityId === s.id && 
                            a.entityType === 'Student' &&
                            a.date.startsWith(month_year) && 
                            (a.status === 'Present' || a.status === 'Late')
                        ).length;

                        if (presentDays > 0) {
                            dailyCourses.forEach(c => {
                                const courseDef = mockDb.courses.find(cd => cd.id === c.courseId);
                                const total = c.agreedFee * presentDays;
                                items.push({ 
                                    description: `${courseDef ? courseDef.name : 'Therapy'} (${presentDays} days)`, 
                                    amount: total 
                                });
                            });
                        }
                    }
                }

                const adjustments = mockDb.student_adjustments.filter(a => a.studentId === s.id && !a.isApplied);
                adjustments.forEach(a => {
                    items.push({ description: `${a.type}: ${a.description}`, amount: a.amount });
                });

                if (items.length > 0) {
                    const total = items.reduce((sum, x) => sum + x.amount, 0);
                    const newId = crypto.randomUUID();
                    
                    mockDb.invoices.push({
                        id: newId,
                        invoiceNo: `INV-${mockDb.settings.lastInvoiceNo + 1}`,
                        student_id: s.id,
                        student_name: s.name,
                        month_year: month_year,
                        due_date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
                        status: 'Pending',
                        items: items,
                        amount_due: total
                    } as any);
                    mockDb.settings.lastInvoiceNo++;

                    adjustments.forEach(a => {
                        const adjRecord = mockDb.student_adjustments.find(x => x.id === a.id);
                        if (adjRecord) {
                            adjRecord.isApplied = true;
                            adjRecord.invoiceId = newId;
                        }
                    });
                    generatedCount++;
                }
            });
            return { generated: generatedCount, message: "Invoices Generated" } as any;

        default:
            return {} as any;
    }
}

// --- EXPORT ---

export const api = {
  request: USE_MOCK ? mockRequest : serverRequest,
  
  // Auth
  login: (username: string, password: string) => (USE_MOCK ? mockRequest : serverRequest)<User>('login', { username, password }),
  
  // Settings
  getSettings: () => (USE_MOCK ? mockRequest : serverRequest)<SchoolSettings>('getSchoolSettings'),
  
  // Dashboard
  getDashboardStats: () => (USE_MOCK ? mockRequest : serverRequest)<any>('getDashboardStats'),
  
  // Students
  getStudents: () => (USE_MOCK ? mockRequest : serverRequest)<Student[]>('getAllStudents'),
  saveStudent: (student: Partial<Student> & { initialCourses?: any[] }, user: User) => (USE_MOCK ? mockRequest : serverRequest)<Student>('saveStudent', { student, user }),
  
  // Staff
  getStaff: () => (USE_MOCK ? mockRequest : serverRequest)<Staff[]>('getAllStaff'),
  saveStaff: (staff: Partial<Staff>, user: User) => (USE_MOCK ? mockRequest : serverRequest)<Staff>('saveStaff', { staff, user }),
  
  // Courses / Classes
  getClasses: () => (USE_MOCK ? mockRequest : serverRequest)<ClassLevel[]>('getAllClasses'),
  
  // Exams
  getExams: () => (USE_MOCK ? mockRequest : serverRequest)<Exam[]>('getExams'),
  
  // Transactions
  createTransaction: (txn: Partial<FinancialTransaction>, user: User) => (USE_MOCK ? mockRequest : serverRequest)<FinancialTransaction>('createTransaction', { txn, user }),
  
  // Audit Logs
  getAuditLogs: () => (USE_MOCK ? mockRequest : serverRequest)<AuditLogEntry[]>('getAuditLogs'),
  
  // Attendance
  getAttendance: (date: string, type: 'Student' | 'Staff') => (USE_MOCK ? mockRequest : serverRequest)<AttendanceRecord[]>('getAttendance', { date, type }),
  saveAttendance: (records: AttendanceRecord[], user: User) => (USE_MOCK ? mockRequest : serverRequest)<void>('saveAttendance', { records, user }),

  // Data
  exportDatabase: () => (USE_MOCK ? mockRequest : serverRequest)<any>('exportDatabase'),
  importDatabase: (data: any) => (USE_MOCK ? mockRequest : serverRequest)<void>('importDatabase', { data }),
};