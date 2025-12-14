
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const generateUUID = () => crypto.randomUUID();

const loadDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return data ? JSON.parse(data) : null;
    }
  } catch (e) { console.error("Error reading DB", e); }
  return null;
};

const saveDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

let db = loadDB();

if (!db) {
  const c1 = generateUUID();
  const s1 = generateUUID();
  db = {
    users: [
       { id: generateUUID(), username: 'admin', password: 'admin', role: 'Admin', name: 'System Admin' }
    ],
    students: [
      { 
        id: s1, name: 'Alice Johnson', status: 'Active', 
        dob: '2016-05-12', admissionDate: '2023-01-01', joiningDate: '2023-01-05',
        parentDetails: { name: 'Bob Johnson', contact: '555-0101', address: '123 Maple St' },
        profilePhotoBase64: null 
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
      name: 'Therapy School',
      address: '123 Care Lane',
      contact_no: '(555) 123-4567',
      email: 'admin@school.com',
      logo_url: '',
      currency: '$',
      lastInvoiceNo: 1000,
      bankName: '',
      bankAccountTitle: '',
      bankAccountNumber: '',
      bankIban: ''
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
  saveDB(db);
}

app.post('/api/rpc', (req, res) => {
    const { action, params } = req.body;
    let result = {};
    
    try {
        switch (action) {
            case 'login':
                const u = db.users.find(u => u.username === params.username && u.password === params.password);
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
                    collectedFees: db.transactions.filter(t => t.type === 'Fee' && t.status === 'Paid').reduce((acc, t) => acc + t.amount, 0),
                    pendingFees: db.invoices.filter(i => i.status === 'Pending').reduce((acc, i) => acc + i.amount_due, 0),
                    attendanceToday: 95
                };
                break;

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

            case 'getEmployeeDetails':
                const emp = db.staff.find(s => s.id === params.id);
                if (!emp) throw new Error("Employee not found");
                result = {
                    ...emp,
                    history: db.employee_history ? db.employee_history.filter(h => h.employee_id === params.id) : [],
                    salaries: db.salary_slips.filter(s => s.staffId === params.id)
                };
                break;

            case 'getAttendance':
                result = db.attendance.filter(a => a.date === params.date && a.entityType === params.type);
                break;

            case 'saveAttendance':
                const { records, user } = params;
                if (!records || records.length === 0) break;
                const newEntityIds = records.map(r => r.entityId);
                db.attendance = db.attendance.filter(a => !(a.date === records[0].date && a.entityType === records[0].entityType && newEntityIds.includes(a.entityId)));
                records.forEach(r => db.attendance.push({ ...r, id: generateUUID() }));
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
            
            case 'getAuditLogs':
                result = db.audit_logs;
                break;
                
            case 'manageCourse':
                if (params.type === 'add') {
                    db.courses.push({ ...params.data, id: generateUUID() });
                } else if (params.type === 'edit') {
                    const idx = db.courses.findIndex(c => c.id === params.data.id);
                    if(idx !== -1) db.courses[idx] = { ...db.courses[idx], ...params.data };
                } else if (params.type === 'delete') {
                    db.courses = db.courses.filter(c => c.id !== params.id);
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
                    const idx = db.users.findIndex(u => u.id === params.data.id);
                    if(idx !== -1) db.users[idx] = { ...db.users[idx], ...params.data };
                } else if (params.type === 'delete') {
                    db.users = db.users.filter(u => u.id !== params.id);
                }
                saveDB(db);
                break;

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
                
             case 'enrollStudentCourse':
                 db.student_courses.push({ id: generateUUID(), studentId: params.studentId, courseId: params.courseId, feeBasis: params.feeBasis, agreedFee: params.agreedFee });
                 saveDB(db);
                 break;
                 
             case 'removeStudentCourse':
                 db.student_courses = db.student_courses.filter(sc => sc.id !== params.id);
                 saveDB(db);
                 break;

             // Backup & Restore
             case 'exportDatabase':
                 result = db;
                 break;

             case 'importDatabase':
                 if (!params.data || !params.data.users) throw new Error("Invalid backup file structure");
                 db = params.data;
                 saveDB(db);
                 result = { success: true };
                 break;

             default:
                break;
        }
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
