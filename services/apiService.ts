
import { 
  User, Student, Staff, Course, Invoice, FinancialTransaction, 
  AttendanceRecord, AuditLogEntry, SchoolSettings, ClassLevel, Exam, 
  SalarySlip, SalaryAdjustment, StudentCourse, TherapyRecordFile, Employee,
  EmployeeHistory, StudentFeeAdjustment
} from '../types';

// --- CONFIGURATION ---
// SET THIS TO TRUE FOR FRONTEND-ONLY MODE
const USE_MOCK = true; 

const getApiUrl = () => '/api/rpc';
const API_URL = getApiUrl();

// --- MOCK BACKEND (LocalStorage) ---

const MOCK_STORAGE_KEY = 'schoolflow_db_v1';

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getEmptyDB = () => ({
    users: [
       { id: 'dev-admin', username: 'admin', password: 'admin', role: 'Admin', name: 'System Admin' }
    ],
    students: [],
    staff: [],
    classes: [
        { id: 'cls1', name: 'Grade 1', subjects: ['Math', 'English', 'Science'] }
    ],
    courses: [],
    student_courses: [],
    therapy_files: [],
    settings: {
      name: 'SchoolFlow Institute',
      address: '123 Education Lane',
      contact_no: '(555) 123-4567',
      email: 'admin@schoolflow.com',
      website: '',
      logo_url: '',
      currency: '$',
      lastInvoiceNo: 1000,
      bankName: '',
      bankAccountTitle: '',
      bankAccountNumber: '',
      bankIban: '',
      weeklyOffDays: [0, 6], // Sunday (0), Saturday (6)
      holidays: []
    },
    transactions: [],
    attendance: [],
    audit_logs: [],
    invoices: [],
    salary_slips: [],
    salary_adjustments: [],
    student_adjustments: [],
    exams: [],
    exam_results: [],
    employee_history: []
});

const loadMockDB = () => {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: Ensure new settings exist
        if (parsed.settings && !parsed.settings.weeklyOffDays) {
            parsed.settings.weeklyOffDays = [0, 6];
            parsed.settings.holidays = [];
        }
        return parsed;
    }
    const fresh = getEmptyDB();
    saveMockDB(fresh);
    return fresh;
};

const saveMockDB = (data: any) => {
    try {
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("LocalStorage quota exceeded", e);
        throw new Error("Storage full. Cannot save data in Mock mode.");
    }
};

