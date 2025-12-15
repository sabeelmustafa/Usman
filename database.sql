SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Database: `schoolflow`
--

-- --------------------------------------------------------

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `linkedEntityId` varchar(50) DEFAULT NULL,
  `assignedClassIds` json DEFAULT NULL,
  `assignedSubjects` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Admin User (Password: admin)
INSERT INTO `users` (`id`, `username`, `password`, `role`, `name`, `linkedEntityId`, `assignedClassIds`, `assignedSubjects`) VALUES
('u1', 'admin', 'admin', 'Admin', 'System Administrator', NULL, '[]', '[]');

-- --------------------------------------------------------

CREATE TABLE `students` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `dob` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `admissionDate` date DEFAULT NULL,
  `joiningDate` date DEFAULT NULL,
  `parentDetails` json DEFAULT NULL COMMENT '{name, contact, address}',
  `profilePhotoBase64` longtext
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `staff` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT '0.00',
  `contact` varchar(50) DEFAULT NULL,
  `address` text,
  `cnic` varchar(50) DEFAULT NULL,
  `joiningDate` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `profilePhotoBase64` longtext,
  `assignedCourseIds` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `courses` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `defaultMonthlyFee` decimal(10,2) DEFAULT '0.00',
  `defaultDailyFee` decimal(10,2) DEFAULT '0.00',
  `capacity` int(11) DEFAULT '10'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `classes` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `subjects` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `student_courses` (
  `id` varchar(50) NOT NULL,
  `studentId` varchar(50) NOT NULL,
  `courseId` varchar(50) NOT NULL,
  `feeBasis` varchar(20) NOT NULL,
  `agreedFee` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `invoices` (
  `id` varchar(50) NOT NULL,
  `invoiceNo` varchar(50) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `student_name` varchar(100) NOT NULL,
  `month_year` varchar(20) NOT NULL,
  `due_date` date NOT NULL,
  `amount_due` decimal(10,2) NOT NULL,
  `status` varchar(20) DEFAULT 'Pending',
  `items` json NOT NULL,
  `payment_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `transactions` (
  `id` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `entityId` varchar(50) NOT NULL,
  `description` text,
  `status` varchar(20) DEFAULT 'Paid'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `attendance` (
  `id` varchar(50) NOT NULL,
  `entityId` varchar(50) NOT NULL,
  `entityType` varchar(20) NOT NULL,
  `date` date NOT NULL,
  `status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `salary_slips` (
  `id` varchar(50) NOT NULL,
  `staffId` varchar(50) NOT NULL,
  `monthYear` varchar(20) NOT NULL,
  `baseSalary` decimal(10,2) NOT NULL,
  `totalBonuses` decimal(10,2) DEFAULT '0.00',
  `totalDeductions` decimal(10,2) DEFAULT '0.00',
  `attendanceDeduction` decimal(10,2) DEFAULT '0.00',
  `netSalary` decimal(10,2) NOT NULL,
  `adjustmentIds` json DEFAULT NULL,
  `generationDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) DEFAULT 'Pending',
  `attendanceStats` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `salary_adjustments` (
  `id` varchar(50) NOT NULL,
  `staffId` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `date` date NOT NULL,
  `isApplied` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `student_adjustments` (
  `id` varchar(50) NOT NULL,
  `studentId` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `date` date NOT NULL,
  `isApplied` tinyint(1) DEFAULT '0',
  `invoiceId` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `exams` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `classId` varchar(50) NOT NULL,
  `schedule` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `exam_results` (
  `id` varchar(50) NOT NULL,
  `examId` varchar(50) NOT NULL,
  `studentId` varchar(50) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `marksObtained` decimal(5,2) NOT NULL,
  `totalMarks` decimal(5,2) NOT NULL,
  `grade` varchar(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `therapy_files` (
  `id` varchar(50) NOT NULL,
  `studentId` varchar(50) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `fileType` varchar(50) DEFAULT NULL,
  `uploadDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `fileBase64` longtext,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `employee_history` (
  `id` varchar(50) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `designation_from` varchar(100) DEFAULT NULL,
  `designation_to` varchar(100) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `reason` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `audit_logs` (
  `id` varchar(50) NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `userId` varchar(50) DEFAULT NULL,
  `userName` varchar(100) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `resource` varchar(100) DEFAULT NULL,
  `resourceId` varchar(50) DEFAULT NULL,
  `details` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `data` json NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Settings
INSERT INTO `settings` (`id`, `data`) VALUES
(1, '{\"name\": \"SchoolFlow\", \"address\": \"123 Education Lane\", \"contact_no\": \"+1 234 567 890\", \"email\": \"admin@school.com\", \"currency\": \"$\", \"lastInvoiceNo\": 1000}');

-- Indexes
ALTER TABLE `users` ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `username` (`username`);
ALTER TABLE `students` ADD PRIMARY KEY (`id`);
ALTER TABLE `staff` ADD PRIMARY KEY (`id`);
ALTER TABLE `courses` ADD PRIMARY KEY (`id`);
ALTER TABLE `classes` ADD PRIMARY KEY (`id`);
ALTER TABLE `student_courses` ADD PRIMARY KEY (`id`);
ALTER TABLE `invoices` ADD PRIMARY KEY (`id`);
ALTER TABLE `transactions` ADD PRIMARY KEY (`id`);
ALTER TABLE `attendance` ADD PRIMARY KEY (`id`);
ALTER TABLE `salary_slips` ADD PRIMARY KEY (`id`);
ALTER TABLE `salary_adjustments` ADD PRIMARY KEY (`id`);
ALTER TABLE `student_adjustments` ADD PRIMARY KEY (`id`);
ALTER TABLE `exams` ADD PRIMARY KEY (`id`);
ALTER TABLE `exam_results` ADD PRIMARY KEY (`id`);
ALTER TABLE `therapy_files` ADD PRIMARY KEY (`id`);
ALTER TABLE `employee_history` ADD PRIMARY KEY (`id`);
ALTER TABLE `audit_logs` ADD PRIMARY KEY (`id`);
ALTER TABLE `settings` ADD PRIMARY KEY (`id`);
COMMIT;