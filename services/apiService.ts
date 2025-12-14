
import { 
  User, Student, Staff, Course, Invoice, FinancialTransaction, 
  AttendanceRecord, AuditLogEntry, SchoolSettings, ClassLevel, Exam, 
  SalarySlip, SalaryAdjustment, StudentCourse, TherapyRecordFile, Employee,
  EmployeeHistory, StudentFeeAdjustment
} from '../types';

// --- CONFIGURATION ---
// Set to TRUE to run client-side only (fixes 'Failed to fetch' if server is down)
// Set to FALSE to attempt connecting to local Node.js server
const USE_MOCK = true; 
const API_URL = 'http://localhost:3001/api/rpc';
const STORAGE_KEY = 'schoolflow_mock_db_v1';

// --- HELPERS ---
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// --- MOCK DATABASE ---
const getDB = () => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch(e) { console.error("DB Load Error", e); }
  
  // Initial Seed Data
  const c1 = generateUUID();
  const s1 = generateUUID();
  const t1 = generateUUID(); // Admin user
  
  const initialDB = {
    users: [
       { id: t1, username: 'admin', password: 'admin', role: 'Admin', name: 'System Admin' }
    ],
    students: [
      { 
        id: s1, name: 'Alice Johnson', status: 'Active', 
        dob: '2016-05-12', admissionDate: '2023-01-01', joiningDate: '2023-01-05',
        parentDetails: { name: 'Bob Johnson', contact: '555-0101', address: '123 Maple St' },
        profilePhotoBase64: null,
        classId: ''
      }
    ],
    staff: [],
    classes: [
        { id: 'cls1', name: 'Grade 1', subjects: ['Math', 'English', 'Science'] }
    ],
    courses: [
      { id: c1, name: 'Speech Therapy', capacity: 10, defaultMonthlyFee: 15000, defaultDailyFee: 1000 }
    ],
    student_courses: [],
    therapy_files: [],
    settings: {
      name: 'SchoolFlow Demo',
      address: '123 Demo Lane, Tech City',
      contact_no: '(555) 123-4567',
      email: 'admin@schoolflow.demo',
      logo_url: '',
      currency: '$',
      lastInvoiceNo: 1000,
      bankName: 'Demo Bank',
      bankAccountTitle: 'SchoolFlow Account',
      bankAccountNumber: '1234567890',
      bankIban: 'US1234567890'
    },
    transactions: [],
    attendance: [],
    audit_logs: [],
    invoices: [],
    salary_slips: [],
    salary_adjustments: [],
    student_adjustments: [],
    exams: [],
    employee_history: []
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
  return initialDB;
};

const saveDB = (db: any) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

// --- REQUEST HANDLERS ---

