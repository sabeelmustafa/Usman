
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
// Use process.env.PORT for CPanel/Hosting environments, default to 3001
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'db.json');

console.log(`Starting Server...`);
console.log(`Root Directory: ${__dirname}`);

app.use(cors());
// Increase limit for Base64 image/file uploads
app.use(express.json({ limit: '50mb' }));

const generateUUID = () => {
    // Robust UUID generation that works on old and new Node versions
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- DATABASE MANAGEMENT ---
const loadDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return data ? JSON.parse(data) : null;
    }
  } catch (e) { console.error("Error reading DB", e); }
  return null;
};

// DEBOUNCED WRITE LOGIC
// Prevents 508 Resource Limit errors by throttling disk writes
let writeTimer = null;

const saveDB = (data) => {
  if (writeTimer) {
      clearTimeout(writeTimer);
  }

  writeTimer = setTimeout(() => {
      try {
          fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      } catch(e) {
          console.error("Error saving DB", e);
      }
  }, 2000); // 2000ms delay
};

// Define the full structure of a fresh database
const getEmptyDB = () => ({
    users: [
       { id: generateUUID(), username: 'admin', password: 'admin', role: 'Admin', name: 'System Admin' }
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
      weeklyOffDays: [0, 6],
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

let db = loadDB();

// --- INITIALIZATION & MIGRATION LOGIC ---
if (!db) {
  // Scenario 1: No DB exists. Create fresh.
  console.log("No DB found. Creating new database.");
  db = getEmptyDB();
  // Force immediate write on creation
  try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch(e) { console.error("Init Error", e); }
} else {
  // Scenario 2: DB exists. Check for missing keys (Migration)
  const emptyDB = getEmptyDB();
  let modified = false;
  
  Object.keys(emptyDB).forEach(key => {
      if (db[key] === undefined) {
          console.log(`Migrating DB: Adding missing key '${key}'`);
          db[key] = emptyDB[key];
          modified = true;
      }
  });

  // Ensure settings object has all new fields
  if (db.settings) {
      Object.keys(emptyDB.settings).forEach(settingKey => {
          if (db.settings[settingKey] === undefined) {
              db.settings[settingKey] = emptyDB.settings[settingKey];
              modified = true;
          }
      });
  }

  if (modified) {
      saveDB(db);
      console.log("Database schema updated successfully.");
  }
}

// --- LOGGING ---
const logAudit = (userId, userName, action, resource, details = "") => {
    if (!db.audit_logs) db.audit_logs = [];
    db.audit_logs.unshift({
        id: generateUUID(),
        timestamp: Date.now(),
        userId, userName, action, resource, details
    });
};

// --- HEALTH CHECK ENDPOINT ---
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        timestamp: new Date().toISOString(),
        db_status: db ? 'loaded' : 'error'
    });
});

