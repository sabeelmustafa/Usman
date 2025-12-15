import { 
  User, Student, Staff, Course, Invoice, FinancialTransaction, 
  AttendanceRecord, AuditLogEntry, SchoolSettings, ClassLevel, Exam, 
  SalarySlip, SalaryAdjustment, StudentCourse, TherapyRecordFile, Employee,
  EmployeeHistory, StudentFeeAdjustment
} from '../types';

// --- CONFIGURATION ---
const getApiUrl = () => {
    // Use relative path for both Dev (via Vite Proxy) and Prod (Same Origin)
    return '/api/rpc';
};

const API_URL = getApiUrl();

// Set to FALSE to use the Server Backend
const USE_MOCK = false; 

// --- REAL SERVER REQUEST HANDLER ---
async function requestHandler<T>(action: string, params: any = {}): Promise<T> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Add auth token here if you implement JWT later
      },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMsg = `Server Error: ${response.status}`;
      try {
        const json = JSON.parse(text);
        if(json.error) errorMsg = json.error;
      } catch(e) {
        // Fallback for non-JSON errors (e.g., 404 HTML page)
        if (response.status === 404) {
           errorMsg = "API Endpoint not found. Ensure backend server is running.";
        } else if (response.status === 502 || response.status === 504) {
           errorMsg = "Backend Gateway Error. Is the server running?";
        }
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    let msg = error.message;
    // Check for network connection errors (ECONNREFUSED in browser looks like Failed to fetch)
    if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        msg = "Cannot connect to server. Please ensure 'npm run dev' started the backend (port 3001).";
    }
    console.error(`API Request Failed [${action}]:`, msg);
    throw new Error(msg);
  }
}

// --- EXPORT ---

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
  saveAttendance: (records: AttendanceRecord[], user: User) => requestHandler<void>('saveAttendance', { records, user }),

  // Data
  exportDatabase: () => requestHandler<any>('exportDatabase'),
  importDatabase: (data: any) => requestHandler<void>('importDatabase', { data }),
};