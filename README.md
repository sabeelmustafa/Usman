# SchoolFlow - School Management System

SchoolFlow is a comprehensive, web-based platform designed to streamline administrative tasks for educational institutions. It handles the entire lifecycle of school management, from student enrollment and fee collection to staff payroll and exam scheduling.

## 🚀 Key Features

### 1. **Offline-First Architecture**
*   **No Server Required:** The application runs entirely in your browser using LocalStorage.
*   **Instant Access:** No database setup or installation required.
*   **Data Persistence:** Data is saved to your device automatically.

### 2. **Interactive Dashboard**
*   **Real-time Stats:** Overview of total students, staff, and financial metrics.
*   **Financial Charts:** Visual bar charts comparing collected vs. pending fees.
*   **Recent Activity:** Quick view of the latest fee transactions.

### 3. **Student Management**
*   **Directory:** Searchable list of all students with filters for Active/Inactive status.
*   **Registration:** Full intake form including parent details, contact info, and custom fee overrides.
*   **Student Profiles:** Detailed view of a student's personal info, academic history, and financial ledger.

### 4. **Fees & Finance**
*   **Automated Challan Generation:** Bulk generate monthly fee challans for specific classes or the entire school.
*   **Fee Structure:** Manage tuition fees per class level.
*   **Payment Tracking:** Mark fees as Paid/Pending and view transaction history.
*   **Printing:** Bulk print fee challans for distribution.

### 5. **Staff & HR (Payroll)**
*   **Employee Directory:** Manage teachers, admins, and support staff.
*   **Payroll Processing:** Generate salary slips based on base salary + bonuses - deductions.
*   **Transaction Recording:** Log advances, bonuses, or fines before the pay period ends.
*   **Promotion History:** Track career progression and designation changes.

### 6. **Academics & Exams**
*   **Class Management:** Define classes, capacities, and assign subjects from a global library.
*   **Exam Scheduler:** Create exam timetables for specific classes.
*   **Result Management:** Record marks for students; the system automatically calculates grades (A+, A, B, etc.) and Pass/Fail status.
*   **Report Cards:** Generate printable result cards.

### 7. **Admin Settings**
*   **School Configuration:** Update school name, address, currency symbol, and logo.
*   **Data Management:** Backup (Export) and Restore (Import) your entire database as a JSON file.

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
│   ├── Dashboard.tsx       # Homepage with charts and stats.
│   ├── Students.tsx        # Student list, search, and registration modal.
│   ├── StudentProfile.tsx  # Individual student details, fee history, and results.
│   ├── Fees.tsx            # Fee generation, payment logging, and fee structure.
│   ├── Staff.tsx           # Employee list, payroll generation, and transactions.
│   ├── EmployeeProfile.tsx # Staff details, career history, and salary slips.
│   ├── Classes.tsx         # Class creation and Subject Library management.
│   ├── Academics.tsx       # Exam scheduling and marks entry.
│   ├── Settings.tsx        # School settings (Logo, Address) and Data Backup/Restore.
│   ├── Login.tsx           # Authentication screen.
│   └── PrintView.tsx       # Specialized component for rendering printable documents.
│
└── services/
    ├── apiService.ts       # Handles data operations. Configured for LocalStorage (Offline Mode).
    └── geminiService.ts    # Placeholder for future AI integration.
```

---

## 🛠️ Technology Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **Routing:** React Router DOM
*   **Icons:** Lucide React
*   **Data Persistence:** LocalStorage (Browser)

---

## 🔑 Setup & Usage

### 1. Running the App
The application requires no backend installation.

1.  Open the application in your browser.
2.  Login with the default credentials:
    *   **Username:** `admin`
    *   **Password:** `admin`

### 2. Data Management
Since data is stored in your browser:
*   **Backup:** Go to *Settings > Data Management* and click "Download Backup File" regularly.
*   **Restore:** If you switch devices or clear your cache, upload your backup file in the same menu to restore your data.

## 📝 Usage Workflows

*   **Register a Student:** Go to *Students* > *Add Student*.
*   **Collect Fees:** Go to *Fees*. Click *Generate New Challans* for the current month. Then, click *Mark Paid* on specific challans or print them.
*   **Pay Staff:** Go to *Staff*. Add *Transactions* (Bonuses/Advances) if needed. Then select a month and click *Generate All* to create salary slips.
*   **Schedule Exam:** Go to *Academics* > *Exam Scheduler*. Create an exam for a class.
*   **Enter Marks:** Go to *Academics* > *Results Entry*. Select the Exam and Student, then input marks.