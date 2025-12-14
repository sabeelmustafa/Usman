
export type Role = 'Admin' | 'Accountant' | 'Teacher' | 'Staff';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: Role;
  name: string;
  linkedEntityId?: string;
  assignedClassIds?: string[];
  assignedSubjects?: string[];
}

// --- Core Entity Interfaces ---

export interface Student {
  id: string;
  name: string;
  classId?: string; // Optional linking to academic class
  dob: string;
  status: 'Active' | 'Inactive';
  parentDetails: { name: string; contact: string; address: string };
  profilePhotoBase64: string | null;
  admissionDate: string;
  joiningDate: string; // Added per requirement
}

export interface Course {
  id: string;
  name: string; // e.g., "Speech Therapy", "Occupational Therapy"
  defaultMonthlyFee: number;
  defaultDailyFee: number; // For daily basis calculation
  capacity: number;
}

export interface StudentCourse {
  id: string;
  studentId: string;
  courseId: string;
  feeBasis: 'Monthly' | 'Daily';
  agreedFee: number; // The fee charged per month OR per day
}

export interface TherapyRecordFile {
  id: string;
  studentId: string;
  fileName: string;
  fileType: string; // 'application/pdf', 'image/jpeg', etc.
  uploadDate: string;
  fileBase64: string;
  description?: string;
}

export interface Staff {
  id: string;
  name: string;
  designation: string;
  salary: number;
  contact: string;
  address?: string; // Added Address field
  cnic?: string; // Added CNIC field
  joiningDate: string;
  status: 'Active' | 'Inactive';
  profilePhotoBase64: string | null; 
  assignedCourseIds?: string[]; // New: Links staff to specific therapies
}

export type Employee = Staff; // Alias for EmployeeProfile usage

export interface ClassLevel {
  id: string;
  name: string;
  subjects: string[];
}

export interface Exam {
  id: string;
  name: string;
  classId: string;
  schedule: { subject: string; date: string }[];
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'Fee' | 'Salary' | 'Bonus' | 'Fine' | 'Advance' | 'Other';
  amount: number;
  date: string;
  entityId: string;
  description?: string;
  status: 'Pending' | 'Paid' | 'Processed';
}

export interface AttendanceRecord {
  id: string;
  entityId: string;
  entityType: 'Student' | 'Staff';
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'PaidLeave' | 'UnpaidLeave';
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  resource: string;
  resourceId: string;
  details?: string;
}

export interface SchoolSettings {
  name: string;
  address: string;
  contact_no: string;
  email: string;
  logo_url?: string;
  currency: string;
  // Bank Details
  bankName?: string;
  bankAccountTitle?: string;
  bankAccountNumber?: string;
  bankIban?: string;
  lastInvoiceNo?: number; // For auto-increment
}

// Dashboard Helper Interface
export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  collectedFees: number;
  pendingFees: number;
  attendanceToday: number;
}

// --- Fee & Invoice Interfaces ---

export enum InvoiceStatus {
  PAID = 'Paid',
  PENDING = 'Pending'
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string; // INV-001
  student_id: string;
  student_name: string;
  month_year: string;
  amount_due: number;
  items: InvoiceItem[];
  status: InvoiceStatus;
  due_date: string;
  payment_date?: string;
}

export interface StudentFeeAdjustment {
  id: string;
  studentId: string;
  type: 'Fine' | 'Other';
  amount: number;
  description: string;
  date: string;
  isApplied: boolean;
  invoiceId?: string;
}

export interface EmployeeHistory {
  id: string;
  employee_id: string;
  designation: string;
  designation_from: string;
  designation_to: string;
  date: string;
  reason: string;
}

// --- Payroll Interfaces ---

export interface SalaryAdjustment {
  id: string;
  staffId: string;
  type: 'Advance' | 'Bonus' | 'Fine' | 'Deduction';
  amount: number;
  date: number;
  description: string;
  isApplied: boolean;
  appliedMonthYear: string | null;
}

export interface SalarySlip {
  id: string;
  staffId: string;
  monthYear: string;
  baseSalary: number;
  totalBonuses: number;
  totalDeductions: number;
  netSalary: number;
  adjustmentIds: string[];
  generationDate: number;
  status: 'Pending' | 'Paid';
}