// --- RPC ENDPOINT ---
app.post('/api/rpc', (req, res) => {
    const { action, params } = req.body;
    let result = {};
    
    try {
        switch (action) {
            // --- AUTH ---
            case 'login':
                const u = db.users.find(u => u.username === params.username && u.password === params.password);
                if (!u) throw new Error("Invalid credentials");
                result = u;
                logAudit(u.id, u.name, 'LOGIN', 'Auth', 'User logged in');
                break;
            
            case 'registerUser':
                if(db.users.find(u => u.username === params.username)) throw new Error("Username exists");
                const newUser = { ...params, id: generateUUID() };
                db.users.push(newUser);
                saveDB(db);
                result = newUser;
                break;

            case 'updateUserProfile':
                const uIdx = db.users.findIndex(user => user.id === params.id);
                if(uIdx === -1) throw new Error("User not found");
                db.users[uIdx].name = params.name;
                if(params.password) db.users[uIdx].password = params.password;
                saveDB(db);
                result = db.users[uIdx];
                break;

            case 'manageUser':
                if (params.type === 'add') {
                    if(db.users.find(u => u.username === params.data.username)) throw new Error("Username exists");
                    db.users.push({ ...params.data, id: generateUUID() });
                } else if (params.type === 'edit') {
                    const idx = db.users.findIndex(u => u.id === params.data.id);
                    if(idx !== -1) {
                        const updateData = { ...params.data };
                        if(!updateData.password) delete updateData.password;
                        db.users[idx] = { ...db.users[idx], ...updateData };
                    }
                } else if (params.type === 'delete') {
                    db.users = db.users.filter(u => u.id !== params.id);
                }
                saveDB(db);
                break;

            case 'getAllUsers': result = db.users; break;

            // --- SETTINGS ---
            case 'getSchoolSettings': result = db.settings; break;
            case 'updateSchoolSettings':
                db.settings = { ...db.settings, ...params };
                saveDB(db);
                break;

            // --- DASHBOARD ---
            case 'getDashboardStats':
                result = {
                    totalStudents: db.students.filter(s => s.status === 'Active').length,
                    totalStaff: db.staff.filter(s => s.status === 'Active').length,
                    collectedFees: db.transactions.filter(t => t.type === 'Fee' && t.status === 'Paid').reduce((acc, t) => acc + t.amount, 0),
                    pendingFees: db.invoices.filter(i => i.status === 'Pending').reduce((acc, i) => acc + i.amount_due, 0),
                    attendanceToday: 0
                };
                break;

            // --- STUDENTS ---
            case 'getAllStudents': result = db.students; break;
            
            case 'saveStudent':
                if (params.student.id) {
                    const idx = db.students.findIndex(s => s.id === params.student.id);
                    if (idx >= 0) db.students[idx] = { ...db.students[idx], ...params.student };
                    result = db.students[idx];
                } else {
                    const newS = { ...params.student, id: generateUUID() };
                    db.students.push(newS);
                    result = newS;
                    if (params.student.initialCourses) {
                        params.student.initialCourses.forEach(ic => {
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

            case 'getStudentDetails':
                const std = db.students.find(s => s.id === params.id);
                if (!std) throw new Error("Student not found");
                const invs = db.invoices.filter(i => i.student_id === params.id);
                const adjs = db.student_adjustments.filter(a => a.studentId === params.id && !a.isApplied);
                const scs = db.student_courses.filter(sc => sc.studentId === params.id).map(sc => {
                    const c = db.courses.find(x => x.id === sc.courseId);
                    return { ...sc, courseName: c ? c.name : 'Unknown' };
                });
                const files = db.therapy_files.filter(f => f.studentId === params.id);
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
                    const idx = db.staff.findIndex(s => s.id === params.staff.id);
                    if (idx >= 0) db.staff[idx] = { ...db.staff[idx], ...params.staff };
                    result = db.staff[idx];
                } else {
                    const newSt = { ...params.staff, id: generateUUID() };
                    db.staff.push(newSt);
                    result = newSt;
                }
                saveDB(db);
                break;

            case 'getEmployeeDetails':
                const emp = db.staff.find(s => s.id === params.id);
                if (!emp) throw new Error("Employee not found");
                result = {
                    ...emp,
                    history: db.employee_history ? db.employee_history.filter(h => h.employee_id === params.id) : [],
                    salaries: db.salary_slips.filter(s => s.staffId === params.id)
                };
                break;
            
            case 'updateEmployee':
                const empToUpdate = db.staff.find(s => s.id === params.id);
                if(empToUpdate) {
                    empToUpdate.status = params.status;
                    saveDB(db);
                }
                break;

            case 'logEmployeePromotion':
                const { employee_id, designation_to, new_salary, date, reason } = params;
                const empIdx = db.staff.findIndex(s => s.id === employee_id);
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
                saveDB(db);
                result = { success: true };
                break;

             // --- COURSES / THERAPIES ---
            case 'getAllCourses': result = db.courses; break;
            case 'manageCourse':
                if (params.type === 'add') {
                    if (!db.courses) db.courses = [];
                    db.courses.push({ ...params.data, id: generateUUID() });
                } else if (params.type === 'edit') {
                    if (!db.courses) db.courses = [];
                    const idx = db.courses.findIndex(c => c.id === params.data.id);
                    if(idx !== -1) db.courses[idx] = { ...db.courses[idx], ...params.data };
                } else if (params.type === 'delete') {
                    if (!db.courses) db.courses = [];
                    db.courses = db.courses.filter(c => c.id !== params.id);
                }
                saveDB(db);
                break;
            
            case 'getAllStudentCourses': result = db.student_courses; break;
            case 'enrollStudentCourse':
                 db.student_courses.push({ id: generateUUID(), studentId: params.studentId, courseId: params.courseId, feeBasis: params.feeBasis, agreedFee: params.agreedFee });
                 saveDB(db);
                 break;
            case 'removeStudentCourse':
                 db.student_courses = db.student_courses.filter(sc => sc.id !== params.id);
                 saveDB(db);
                 break;

            // --- CLASSES & EXAMS ---
            case 'getAllClasses': result = db.classes; break;
            case 'getExams': result = db.exams; break;
            case 'addExam':
                db.exams.push({ id: generateUUID(), name: params.name, classId: params.classId, schedule: params.schedule });
                saveDB(db);
                break;
            
            case 'recordStudentResult':
                if (!db.exam_results) db.exam_results = [];
                db.exam_results = db.exam_results.filter(r => !(r.studentId === params.student_id && r.examId === params.exam_id && r.subject === params.subject_name));
                
                db.exam_results.push({
                    id: generateUUID(),
                    studentId: params.student_id,
                    examId: params.exam_id,
                    subject: params.subject_name,
                    marksObtained: params.marks_obtained,
                    totalMarks: params.total_marks,
                    grade: params.grade
                });
                saveDB(db);
                break;
            
            case 'getStandardSubjects': result = ['English', 'Math', 'Science', 'History', 'Geography', 'Art', 'Urdu', 'Computer']; break;

            // --- ATTENDANCE ---
            case 'getAttendance':
                result = db.attendance.filter(a => a.date === params.date && a.entityType === params.type);
                break;
            case 'getAttendanceReport':
                // Fetch attendance for the entire month
                // params: { month: 'YYYY-MM', type: 'Student' | 'Staff' }
                result = db.attendance.filter(a => a.date.startsWith(params.month) && a.entityType === params.type);
                break;
            case 'saveAttendance':
                const { records } = params;
                if (!records || records.length === 0) break;
                const newEntityIds = records.map(r => r.entityId);
                db.attendance = db.attendance.filter(a => !(a.date === records[0].date && a.entityType === records[0].entityType && newEntityIds.includes(a.entityId)));
                records.forEach(r => db.attendance.push({ ...r, id: generateUUID() }));
                saveDB(db);
                break;

            // --- FINANCE: INVOICES & TRANSACTIONS ---
            case 'getAllInvoices': result = db.invoices; break;
            case 'getTransactions': result = db.transactions; break;
            
            case 'createTransaction':
                const txn = { ...params.txn, id: generateUUID() };
                db.transactions.push(txn);
                saveDB(db);
                result = txn;
                break;

            case 'markInvoicePaid':
                const invToPay = db.invoices.find(i => i.id === params.id);
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
                    saveDB(db);
                }
                break;
            
            case 'deleteInvoice':
                 const invToDel = db.invoices.find(i => i.id === params.id);
                 if(invToDel) {
                     const linkedAdjs = db.student_adjustments.filter(a => a.invoiceId === params.id);
                     linkedAdjs.forEach(a => {
                         a.isApplied = false;
                         delete a.invoiceId;
                     });
                     db.invoices = db.invoices.filter(i => i.id !== params.id);
                     saveDB(db);
                 }
                 break;

            case 'getInvoiceDetails':
                const inv = db.invoices.find(i => i.id === params.id);
                if (!inv) throw new Error("Invoice not found");
                const stdForInv = db.students.find(s => s.id === inv.student_id);
                result = { invoice: inv, student: stdForInv };
                break;

            case 'createCustomInvoice':
                 const studentForInv = db.students.find(s => s.id === params.studentId);
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

            case 'addStudentAdjustment':
                 const pendingInvoice = db.invoices.find(i => i.student_id === params.studentId && i.status === 'Pending');
                 if (pendingInvoice) {
                     pendingInvoice.items.push({ description: `${params.type}: ${params.description}`, amount: params.amount });
                     pendingInvoice.amount_due += params.amount;
                     db.student_adjustments.push({ ...params, id: generateUUID(), isApplied: true, invoiceId: pendingInvoice.id });
                     result = { addedToInvoice: true, invoiceId: pendingInvoice.id };
                 } else {
                     db.student_adjustments.push({ ...params, id: generateUUID(), isApplied: false });
                     result = { addedToInvoice: false };
                 }
                 saveDB(db);
                 break;

            case 'generateInvoice':
                 const { month_year, studentId } = params;
                 let generatedCount = 0;
                 const targetStudents = studentId 
                    ? db.students.filter(s => s.id === studentId) 
                    : db.students.filter(s => s.status === 'Active');

                 targetStudents.forEach(s => {
                     const existingInvoices = db.invoices.filter(i => i.student_id === s.id && i.month_year === month_year);
                     const hasTuitionInvoice = existingInvoices.some(inv => inv.items.some(item => item.description.startsWith('Tuition:') || item.description.includes('Therapy')));
                     const items = [];

                     if (!hasTuitionInvoice) {
                         const monthlyCourses = db.student_courses.filter(sc => sc.studentId === s.id && sc.feeBasis === 'Monthly');
                         monthlyCourses.forEach(c => {
                             const courseDef = db.courses.find(cd => cd.id === c.courseId);
                             items.push({ description: `${courseDef ? courseDef.name : 'Therapy'}`, amount: c.agreedFee });
                         });
                         const dailyCourses = db.student_courses.filter(sc => sc.studentId === s.id && sc.feeBasis === 'Daily');
                         if (dailyCourses.length > 0) {
                             const presentDays = db.attendance.filter(a => a.entityId === s.id && a.entityType === 'Student' && a.date.startsWith(month_year) && (a.status === 'Present' || a.status === 'Late')).length;
                             if (presentDays > 0) {
                                 dailyCourses.forEach(c => {
                                     const courseDef = db.courses.find(cd => cd.id === c.courseId);
                                     items.push({ description: `${courseDef ? courseDef.name : 'Therapy'} (${presentDays} days)`, amount: c.agreedFee * presentDays });
                                 });
                             }
                         }
                     }
                     const adjs = db.student_adjustments.filter(a => a.studentId === s.id && !a.isApplied);
                     adjs.forEach(a => { items.push({ description: `${a.type}: ${a.description}`, amount: a.amount }); });

                     if (items.length > 0) {
                         const total = items.reduce((sum, x) => sum + x.amount, 0);
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
                         adjs.forEach(a => {
                             const r = db.student_adjustments.find(x => x.id === a.id);
                             if (r) { r.isApplied = true; r.invoiceId = newId; }
                         });
                         generatedCount++;
                     }
                 });
                 saveDB(db);
                 result = { generated: generatedCount, message: "Invoices Generated" };
                 break;

            // --- PAYROLL & SALARY ---
            case 'getAdjustments':
                if (params.staffId) {
                    result = db.salary_adjustments.filter(a => a.staffId === params.staffId);
                } else {
                    result = db.salary_adjustments;
                }
                break;

            case 'addAdjustment':
                 if (params.id) {
                     const idx = db.salary_adjustments.findIndex(a => a.id === params.id);
                     if(idx !== -1) db.salary_adjustments[idx] = { ...db.salary_adjustments[idx], ...params };
                 } else {
                     db.salary_adjustments.push({ ...params, id: generateUUID(), isApplied: false });
                 }
                 saveDB(db);
                 break;
            
            case 'deleteAdjustment':
                 db.salary_adjustments = db.salary_adjustments.filter(a => a.id !== params.id);
                 saveDB(db);
                 break;

            case 'updateAdjustmentDate':
                 const adjToShift = db.salary_adjustments.find(a => a.id === params.id);
                 if(adjToShift) {
                     adjToShift.date = params.newDate;
                     saveDB(db);
                 }
                 break;
            
            case 'getSlipsByMonth':
                 result = db.salary_slips.filter(s => s.monthYear === params.monthYear);
                 result = result.map(slip => {
                     const st = db.staff.find(x => x.id === slip.staffId);
                     return { ...slip, staff_name: st?.name || 'Unknown', staff_designation: st?.designation || '' };
                 });
                 break;
            
            case 'getSlipById':
                 const slip = db.salary_slips.find(s => s.id === params.id);
                 if(!slip) throw new Error("Slip not found");
                 const slipAdjs = db.salary_adjustments.filter(a => slip.adjustmentIds.includes(a.id));
                 result = { ...slip, adjustments: slipAdjs };
                 break;

            case 'generatePayroll':
                 const { monthYear, staffIds } = params;
                 let count = 0;
                 const targetStaff = staffIds 
                    ? db.staff.filter(s => staffIds.includes(s.id))
                    : db.staff.filter(s => s.status === 'Active');

                 const [year, month] = monthYear.split('-').map(Number);
                 const daysInMonth = new Date(year, month, 0).getDate();

                 targetStaff.forEach(st => {
                     if (db.salary_slips.some(s => s.staffId === st.id && s.monthYear === monthYear)) return;

                     const absences = db.attendance.filter(a => 
                         a.entityId === st.id && a.entityType === 'Staff' && 
                         a.date.startsWith(monthYear) && (a.status === 'Absent' || a.status === 'UnpaidLeave')
                     ).length;
                     
                     const dailyRate = st.salary / 30;
                     const attendanceDeduction = Math.floor(absences * dailyRate);

                     const relevantAdjs = db.salary_adjustments.filter(a => 
                         a.staffId === st.id && !a.isApplied && 
                         a.date.substring(0,7) <= monthYear
                     );

                     const additions = relevantAdjs.filter(a => a.type === 'Bonus').reduce((sum, a) => sum + a.amount, 0);
                     const deductions = relevantAdjs.filter(a => a.type !== 'Bonus').reduce((sum, a) => sum + a.amount, 0);

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
                         adjustmentIds: relevantAdjs.map(a => a.id),
                         generationDate: Date.now(),
                         status: 'Pending',
                         attendanceStats: { 
                             totalDays: 30, 
                             present: 30 - absences, 
                             late: 0, 
                             absent: absences, 
                             paidLeave: 0 
                         }
                     };

                     db.salary_slips.push(newSlip);
                     relevantAdjs.forEach(a => {
                         const ra = db.salary_adjustments.find(x => x.id === a.id);
                         if(ra) { ra.isApplied = true; ra.appliedMonthYear = monthYear; }
                     });
                     count++;
                 });
                 saveDB(db);
                 result = { generatedCount: count };
                 break;

            case 'deleteSalarySlip':
                 const slipToDel = db.salary_slips.find(s => s.id === params.id);
                 if(slipToDel) {
                     slipToDel.adjustmentIds.forEach(aid => {
                         const adj = db.salary_adjustments.find(a => a.id === aid);
                         if(adj) { adj.isApplied = false; adj.appliedMonthYear = null; }
                     });
                     db.salary_slips = db.salary_slips.filter(s => s.id !== params.id);
                     saveDB(db);
                 }
                 break;

            case 'paySalarySlip':
                 const slipToPay = db.salary_slips.find(s => s.id === params.id);
                 if(slipToPay) {
                     slipToPay.status = 'Paid';
                     db.transactions.push({
                        id: generateUUID(),
                        type: 'Salary',
                        amount: slipToPay.netSalary,
                        date: new Date().toISOString().split('T')[0],
                        entityId: slipToPay.staffId,
                        description: `Salary Payment: ${slipToPay.monthYear}`,
                        status: 'Paid'
                     });
                     saveDB(db);
                 }
                 break;
            
            case 'refreshSalarySlip':
                 result = db.salary_slips.find(s => s.id === params.slipId);
                 break;
            
            case 'postponeAdjustment':
                 const adjPostpone = db.salary_adjustments.find(a => a.id === params.id);
                 if(adjPostpone) {
                     const d = new Date(adjPostpone.date);
                     d.setMonth(d.getMonth() + 1);
                     adjPostpone.date = d.toISOString().split('T')[0];
                     adjPostpone.isApplied = false;
                     saveDB(db);
                 }
                 break;

            // --- FILES ---
            case 'uploadTherapyFile':
                if (!db.therapy_files) db.therapy_files = [];
                db.therapy_files.push({ ...params, id: generateUUID(), uploadDate: new Date().toISOString() });
                saveDB(db);
                break;
            case 'deleteTherapyFile':
                db.therapy_files = db.therapy_files.filter(f => f.id !== params.id);
                saveDB(db);
                break;

            // --- DATA ---
            case 'exportDatabase': result = db; break;
            case 'importDatabase': 
                if (!params.data || !params.data.users) throw new Error("Invalid backup file");
                db = params.data;
                saveDB(db);
                result = { success: true };
                break;

            case 'factoryReset':
                db = getEmptyDB();
                try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch(e) {}
                result = { success: true };
                break;

            default:
                break;
        }
        res.json(result);
    } catch (e) {
        console.error("RPC Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// --- STATIC FILES (PRODUCTION) ---
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.log(`Warning: 'dist' folder not found at ${distPath}. Serving API only.`);
    app.get('/', (req, res) => res.send('SchoolFlow API Server is Running. Frontend "dist" folder is missing.'));
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data file: ${DB_FILE}`);
});
