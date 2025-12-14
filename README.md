# SchoolFlow - School Management System

SchoolFlow is a comprehensive, web-based platform designed to streamline administrative tasks for educational institutions. It handles the entire lifecycle of school management, from student enrollment and fee collection to staff payroll and exam scheduling.

## 🚀 Key Features

### 1. **Interactive Dashboard**
*   **Real-time Stats:** Overview of total students, staff, and financial metrics.
*   **Financial Charts:** Visual bar charts comparing collected vs. pending fees.
*   **AI Insights:** Integration with Google Gemini (`gemini-2.5-flash`) to generate executive financial summaries and actionable recommendations.
*   **Recent Activity:** Quick view of the latest fee transactions.

### 2. **Student Management**
*   **Directory:** Searchable list of all students with filters for Active/Inactive status.
*   **Registration:** Full intake form including parent details, contact info, and custom fee overrides.
*   **Student Profiles:** Detailed view of a student's personal info, academic history, and financial ledger.

### 3. **Fees & Finance**
*   **Automated Challan Generation:** Bulk generate monthly fee challans for specific classes or the entire school.
*   **Fee Structure:** Manage tuition fees per class level.
*   **Payment Tracking:** Mark fees as Paid/Pending and view transaction history.
*   **Printing:** Bulk print fee challans for distribution.

### 4. **Staff & HR (Payroll)**
*   **Employee Directory:** Manage teachers, admins, and support staff.
*   **Payroll Processing:** Generate salary slips based on base salary + bonuses - deductions.
*   **Transaction Recording:** Log advances, bonuses, or fines before the pay period ends.
*   **Promotion History:** Track career progression and designation changes.

### 5. **Academics & Exams**
*   **Class Management:** Define classes, capacities, and assign subjects from a global library.
*   **Exam Scheduler:** Create exam timetables for specific classes.
*   **Result Management:** Record marks for students; the system automatically calculates grades (A+, A, B, etc.) and Pass/Fail status.
*   **Report Cards:** Generate printable result cards.

### 6. **Admin Settings**
*   **School Configuration:** Update school name, address, currency symbol, and logo.
*   **Profile Management:** Update admin credentials.

### 7. **Print System**
*   Dedicated print views for **Fee Challans**, **Salary Slips**, **Exam Schedules**, and **Student Result Cards**.
*   Supports both individual and batch printing.

---

## 📂 Project Structure & File Description

```text
/
├── index.html              # Entry point. Imports Tailwind, Fonts, and React via ESM.
├── index.tsx               # React application entry, mounts App to DOM.
├── App.tsx                 # Main routing logic and Global AuthContext provider.
├── types.ts                # TypeScript interfaces for all data models (User, Student, etc.).
├── metadata.json           # Project metadata.
├── README.md               # Project documentation (this file).
│
├── components/             # UI Components
│   ├── Layout.tsx          # Sidebar navigation and responsive layout wrapper.
│   ├── Dashboard.tsx       # Homepage with charts and AI summary.
│   ├── Students.tsx        # Student list, search, and registration modal.
│   ├── StudentProfile.tsx  # Individual student details, fee history, and results.
│   ├── Fees.tsx            # Fee generation, payment logging, and fee structure.
│   ├── Staff.tsx           # Employee list, payroll generation, and transactions.
│   ├── EmployeeProfile.tsx # Staff details, career history, and salary slips.
│   ├── Classes.tsx         # Class creation and Subject Library management.
│   ├── Academics.tsx       # Exam scheduling and marks entry.
│   ├── Settings.tsx        # School settings (Logo, Address) and Admin profile.
│   ├── Login.tsx           # Authentication screen.
│   └── PrintView.tsx       # Specialized component for rendering printable documents.
│
└── services/
    ├── apiService.ts       # Handles data operations. Currently uses LocalStorage to mock a backend.
    └── geminiService.ts    # Interface for Google Gemini API (AI features).
```

---

## 🛠️ Technology Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **Routing:** React Router DOM
*   **Icons:** Lucide React
*   **Charts:** Recharts
*   **AI:** Google GenAI SDK (`@google/genai`)
*   **Data Persistence:** LocalStorage (Mock Mode)

---

## 🔑 Setup & Usage

### 1. Mock Data & Authentication
The application is currently configured to run in **Mock Mode** (`USE_MOCK = true` in `apiService.ts`). It simulates a backend using your browser's LocalStorage.

*   **Default Login:**
    *   **Username:** `admin`
    *   **Password:** `admin`

### 2. AI Configuration (Optional)
To use the AI Assistant features (Dashboard Summary, Notice Drafting), you must provide a Google Gemini API Key.
*   The app looks for `process.env.API_KEY` or falls back to a graceful error if missing.
*   Models used: `gemini-2.5-flash`.

### 3. Running the App
Since this project uses ES Modules via CDN (defined in `index.html`), no complex build step is strictly required for previewing. However, in a development environment:

1.  Ensure all files are in the root directory as specified in the structure.
2.  Serve the directory using a simple static server (e.g., `npx serve`, `python -m http.server`, or VS Code Live Server).

## 📝 Usage Workflows

*   **Register a Student:** Go to *Students* > *Add Student*.
*   **Collect Fees:** Go to *Fees*. Click *Generate New Challans* for the current month. Then, click *Mark Paid* on specific challans or print them.
*   **Pay Staff:** Go to *Staff*. Add *Transactions* (Bonuses/Advances) if needed. Then select a month and click *Generate All* to create salary slips.
*   **Schedule Exam:** Go to *Academics* > *Exam Scheduler*. Create an exam for a class.
*   **Enter Marks:** Go to *Academics* > *Results Entry*. Select the Exam and Student, then input marks.
