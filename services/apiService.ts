
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
      website: 'www.schoolflow.demo',
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

          case 'postponeAdjustment':
                 const adjPostpone = db.salary_adjustments.find((a:any) => a.id === params.id);
                 if (adjPostpone) {
                     adjPostpone.isApplied = false;
                     adjPostpone.appliedMonthYear = null;
                     saveDB(db);
                 }
                 break;

          case 'updateAdjustmentDate':
                 const adjUpdate = db.salary_adjustments.find((a:any) => a.id === params.id);
                 if (adjUpdate) {
                     adjUpdate.date = params.newDate;
                     // Reset application status
                     adjUpdate.isApplied = false;
                     adjUpdate.appliedMonthYear = null;
                     saveDB(db);
                 }
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
                 const { month_year, studentId } = params;
                 let count = 0;
                 
                 const targets = studentId 
                    ? db.students.filter((s:any) => s.id === studentId) 
                    : db.students.filter((s:any) => s.status === 'Active');

                 targets.forEach((s: any) => {
                     // Check existing invoices for this month
                     const existingInvoices = db.invoices.filter((i:any) => i.student_id === s.id && i.month_year === month_year);
                     // Check if Tuition has already been billed
                     const hasTuitionInvoice = existingInvoices.some((inv:any) => inv.items.some((item:any) => item.description.startsWith('Tuition:') || item.description.includes('Therapy')));
                     
                     const items = [];

                     // 1. Get Recurring Tuition Items (only if not already billed)
                     if (!hasTuitionInvoice) {
                         // A. Monthly Fee Students
                         const monthlyCourses = db.student_courses.filter((sc:any) => sc.studentId === s.id && sc.feeBasis === 'Monthly');
                         monthlyCourses.forEach((c:any) => {
                             const courseDef = db.courses.find((cd:any) => cd.id === c.courseId);
                             items.push({ 
                                 description: `${courseDef ? courseDef.name : 'Therapy'}`, 
                                 amount: c.agreedFee 
                             });
                         });

                         // B. Daily Fee Students (Calculate based on Attendance)
                         const dailyCourses = db.student_courses.filter((sc:any) => sc.studentId === s.id && sc.feeBasis === 'Daily');
                         if (dailyCourses.length > 0) {
                             // Fetch attendance
                             const presentDays = db.attendance.filter((a:any) => 
                                 a.entityId === s.id && 
                                 a.entityType === 'Student' &&
                                 a.date.startsWith(month_year) && 
                                 (a.status === 'Present' || a.status === 'Late')
                             ).length;

                             if (presentDays > 0) {
                                 dailyCourses.forEach((c:any) => {
                                     const courseDef = db.courses.find((cd:any) => cd.id === c.courseId);
                                     const total = c.agreedFee * presentDays;
                                     items.push({ 
                                         description: `${courseDef ? courseDef.name : 'Therapy'} (${presentDays} days)`, 
                                         amount: total 
                                     });
                                 });
                             }
                         }
                     }

                     // 2. Get Pending Adjustments (always check for these)
                     const adjs = db.student_adjustments.filter((a:any) => a.studentId === s.id && !a.isApplied);
                     adjs.forEach((a:any) => {
                         items.push({ description: `${a.type}: ${a.description}`, amount: a.amount });
                     });

                     // Only generate if there is something to bill
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
                         
                         // Update adjustments
                         adjs.forEach((a:any) => {
                             const idx = db.student_adjustments.findIndex((x:any) => x.id === a.id);
                             if (idx !== -1) {
                                 db.student_adjustments[idx].isApplied = true;
                                 db.student_adjustments[idx].invoiceId = newId;
                             }
                         });
                         
                         count++;
                     }
                 });
                 saveDB(db);
                 result = { generated: count, message: "Mock Invoice Generated" };
                 break;
                 
          case 'logEmployeePromotion':
                 const { employee_id, designation_to, new_salary, date, reason } = params;
                 
                 const empIdx = db.staff.findIndex((s:any) => s.id === employee_id);
                 if (empIdx === -1) throw new Error("Employee not found");
                 
                 const currentStaff = db.staff[empIdx];
                 
                 // Log to History
                 if (!db.employee_history) db.employee_history = [];
                 db.employee_history.push({
                     id: generateUUID(),
                     employee_id: employee_id,
                     designation_from: currentStaff.designation,
                     designation_to: designation_to,
                     date: date,
                     reason: reason
                 });
                 
                 // Update Profile
                 db.staff[empIdx] = {
                     ...currentStaff,
                     designation: designation_to,
                     salary: new_salary
                 };
                 
                 saveDB(db);
                 result = { success: true };
                 break;

          case 'generatePayroll':
                 // Minimal Mock Payroll
                 const { monthYear } = params;
                 let pCount = 0;
                 // Loop all staff
                 db.staff.forEach((s: any) => {
                     // Check if slip exists
                     if (!db.salary_slips.find((sl:any) => sl.staffId === s.id && sl.monthYear === monthYear)) {
                         
                         // Find pending adjustments for this staff member
                         const pendingAdjustments = db.salary_adjustments.filter((a:any) => a.staffId === s.id && !a.isApplied);
                         
                         let totalBonuses = 0;
                         let totalDeductions = 0;
                         const adjustmentIds: string[] = [];

                         pendingAdjustments.forEach((adj: any) => {
                             if (adj.type === 'Bonus') {
                                 totalBonuses += adj.amount;
                             } else {
                                 // Fine or Advance counts as deduction from payout
                                 totalDeductions += adj.amount;
                             }
                             adjustmentIds.push(adj.id);
                             
                             // Update the adjustment record as applied
                             const adjIndex = db.salary_adjustments.findIndex((a:any) => a.id === adj.id);
                             if (adjIndex !== -1) {
                                 db.salary_adjustments[adjIndex].isApplied = true;
                                 db.salary_adjustments[adjIndex].appliedMonthYear = monthYear;
                             }
                         });

                         const baseSalary = s.salary || 0;
                         
                         // Attendance Stats & Calculations
                         const daysInMonth = new Date(parseInt(monthYear.split('-')[0]), parseInt(monthYear.split('-')[1]), 0).getDate();
                         const attendanceRecords = db.attendance.filter((a:any) => 
                            a.entityId === s.id && 
                            a.entityType === 'Staff' &&
                            a.date.startsWith(monthYear)
                         );
                         
                         const presentCount = attendanceRecords.filter((a:any) => a.status === 'Present').length;
                         const lateCount = attendanceRecords.filter((a:any) => a.status === 'Late').length;
                         const absentCount = attendanceRecords.filter((a:any) => a.status === 'Absent' || a.status === 'UnpaidLeave').length; // Absent or Unpaid
                         const paidLeaveCount = attendanceRecords.filter((a:any) => a.status === 'PaidLeave').length;

                         // Calculate Deduction for Absence
                         let attendanceDeduction = 0;
                         if (absentCount > 0) {
                             const perDaySalary = baseSalary / daysInMonth;
                             attendanceDeduction = Math.round(absentCount * perDaySalary);
                         }

                         const netSalary = baseSalary + totalBonuses - totalDeductions - attendanceDeduction;

                         db.salary_slips.push({
                             id: generateUUID(),
                             staffId: s.id,
                             staff_name: s.name,
                             staff_designation: s.designation,
                             monthYear: monthYear,
                             baseSalary: baseSalary,
                             totalBonuses: totalBonuses,
                             totalDeductions: totalDeductions,
                             attendanceDeduction: attendanceDeduction,
                             netSalary: netSalary,
                             adjustmentIds: adjustmentIds,
                             generationDate: Date.now(),
                             status: 'Pending',
                             attendanceStats: { 
                                 totalDays: daysInMonth, 
                                 present: presentCount, 
                                 late: lateCount, 
                                 absent: absentCount, 
                                 paidLeave: paidLeaveCount 
                             }
                         });
                         pCount++;
                     }
                 });
                 saveDB(db);
                 result = { generatedCount: pCount, message: "Mock Payroll Generated" };
                 break;
          
          case 'refreshSalarySlip':
                 const slipToRefresh = db.salary_slips.find((s:any) => s.id === params.slipId);
                 if (!slipToRefresh) throw new Error("Slip not found");
                 
                 let rBonuses = 0;
                 let rDeductions = 0;
                 const validAdjIds: string[] = [];
                 
                 // Recalculate based on existing linked adjustments that are still applied
                 if (slipToRefresh.adjustmentIds) {
                     slipToRefresh.adjustmentIds.forEach((adjId: string) => {
                         const adj = db.salary_adjustments.find((a:any) => a.id === adjId);
                         // Keep it if it exists AND is marked applied (meaning it wasn't postponed/unlinked)
                         if (adj && adj.isApplied) {
                             if (adj.type === 'Bonus') rBonuses += adj.amount;
                             else rDeductions += adj.amount;
                             validAdjIds.push(adjId);
                         }
                     });
                 }

                 // Recalculate Attendance (in case records changed)
                 const rMonthYear = slipToRefresh.monthYear;
                 const rDaysInMonth = new Date(parseInt(rMonthYear.split('-')[0]), parseInt(rMonthYear.split('-')[1]), 0).getDate();
                 const rAttendance = db.attendance.filter((a:any) => 
                    a.entityId === slipToRefresh.staffId && 
                    a.entityType === 'Staff' &&
                    a.date.startsWith(rMonthYear)
                 );
                 const rAbsentCount = rAttendance.filter((a:any) => a.status === 'Absent' || a.status === 'UnpaidLeave').length;
                 const rPresentCount = rAttendance.filter((a:any) => a.status === 'Present').length;
                 const rLateCount = rAttendance.filter((a:any) => a.status === 'Late').length;
                 const rPaidLeaveCount = rAttendance.filter((a:any) => a.status === 'PaidLeave').length;

                 let rAttendanceDeduction = 0;
                 if (rAbsentCount > 0) {
                     const perDay = slipToRefresh.baseSalary / rDaysInMonth;
                     rAttendanceDeduction = Math.round(rAbsentCount * perDay);
                 }
                 
                 slipToRefresh.attendanceDeduction = rAttendanceDeduction;
                 slipToRefresh.attendanceStats = {
                     totalDays: rDaysInMonth,
                     present: rPresentCount,
                     late: rLateCount,
                     absent: rAbsentCount,
                     paidLeave: rPaidLeaveCount
                 };

                 slipToRefresh.adjustmentIds = validAdjIds;
                 slipToRefresh.totalBonuses = rBonuses;
                 slipToRefresh.totalDeductions = rDeductions;
                 slipToRefresh.netSalary = slipToRefresh.baseSalary + rBonuses - rDeductions - rAttendanceDeduction;
                 
                 saveDB(db);
                 // Return enriched slip
                 const rEnrichedAdjs = validAdjIds.map(id => db.salary_adjustments.find((a:any) => a.id === id));
                 result = { ...slipToRefresh, adjustments: rEnrichedAdjs };
                 break;

          case 'getSlipsByMonth':
                 // When fetching slips, we want to attach the full adjustment objects for display
                 const slips = db.salary_slips.filter((s:any) => s.monthYear === params.monthYear);
                 // Enrich with adjustments
                 result = slips.map((slip:any) => {
                     const adjs = slip.adjustmentIds 
                        ? db.salary_adjustments.filter((a:any) => slip.adjustmentIds.includes(a.id))
                        : [];
                     return { ...slip, adjustments: adjs };
                 });
                 break;
                 
          case 'getSlipById':
                 const slip = db.salary_slips.find((s:any) => s.id === params.id);
                 if (slip) {
                     const adjs = slip.adjustmentIds 
                        ? db.salary_adjustments.filter((a:any) => slip.adjustmentIds.includes(a.id))
                        : [];
                     result = { ...slip, adjustments: adjs };
                 } else {
                     result = null;
                 }
                 break;

          case 'deleteSalarySlip':
                 const slipDel = db.salary_slips.find((s:any) => s.id === params.id);
                 if (slipDel) {
                     // Release adjustments back to queue
                     if (slipDel.adjustmentIds) {
                         slipDel.adjustmentIds.forEach((aid:string) => {
                             const adj = db.salary_adjustments.find((a:any) => a.id === aid);
                             if (adj) {
                                 adj.isApplied = false;
                                 adj.appliedMonthYear = null;
                             }
                         });
                     }
                     // Delete slip
                     db.salary_slips = db.salary_slips.filter((s:any) => s.id !== params.id);
                     saveDB(db);
                 }
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

          // --- STUDENT FINANCIAL ACTIONS ---
          
          case 'addStudentAdjustment':
             // params: studentId, amount, type, description, date
             const pendingInvoice = db.invoices.find((i:any) => i.student_id === params.studentId && i.status === 'Pending');
             
             if (pendingInvoice) {
                 pendingInvoice.items.push({
                     description: `${params.type}: ${params.description}`,
                     amount: params.amount
                 });
                 pendingInvoice.amount_due += params.amount;
                 db.student_adjustments.push({ ...params, id: generateUUID(), isApplied: true, invoiceId: pendingInvoice.id });
                 result = { addedToInvoice: true, invoiceId: pendingInvoice.id };
             } else {
                 db.student_adjustments.push({ ...params, id: generateUUID(), isApplied: false });
                 result = { addedToInvoice: false };
             }
             saveDB(db);
             break;

          case 'createCustomInvoice':
             // params: studentId, amount, type, description, dueDate, status (optional)
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

             saveDB(db);
             result = newInvoice;
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