async function serverRequest<T>(action: string, params: any = {}): Promise<T> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      let errorMsg = `Server Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) { }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`API Request Failed [${action}]:`, error);
    throw error;
  }
}

async function mockRequest<T>(action: string, params: any = {}): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const db = getDB();
  let result: any = null;

  try {
      switch (action) {
          case 'login':
              const u = db.users.find((u: User) => u.username === params.username && u.password === params.password);
              if (!u) throw new Error("Invalid credentials");
              result = u;
              break;
          
          case 'getAllUsers': result = db.users; break;
          case 'getAllInvoices': result = db.invoices; break;
          case 'getAllCourses': result = db.courses; break;
          case 'getAllClasses': result = db.classes; break;
          case 'getAllStudents': result = db.students; break;
          case 'getAllStaff': result = db.staff; break;
          case 'getAllStudentCourses': result = db.student_courses; break;
          case 'getSchoolSettings': result = db.settings; break;
          case 'getExams': result = db.exams; break;
          case 'getAuditLogs': result = db.audit_logs; break;
          case 'getTransactions': result = db.transactions; break;
          case 'getStandardSubjects': result = ['English', 'Math', 'Science', 'History', 'Geography', 'Art']; break;
          
          case 'getDashboardStats':
              result = {
                  totalStudents: db.students.length,
                  totalStaff: db.staff.length,
                  collectedFees: db.transactions.filter((t:any) => t.type === 'Fee' && t.status === 'Paid').reduce((acc:number, t:any) => acc + t.amount, 0),
                  pendingFees: db.invoices.filter((i:any) => i.status === 'Pending').reduce((acc:number, i:any) => acc + i.amount_due, 0),
                  attendanceToday: 95
              };
              break;

          case 'saveStudent':
              if (params.student.id) {
                  const idx = db.students.findIndex((s:any) => s.id === params.student.id);
                  if (idx >= 0) db.students[idx] = { ...db.students[idx], ...params.student };
                  result = db.students[idx];
              } else {
                  const newS = { ...params.student, id: generateUUID() };
                  db.students.push(newS);
                  result = newS;
                  if (params.student.initialCourses) {
                      params.student.initialCourses.forEach((ic: any) => {
                          db.student_courses.push({
                              id: generateUUID(),
                              studentId: newS.id,
                              courseId: ic.courseId,
                              feeBasis: ic.feeBasis,
                              agreedFee: ic.agreedFee
                          });
                      });
                  }
              }
              saveDB(db);
              break;
              
          case 'saveStaff':
              if (params.staff.id) {
                  const idx = db.staff.findIndex((s:any) => s.id === params.staff.id);
                  if (idx >= 0) db.staff[idx] = { ...db.staff[idx], ...params.staff };
                  result = db.staff[idx];
              } else {
                  const newSt = { ...params.staff, id: generateUUID() };
                  db.staff.push(newSt);
                  result = newSt;
              }
              saveDB(db);
              break;

          case 'getStudentDetails':
              const std = db.students.find((s:any) => s.id === params.id);
              if (!std) throw new Error("Student not found");
              const invs = db.invoices.filter((i:any) => i.student_id === params.id);
              const adjs = db.student_adjustments.filter((a:any) => a.studentId === params.id && !a.isApplied);
              const scs = db.student_courses.filter((sc:any) => sc.studentId === params.id).map((sc:any) => {
                  const c = db.courses.find((x:any) => x.id === sc.courseId);
                  return { ...sc, courseName: c ? c.name : 'Unknown' };
              });
              const files = db.therapy_files.filter((f:any) => f.studentId === params.id);
              result = {
                  ...std,
                  parent_name: std.parentDetails?.name || '',
                  contact_no: std.parentDetails?.contact || '',
                  address: std.parentDetails?.address || '',
                  invoices: invs,
                  pending_adjustments: adjs,
                  courses: scs,
                  files: files
              };
              break;

          case 'getEmployeeDetails':
              const emp = db.staff.find((s:any) => s.id === params.id);
              if (!emp) throw new Error("Employee not found");
              result = {
                  ...emp,
                  history: db.employee_history ? db.employee_history.filter((h:any) => h.employee_id === params.id) : [],
                  salaries: db.salary_slips.filter((s:any) => s.staffId === params.id)
              };
              break;

          case 'getAttendance':
              result = db.attendance.filter((a:any) => a.date === params.date && a.entityType === params.type);
              break;

          case 'saveAttendance':
              const { records } = params;
              if (!records || records.length === 0) break;
              const newEntityIds = records.map((r:any) => r.entityId);
              // remove existing for this date/type/entities
              db.attendance = db.attendance.filter((a:any) => !(a.date === records[0].date && a.entityType === records[0].entityType && newEntityIds.includes(a.entityId)));
              records.forEach((r:any) => db.attendance.push({ ...r, id: generateUUID() }));
              saveDB(db);
              break;
              
          case 'updateSchoolSettings':
              db.settings = { ...db.settings, ...params };
              saveDB(db);
              break;

          case 'createTransaction':
              const txn = { ...params.txn, id: generateUUID() };
              db.transactions.push(txn);
              saveDB(db);
              result = txn;
              break;
              
          case 'manageCourse':
              if (params.type === 'add') {
                  db.courses.push({ ...params.data, id: generateUUID() });
              } else if (params.type === 'edit') {
                  const idx = db.courses.findIndex((c:any) => c.id === params.data.id);
                  if(idx !== -1) db.courses[idx] = { ...db.courses[idx], ...params.data };
              } else if (params.type === 'delete') {
                  db.courses = db.courses.filter((c:any) => c.id !== params.id);
              }
              saveDB(db);
              break;

          case 'addExam':
              db.exams.push({ id: generateUUID(), name: params.name, classId: params.classId, schedule: params.schedule });
              saveDB(db);
              break;
              
          case 'manageUser':
              if (params.type === 'add') {
                  db.users.push({ ...params.data, id: generateUUID() });
              } else if (params.type === 'edit') {
                  const idx = db.users.findIndex((u:any) => u.id === params.data.id);
                  if(idx !== -1) db.users[idx] = { ...db.users[idx], ...params.data };
              } else if (params.type === 'delete') {
                  db.users = db.users.filter((u:any) => u.id !== params.id);
              }
              saveDB(db);
              break;
              
          case 'getAdjustments':
                if (params.staffId) {
                    result = db.salary_adjustments.filter((a:any) => a.staffId === params.staffId);
                } else {
                    result = db.salary_adjustments;
                }
                break;

          case 'addAdjustment':
                if (params.id) {
                     const idx = db.salary_adjustments.findIndex((a:any) => a.id === params.id);
                     if(idx !== -1) db.salary_adjustments[idx] = { ...db.salary_adjustments[idx], ...params };
                } else {
                     db.salary_adjustments.push({ ...params, id: generateUUID(), isApplied: false });
                }
                saveDB(db);
                break;
                
          case 'deleteAdjustment':
                db.salary_adjustments = db.salary_adjustments.filter((a:any) => a.id !== params.id);
                saveDB(db);
                break;

          case 'enrollStudentCourse':
                 db.student_courses.push({ id: generateUUID(), studentId: params.studentId, courseId: params.courseId, feeBasis: params.feeBasis, agreedFee: params.agreedFee });
                 saveDB(db);
                 break;
                 
          case 'removeStudentCourse':
                 db.student_courses = db.student_courses.filter((sc:any) => sc.id !== params.id);
                 saveDB(db);
                 break;
          
          case 'generateInvoice':
                 // Minimal Mock Invoice Generation
                 const { month_year, studentId } = params;
                 let count = 0;
                 if (studentId) {
                     // Single student logic simplified
                     const s = db.students.find((x:any) => x.id === studentId);
                     const invNo = `INV-${db.settings.lastInvoiceNo + 1}`;
                     db.settings.lastInvoiceNo++;
                     
                     // Mock items
                     const items = [{ description: 'Monthly Tuition', amount: 5000 }];
                     
                     db.invoices.push({
                         id: generateUUID(),
                         invoiceNo: invNo,
                         student_id: s.id,
                         student_name: s.name,
                         month_year: month_year,
                         due_date: new Date().toISOString().split('T')[0],
                         status: 'Pending',
                         items: items,
                         amount_due: 5000
                     });
                     count = 1;
                 }
                 saveDB(db);
                 result = { generated: count, message: "Mock Invoice Generated" };
                 break;
                 
          case 'generatePayroll':
                 // Minimal Mock Payroll
                 const { monthYear } = params;
                 let pCount = 0;
                 // Loop all staff
                 db.staff.forEach((s: any) => {
                     // Check if slip exists
                     if (!db.salary_slips.find((sl:any) => sl.staffId === s.id && sl.monthYear === monthYear)) {
                         db.salary_slips.push({
                             id: generateUUID(),
                             staffId: s.id,
                             staff_name: s.name,
                             staff_designation: s.designation,
                             monthYear: monthYear,
                             baseSalary: s.salary || 30000,
                             totalBonuses: 0,
                             totalDeductions: 0,
                             netSalary: s.salary || 30000,
                             adjustmentIds: [],
                             generationDate: Date.now(),
                             status: 'Pending',
                             attendanceStats: { totalDays: 30, present: 28, late: 1, absent: 1, paidLeave: 0 }
                         });
                         pCount++;
                     }
                 });
                 saveDB(db);
                 result = { generatedCount: pCount, message: "Mock Payroll Generated" };
                 break;
          
          case 'getSlipsByMonth':
                 result = db.salary_slips.filter((s:any) => s.monthYear === params.monthYear);
                 break;
                 
          case 'getSlipById':
                 result = db.salary_slips.find((s:any) => s.id === params.id);
                 break;

          case 'getInvoiceDetails':
                 const inv = db.invoices.find((i:any) => i.id === params.id);
                 if (inv) {
                     const std = db.students.find((s:any) => s.id === inv.student_id);
                     result = { invoice: inv, student: std };
                 }
                 break;
          
          case 'markInvoicePaid':
                 const iIdx = db.invoices.findIndex((i:any) => i.id === params.id);
                 if (iIdx !== -1) {
                     db.invoices[iIdx].status = 'Paid';
                     db.transactions.push({
                         id: generateUUID(),
                         type: 'Fee',
                         amount: db.invoices[iIdx].amount_due,
                         date: new Date().toISOString().split('T')[0],
                         entityId: db.invoices[iIdx].student_id,
                         description: `Invoice ${db.invoices[iIdx].invoiceNo}`,
                         status: 'Paid'
                     });
                     saveDB(db);
                 }
                 break;
                 
          case 'paySalarySlip':
                 const sIdx = db.salary_slips.findIndex((s:any) => s.id === params.id);
                 if (sIdx !== -1) {
                     db.salary_slips[sIdx].status = 'Paid';
                     db.transactions.push({
                         id: generateUUID(),
                         type: 'Salary',
                         amount: db.salary_slips[sIdx].netSalary,
                         date: new Date().toISOString().split('T')[0],
                         entityId: db.salary_slips[sIdx].staffId,
                         description: `Salary ${db.salary_slips[sIdx].monthYear}`,
                         status: 'Paid'
                     });
                     saveDB(db);
                 }
                 break;

          // --- BACKUP & RESTORE ---
          case 'exportDatabase':
                 result = db;
                 break;

          case 'importDatabase':
                 if (!params.data || !params.data.users) throw new Error("Invalid backup file structure");
                 // Overwrite entire mock DB
                 saveDB(params.data);
                 result = { success: true };
                 break;

          default:
              console.warn("Mock Action Not Implemented:", action);
              break;
      }
  } catch(e: any) {
      console.error("Mock Request Error", e);
      throw e;
  }
  
  return result as T;
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