// Mock Request Handler
async function mockRequestHandler<T>(action: string, params: any = {}): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const db = loadMockDB();
    let result: any = {};

    try {
        switch (action) {
             // --- AUTH ---
            case 'login':
                const u = db.users.find((u:any) => u.username === params.username && u.password === params.password);
                if (!u) throw new Error("Invalid credentials");
                result = u;
                break;
            
            case 'registerUser':
                if(db.users.find((u:any) => u.username === params.username)) throw new Error("Username exists");
                const newUser = { ...params, id: generateUUID() };
                db.users.push(newUser);
                result = newUser;
                break;
            
            case 'updateUserProfile':
                const uIdx = db.users.findIndex((user:any) => user.id === params.id);
                if(uIdx === -1) throw new Error("User not found");
                db.users[uIdx].name = params.name;
                if(params.password) db.users[uIdx].password = params.password;
                result = db.users[uIdx];
                break;

            case 'manageUser':
                if (params.type === 'add') {
                    if(db.users.find((u:any) => u.username === params.data.username)) throw new Error("Username exists");
                    db.users.push({ ...params.data, id: generateUUID() });
                } else if (params.type === 'edit') {
                    const idx = db.users.findIndex((u:any) => u.id === params.data.id);
                    if(idx !== -1) {
                        const updateData = { ...params.data };
                        if(!updateData.password) delete updateData.password;
                        db.users[idx] = { ...db.users[idx], ...updateData };
                    }
                } else if (params.type === 'delete') {
                    db.users = db.users.filter((u:any) => u.id !== params.id);
                }
                break;

            case 'getAllUsers': result = db.users; break;

            // --- SETTINGS ---
            case 'getSchoolSettings': result = db.settings; break;
            case 'updateSchoolSettings':
                db.settings = { ...db.settings, ...params };
                break;
            
            case 'factoryReset':
                localStorage.removeItem(MOCK_STORAGE_KEY);
                result = { success: true };
                break;

            // --- DASHBOARD ---
            case 'getDashboardStats':
                result = {
                    totalStudents: db.students.filter((s:any) => s.status === 'Active').length,
                    totalStaff: db.staff.filter((s:any) => s.status === 'Active').length,
                    collectedFees: db.transactions.filter((t:any) => t.type === 'Fee' && t.status === 'Paid').reduce((acc:number, t:any) => acc + t.amount, 0),
                    pendingFees: db.invoices.filter((i:any) => i.status === 'Pending').reduce((acc:number, i:any) => acc + i.amount_due, 0),
                    attendanceToday: 0
                };
                break;

            // --- STUDENTS ---
            case 'getAllStudents': result = db.students; break;
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
                        params.student.initialCourses.forEach((ic:any) => {
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

            // --- STAFF ---
            case 'getAllStaff': result = db.staff; break;
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

            case 'updateEmployee':
                const empToUpdate = db.staff.find((s:any) => s.id === params.id);
                if(empToUpdate) empToUpdate.status = params.status;
                break;

            case 'logEmployeePromotion':
                const { employee_id, designation_to, new_salary, date, reason } = params;
                const empIdx = db.staff.findIndex((s:any) => s.id === employee_id);
                if (empIdx === -1) throw new Error("Employee not found");
                
                const currentStaff = db.staff[empIdx];
                if (!db.employee_history) db.employee_history = [];
                db.employee_history.push({
                    id: generateUUID(),
                    employee_id: employee_id,
                    designation_from: currentStaff.designation,
                    designation_to: designation_to,
                    date: date,
                    reason: reason
                });
                db.staff[empIdx] = { ...currentStaff, designation: designation_to, salary: new_salary };
                result = { success: true };
                break;

             // --- COURSES / THERAPIES ---
            case 'getAllCourses': result = db.courses; break;
            case 'manageCourse':
                if (params.type === 'add') {
                    db.courses.push({ ...params.data, id: generateUUID() });
                } else if (params.type === 'edit') {
                    const idx = db.courses.findIndex((c:any) => c.id === params.data.id);
                    if(idx !== -1) db.courses[idx] = { ...db.courses[idx], ...params.data };
                } else if (params.type === 'delete') {
                    db.courses = db.courses.filter((c:any) => c.id !== params.id);
                }
                break;

            case 'getAllStudentCourses': result = db.student_courses; break;
            case 'enrollStudentCourse':
                 db.student_courses.push({ id: generateUUID(), studentId: params.studentId, courseId: params.courseId, feeBasis: params.feeBasis, agreedFee: params.agreedFee });
                 break;
            case 'removeStudentCourse':
                 db.student_courses = db.student_courses.filter((sc:any) => sc.id !== params.id);
                 break;
            
            // --- CLASSES & EXAMS ---
            case 'getAllClasses': result = db.classes; break;
            case 'getExams': result = db.exams; break;
            case 'addExam':
                db.exams.push({ id: generateUUID(), name: params.name, classId: params.classId, schedule: params.schedule });
                break;
            case 'recordStudentResult':
                 if (!db.exam_results) db.exam_results = [];
                 db.exam_results = db.exam_results.filter((r:any) => !(r.studentId === params.student_id && r.examId === params.exam_id && r.subject === params.subject_name));
                 db.exam_results.push({
                    id: generateUUID(),
                    studentId: params.student_id,
                    examId: params.exam_id,
                    subject: params.subject_name,
                    marksObtained: params.marks_obtained,
                    totalMarks: params.total_marks,
                    grade: params.grade
                });
                break;
            
            case 'getStandardSubjects': result = ['English', 'Math', 'Science', 'History', 'Geography', 'Art', 'Urdu', 'Computer']; break;

            // --- ATTENDANCE ---
            case 'getAttendance':
                result = db.attendance.filter((a:any) => a.date === params.date && a.entityType === params.type);
                break;
            case 'getAttendanceReport':
                // Fetch attendance for the entire month
                // params: { month: 'YYYY-MM', type: 'Student' | 'Staff' }
                result = db.attendance.filter((a:any) => a.date.startsWith(params.month) && a.entityType === params.type);
                break;
            case 'saveAttendance':
                const { records } = params;
                if (!records || records.length === 0) break;
                const newEntityIds = records.map((r:any) => r.entityId);
                db.attendance = db.attendance.filter((a:any) => !(a.date === records[0].date && a.entityType === records[0].entityType && newEntityIds.includes(a.entityId)));
                records.forEach((r:any) => db.attendance.push({ ...r, id: generateUUID() }));
                break;
            
            // --- FINANCE ---
            case 'getAllInvoices': result = db.invoices; break;
            case 'getTransactions': result = db.transactions; break;
            case 'createTransaction':
                const txn = { ...params.txn, id: generateUUID() };
                db.transactions.push(txn);
                result = txn;
                break;
            case 'markInvoicePaid':
                const invToPay = db.invoices.find((i:any) => i.id === params.id);
                if (invToPay) {
                    invToPay.status = 'Paid';
                    invToPay.payment_date = new Date().toISOString().split('T')[0];
                    db.transactions.push({
                        id: generateUUID(),
                        type: 'Fee',
                        amount: invToPay.amount_due,
                        date: new Date().toISOString().split('T')[0],
                        entityId: invToPay.student_id,
                        description: `Invoice Payment: ${invToPay.invoiceNo}`,
                        status: 'Paid'
                    });
                }
                break;
            
            case 'deleteInvoice':
                 const invToDel = db.invoices.find((i:any) => i.id === params.id);
                 if(invToDel) {
                     // Release adjustments linked to this invoice so they can be re-billed
                     const linkedAdjs = db.student_adjustments.filter((a:any) => a.invoiceId === params.id);
                     linkedAdjs.forEach((a:any) => {
                         a.isApplied = false;
                         delete a.invoiceId;
                     });
                     db.invoices = db.invoices.filter((i:any) => i.id !== params.id);
                 }
                 break;

            case 'getInvoiceDetails':
                const inv = db.invoices.find((i:any) => i.id === params.id);
                if (!inv) throw new Error("Invoice not found");
                const stdForInv = db.students.find((s:any) => s.id === inv.student_id);
                result = { invoice: inv, student: stdForInv };
                break;

             case 'createCustomInvoice':
                 const studentForInv = db.students.find((s:any) => s.id === params.studentId);
                 if (!studentForInv) throw new Error("Student not found");
                 const invNum = `INV-${db.settings.lastInvoiceNo + 1}`;
                 db.settings.lastInvoiceNo++;
                 const newInvId = generateUUID();
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
                 db.invoices.push(newInvoice);
                 if (isPaid) {
                     db.transactions.push({
                         id: generateUUID(),
                         type: 'Fee',
                         amount: params.amount,
                         date: new Date().toISOString().split('T')[0],
                         entityId: studentForInv.id,
                         description: `Instant Payment: ${params.type} (${invNum})`,
                         status: 'Paid'
                     });
                 }
                 result = newInvoice;
                 break;

             case 'addStudentAdjustment':
                 const pendingInvoice = db.invoices.find((i:any) => i.student_id === params.studentId && i.status === 'Pending');
                 if (pendingInvoice) {
                     pendingInvoice.items.push({ description: `${params.type}: ${params.description}`, amount: params.amount });
                     pendingInvoice.amount_due += params.amount;
                     db.student_adjustments.push({ ...params, id: generateUUID(), isApplied: true, invoiceId: pendingInvoice.id });
                     result = { addedToInvoice: true, invoiceId: pendingInvoice.id };
                 } else {
                     db.student_adjustments.push({ ...params, id: generateUUID(), isApplied: false });
                     result = { addedToInvoice: false };
                 }
                 break;

             case 'generateInvoice':
                 // Simplified logic for mock
                 const { month_year, studentId } = params;
                 let generatedCount = 0;
                 const targetStudents = studentId 
                    ? db.students.filter((s:any) => s.id === studentId) 
                    : db.students.filter((s:any) => s.status === 'Active');

                 targetStudents.forEach((s:any) => {
                     const existingInvoices = db.invoices.filter((i:any) => i.student_id === s.id && i.month_year === month_year);
                     const hasTuitionInvoice = existingInvoices.some((inv:any) => inv.items.some((item:any) => item.description.startsWith('Tuition:') || item.description.includes('Therapy')));
                     const items: {description: string, amount: number}[] = [];

                     if (!hasTuitionInvoice) {
                         const monthlyCourses = db.student_courses.filter((sc:any) => sc.studentId === s.id && sc.feeBasis === 'Monthly');
                         monthlyCourses.forEach((c:any) => {
                             const courseDef = db.courses.find((cd:any) => cd.id === c.courseId);
                             items.push({ description: `${courseDef ? courseDef.name : 'Therapy'}`, amount: c.agreedFee });
                         });
                     }
                     const adjs = db.student_adjustments.filter((a:any) => a.studentId === s.id && !a.isApplied);
                     adjs.forEach((a:any) => { items.push({ description: `${a.type}: ${a.description}`, amount: a.amount }); });

                     if (items.length > 0) {
                         const total = items.reduce((sum:number, x:any) => sum + x.amount, 0);
                         const newId = generateUUID();
                         db.invoices.push({
                             id: newId,
                             invoiceNo: `INV-${db.settings.lastInvoiceNo + 1}`,
                             student_id: s.id,
                             student_name: s.name,
                             month_year: month_year,
                             due_date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
                             status: 'Pending',
                             items: items,
                             amount_due: total
                         });
                         db.settings.lastInvoiceNo++;
                         adjs.forEach((a:any) => {
                             const r = db.student_adjustments.find((x:any) => x.id === a.id);
                             if (r) { r.isApplied = true; r.invoiceId = newId; }
                         });
                         generatedCount++;
                     }
                 });
                 result = { generated: generatedCount };
                 break;

            // --- PAYROLL (UPDATED FOR EXACT DAYS) ---
            case 'getAdjustments': result = params.staffId ? db.salary_adjustments.filter((a:any) => a.staffId === params.staffId) : db.salary_adjustments; break;
            case 'addAdjustment':
                 if (params.id) {
                     const idx = db.salary_adjustments.findIndex((a:any) => a.id === params.id);
                     if(idx !== -1) db.salary_adjustments[idx] = { ...db.salary_adjustments[idx], ...params };
                 } else {
                     db.salary_adjustments.push({ ...params, id: generateUUID(), isApplied: false });
                 }
                 break;
            case 'deleteAdjustment':
                 db.salary_adjustments = db.salary_adjustments.filter((a:any) => a.id !== params.id);
                 break;
            case 'getSlipsByMonth':
                 result = db.salary_slips.filter((s:any) => s.monthYear === params.monthYear).map((slip:any) => {
                     const st = db.staff.find((x:any) => x.id === slip.staffId);
                     return { ...slip, staff_name: st?.name || 'Unknown', staff_designation: st?.designation || '' };
                 });
                 break;
            case 'getSlipById':
                 const slipMock = db.salary_slips.find((s:any) => s.id === params.id);
                 if(!slipMock) throw new Error("Slip not found");
                 const slipAdjs = db.salary_adjustments.filter((a:any) => slipMock.adjustmentIds.includes(a.id));
                 result = { ...slipMock, adjustments: slipAdjs };
                 break;
            case 'generatePayroll':
                 const { monthYear, staffIds } = params;
                 let count = 0;
                 const targetStaff = staffIds 
                    ? db.staff.filter((s:any) => staffIds.includes(s.id))
                    : db.staff.filter((s:any) => s.status === 'Active');

                 // 1. Calculate Total Days in Month
                 const [year, month] = monthYear.split('-').map(Number);
                 const daysInMonth = new Date(year, month, 0).getDate(); // e.g., 28, 30, 31

                 // 2. Identify Holidays / Off Days count for this specific month
                 // (Simplified: We won't iterate every day here for performance unless necessary, 
                 // but we will use the Attendance records to find Unpaid leaves accurately)
                 
                 targetStaff.forEach((st:any) => {
                     if (db.salary_slips.some((s:any) => s.staffId === st.id && s.monthYear === monthYear)) return;
                     
                     // 3. Calculate Daily Rate
                     const dailyRate = st.salary / daysInMonth;

                     // 4. Count Unpaid Absences from Attendance
                     // Only 'Absent' or 'UnpaidLeave' causes deduction.
                     // 'PaidLeave', 'Late', 'Present' do not cause deduction (unless Late policy exists, ignoring for now)
                     const absences = db.attendance.filter((a:any) => 
                        a.entityId === st.id && 
                        a.entityType === 'Staff' && 
                        a.date.startsWith(monthYear) && 
                        (a.status === 'Absent' || a.status === 'UnpaidLeave')
                     ).length;

                     const attendanceDeduction = Math.floor(absences * dailyRate);

                     const relevantAdjs = db.salary_adjustments.filter((a:any) => 
                         a.staffId === st.id && !a.isApplied && 
                         a.date.substring(0,7) <= monthYear
                     );
                     
                     const additions = relevantAdjs.filter((a:any) => a.type === 'Bonus').reduce((sum:number, a:any) => sum + a.amount, 0);
                     const deductions = relevantAdjs.filter((a:any) => a.type !== 'Bonus').reduce((sum:number, a:any) => sum + a.amount, 0);

                     const net = st.salary + additions - deductions - attendanceDeduction;

                     const newSlip = {
                         id: generateUUID(),
                         staffId: st.id,
                         monthYear: monthYear,
                         baseSalary: st.salary,
                         totalBonuses: additions,
                         totalDeductions: deductions,
                         attendanceDeduction: attendanceDeduction,
                         netSalary: net,
                         adjustmentIds: relevantAdjs.map((a:any) => a.id),
                         generationDate: Date.now(),
                         status: 'Pending',
                         attendanceStats: { 
                             totalDays: daysInMonth, 
                             workingDays: daysInMonth, // Just ref
                             present: daysInMonth - absences, // Assumes present if not marked absent (inclusive of holidays)
                             late: 0, 
                             absent: absences, 
                             paidLeave: 0,
                             holidays: 0
                         }
                     };
                     db.salary_slips.push(newSlip);
                     
                     relevantAdjs.forEach((a:any) => {
                         const ra = db.salary_adjustments.find((x:any) => x.id === a.id);
                         if(ra) { ra.isApplied = true; ra.appliedMonthYear = monthYear; }
                     });
                     count++;
                 });
                 result = { generatedCount: count };
                 break;
             
             case 'paySalarySlip':
                 const sToPay = db.salary_slips.find((s:any) => s.id === params.id);
                 if(sToPay) sToPay.status = 'Paid';
                 break;
             case 'deleteSalarySlip':
                 db.salary_slips = db.salary_slips.filter((s:any) => s.id !== params.id);
                 break;

            // --- FILES ---
            case 'uploadTherapyFile':
                if (!db.therapy_files) db.therapy_files = [];
                db.therapy_files.push({ ...params, id: generateUUID(), uploadDate: new Date().toISOString() });
                break;
            case 'deleteTherapyFile':
                db.therapy_files = db.therapy_files.filter((f:any) => f.id !== params.id);
                break;
            
             // --- DATA ---
            case 'exportDatabase': result = db; break;
            case 'importDatabase': 
                if (params.data && params.data.users) {
                    saveMockDB(params.data);
                }
                break;

            default: break;
        }
        
        saveMockDB(db);
        return result;

    } catch (e: any) {
        console.error("Mock DB Error:", e);
        throw e;
    }
}

// --- REAL SERVER REQUEST HANDLER ---
// This is effectively disabled when USE_MOCK is true, 
// but kept for type safety or future expansion if needed.
async function realRequestHandler<T>(action: string, params: any = {}): Promise<T> {
  console.warn("Real request handler called in Mock mode. This should not happen.");
  return Promise.reject("Backend is disabled.");
}

// --- EXPORT ---

// Switcher logic
const requestHandler = USE_MOCK ? mockRequestHandler : realRequestHandler;

export const api = {
  request: requestHandler,
  
  // Auth
  login: (username: string, password: string) => requestHandler<User>('login', { username, password }),
  
  // Settings
  getSettings: () => requestHandler<SchoolSettings>('getSchoolSettings'),
  
  // Dashboard
  getDashboardStats: () => requestHandler<any>('getDashboardStats'),
  
  // Students
  getStudents: () => requestHandler<Student[]>('getAllStudents'),
  saveStudent: (student: Partial<Student> & { initialCourses?: any[] }, user: User) => requestHandler<Student>('saveStudent', { student, user }),
  
  // Staff
  getStaff: () => requestHandler<Staff[]>('getAllStaff'),
  saveStaff: (staff: Partial<Staff>, user: User) => requestHandler<Staff>('saveStaff', { staff, user }),
  
  // Courses / Classes
  getClasses: () => requestHandler<ClassLevel[]>('getAllClasses'),
  
  // Exams
  getExams: () => requestHandler<Exam[]>('getExams'),
  
  // Transactions
  createTransaction: (txn: Partial<FinancialTransaction>, user: User) => requestHandler<FinancialTransaction>('createTransaction', { txn, user }),
  
  // Audit Logs
  getAuditLogs: () => requestHandler<AuditLogEntry[]>('getAuditLogs'),
  
  // Attendance
  getAttendance: (date: string, type: 'Student' | 'Staff') => requestHandler<AttendanceRecord[]>('getAttendance', { date, type }),
  getAttendanceReport: (month: string, type: 'Student' | 'Staff') => requestHandler<AttendanceRecord[]>('getAttendanceReport', { month, type }),
  saveAttendance: (records: AttendanceRecord[], user: User) => requestHandler<void>('saveAttendance', { records, user }),

  // Data
  exportDatabase: () => requestHandler<any>('exportDatabase'),
  importDatabase: (data: any) => requestHandler<void>('importDatabase', { data }),
  factoryReset: () => requestHandler<void>('factoryReset'),
};
