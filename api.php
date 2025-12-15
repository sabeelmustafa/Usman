<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- Database Connection ---
$host = 'localhost';
$db   = 'schoolflow';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database Connection Failed: " . $e->getMessage()]);
    exit;
}

// --- Helpers ---
function uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// --- Request Parsing ---
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$params = $input['params'] ?? [];

$response = [];

try {
    switch ($action) {
        case 'login':
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
            $stmt->execute([$params['username'], $params['password']]);
            $user = $stmt->fetch();
            if ($user) {
                // Decode JSON fields
                $user['assignedClassIds'] = json_decode($user['assignedClassIds'] ?? '[]');
                $user['assignedSubjects'] = json_decode($user['assignedSubjects'] ?? '[]');
                $response = $user;
            } else {
                throw new Exception("Invalid credentials");
            }
            break;

        case 'getAllUsers':
            $stmt = $pdo->query("SELECT * FROM users");
            $users = $stmt->fetchAll();
            foreach($users as &$u) {
                $u['assignedClassIds'] = json_decode($u['assignedClassIds']);
                $u['assignedSubjects'] = json_decode($u['assignedSubjects']);
            }
            $response = $users;
            break;

        case 'manageUser':
            if ($params['type'] === 'add') {
                $id = uuid();
                $stmt = $pdo->prepare("INSERT INTO users (id, username, password, role, name, assignedClassIds, assignedSubjects) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id,
                    $params['data']['username'],
                    $params['data']['password'],
                    $params['data']['role'],
                    $params['data']['name'],
                    json_encode($params['data']['assignedClassIds'] ?? []),
                    json_encode($params['data']['assignedSubjects'] ?? [])
                ]);
            } elseif ($params['type'] === 'edit') {
                if (!empty($params['data']['password'])) {
                    $stmt = $pdo->prepare("UPDATE users SET username=?, password=?, role=?, name=?, assignedClassIds=?, assignedSubjects=? WHERE id=?");
                    $stmt->execute([
                        $params['data']['username'],
                        $params['data']['password'],
                        $params['data']['role'],
                        $params['data']['name'],
                        json_encode($params['data']['assignedClassIds']),
                        json_encode($params['data']['assignedSubjects']),
                        $params['data']['id']
                    ]);
                } else {
                    $stmt = $pdo->prepare("UPDATE users SET username=?, role=?, name=?, assignedClassIds=?, assignedSubjects=? WHERE id=?");
                    $stmt->execute([
                        $params['data']['username'],
                        $params['data']['role'],
                        $params['data']['name'],
                        json_encode($params['data']['assignedClassIds']),
                        json_encode($params['data']['assignedSubjects']),
                        $params['data']['id']
                    ]);
                }
            } elseif ($params['type'] === 'delete') {
                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$params['id']]);
            }
            $response = ["success" => true];
            break;

        case 'getSchoolSettings':
            $stmt = $pdo->query("SELECT data FROM settings WHERE id = 1");
            $row = $stmt->fetch();
            $response = $row ? json_decode($row['data'], true) : [];
            break;

        case 'updateSchoolSettings':
            $stmt = $pdo->prepare("UPDATE settings SET data = ? WHERE id = 1");
            $stmt->execute([json_encode($params)]);
            $response = ["success" => true];
            break;

        // --- Students ---
        case 'getAllStudents':
            $stmt = $pdo->query("SELECT * FROM students");
            $students = $stmt->fetchAll();
            foreach($students as &$s) {
                $s['parentDetails'] = json_decode($s['parentDetails']);
            }
            $response = $students;
            break;

        case 'saveStudent':
            $s = $params['student'];
            $parentDetails = json_encode($s['parentDetails']);
            
            if (!empty($s['id'])) {
                // Update
                $sql = "UPDATE students SET name=?, dob=?, status=?, admissionDate=?, joiningDate=?, parentDetails=?, profilePhotoBase64=? WHERE id=?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$s['name'], $s['dob'], $s['status'], $s['admissionDate'], $s['joiningDate'], $parentDetails, $s['profilePhotoBase64'], $s['id']]);
                $response = $s; 
            } else {
                // Insert
                $id = uuid();
                $sql = "INSERT INTO students (id, name, dob, status, admissionDate, joiningDate, parentDetails, profilePhotoBase64) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id, $s['name'], $s['dob'], $s['status'], $s['admissionDate'], $s['joiningDate'], $parentDetails, $s['profilePhotoBase64']]);
                $s['id'] = $id;
                
                // Handle initial courses
                if (!empty($params['student']['initialCourses'])) {
                    foreach ($params['student']['initialCourses'] as $ic) {
                        $cid = uuid();
                        $cstmt = $pdo->prepare("INSERT INTO student_courses (id, studentId, courseId, feeBasis, agreedFee) VALUES (?, ?, ?, ?, ?)");
                        $cstmt->execute([$cid, $id, $ic['courseId'], $ic['feeBasis'], $ic['agreedFee']]);
                    }
                }
                $response = $s;
            }
            break;

        case 'getStudentDetails':
            $id = $params['id'];
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$id]);
            $student = $stmt->fetch();
            if (!$student) throw new Exception("Student not found");
            $student['parentDetails'] = json_decode($student['parentDetails']);
            
            // Parent info flat mapping
            $student['parent_name'] = $student['parentDetails']->name ?? '';
            $student['contact_no'] = $student['parentDetails']->contact ?? '';
            $student['address'] = $student['parentDetails']->address ?? '';
            
            // Invoices
            $stmtInv = $pdo->prepare("SELECT * FROM invoices WHERE student_id = ? ORDER BY due_date DESC");
            $stmtInv->execute([$id]);
            $invoices = $stmtInv->fetchAll();
            foreach($invoices as &$inv) $inv['items'] = json_decode($inv['items']);
            $student['invoices'] = $invoices;

            // Pending Adjustments
            $stmtAdj = $pdo->prepare("SELECT * FROM student_adjustments WHERE studentId = ? AND isApplied = 0");
            $stmtAdj->execute([$id]);
            $student['pending_adjustments'] = $stmtAdj->fetchAll();

            // Courses
            $stmtCrs = $pdo->prepare("
                SELECT sc.*, c.name as courseName 
                FROM student_courses sc 
                JOIN courses c ON sc.courseId = c.id 
                WHERE sc.studentId = ?
            ");
            $stmtCrs->execute([$id]);
            $student['courses'] = $stmtCrs->fetchAll();

            // Files
            $stmtFiles = $pdo->prepare("SELECT * FROM therapy_files WHERE studentId = ? ORDER BY uploadDate DESC");
            $stmtFiles->execute([$id]);
            $student['files'] = $stmtFiles->fetchAll();

            $response = $student;
            break;

        // --- Staff ---
        case 'getAllStaff':
            $stmt = $pdo->query("SELECT * FROM staff");
            $staff = $stmt->fetchAll();
            foreach($staff as &$s) {
                 $s['assignedCourseIds'] = json_decode($s['assignedCourseIds'] ?? '[]');
            }
            $response = $staff;
            break;

        case 'saveStaff':
            $s = $params['staff'];
            $assignedCourses = json_encode($s['assignedCourseIds'] ?? []);
            
            if (!empty($s['id'])) {
                $sql = "UPDATE staff SET name=?, designation=?, salary=?, contact=?, address=?, cnic=?, status=?, profilePhotoBase64=?, assignedCourseIds=? WHERE id=?";
                $vals = [$s['name'], $s['designation'], $s['salary'], $s['contact'], $s['address'], $s['cnic'], $s['status'], $s['profilePhotoBase64'], $assignedCourses, $s['id']];
                $stmt = $pdo->prepare($sql);
                $stmt->execute($vals);
            } else {
                $id = uuid();
                $sql = "INSERT INTO staff (id, name, designation, salary, contact, address, cnic, joiningDate, status, profilePhotoBase64, assignedCourseIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id, $s['name'], $s['designation'], $s['salary'], $s['contact'], $s['address'], $s['cnic'], $s['joiningDate'], $s['status'], $s['profilePhotoBase64'], $assignedCourses]);
            }
            $response = ["success" => true];
            break;

        // --- Courses ---
        case 'getAllCourses':
            $stmt = $pdo->query("SELECT * FROM courses");
            $response = $stmt->fetchAll();
            break;
            
        case 'manageCourse':
            if ($params['type'] === 'add') {
                $id = uuid();
                $d = $params['data'];
                $stmt = $pdo->prepare("INSERT INTO courses (id, name, capacity, defaultMonthlyFee, defaultDailyFee) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$id, $d['name'], $d['capacity'], $d['defaultMonthlyFee'], $d['defaultDailyFee']]);
            } elseif ($params['type'] === 'edit') {
                $d = $params['data'];
                $stmt = $pdo->prepare("UPDATE courses SET name=?, capacity=?, defaultMonthlyFee=?, defaultDailyFee=? WHERE id=?");
                $stmt->execute([$d['name'], $d['capacity'], $d['defaultMonthlyFee'], $d['defaultDailyFee'], $d['id']]);
            } elseif ($params['type'] === 'delete') {
                $stmt = $pdo->prepare("DELETE FROM courses WHERE id=?");
                $stmt->execute([$params['id']]);
            }
            $response = ["success" => true];
            break;

        // --- Invoices ---
        case 'getAllInvoices':
            $stmt = $pdo->query("SELECT * FROM invoices ORDER BY due_date DESC");
            $invs = $stmt->fetchAll();
            foreach($invs as &$i) $i['items'] = json_decode($i['items']);
            $response = $invs;
            break;
            
        case 'getInvoiceDetails':
            $stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
            $stmt->execute([$params['id']]);
            $invoice = $stmt->fetch();
            if($invoice) {
                $invoice['items'] = json_decode($invoice['items']);
                // Get student for preview
                $stmtS = $pdo->prepare("SELECT * FROM students WHERE id = ?");
                $stmtS->execute([$invoice['student_id']]);
                $std = $stmtS->fetch();
                $std['parentDetails'] = json_decode($std['parentDetails']);
                $response = ['invoice' => $invoice, 'student' => $std];
            }
            break;

        case 'generateInvoice':
            $month_year = $params['month_year'];
            $studentId = $params['studentId'] ?? null;
            
            // Get Settings for Invoice No
            $stmtSet = $pdo->query("SELECT data FROM settings WHERE id=1");
            $settings = json_decode($stmtSet->fetch()['data'], true);
            $lastInvNo = $settings['lastInvoiceNo'];
            
            // Determine Students
            if ($studentId) {
                $stmtStd = $pdo->prepare("SELECT * FROM students WHERE id = ?");
                $stmtStd->execute([$studentId]);
            } else {
                $stmtStd = $pdo->query("SELECT * FROM students WHERE status = 'Active'");
            }
            $students = $stmtStd->fetchAll();
            
            $generatedCount = 0;
            
            foreach($students as $s) {
                // Check if tuition invoice already exists
                $stmtCheck = $pdo->prepare("SELECT * FROM invoices WHERE student_id = ? AND month_year = ?");
                $stmtCheck->execute([$s['id'], $month_year]);
                $existing = $stmtCheck->fetchAll();
                $hasTuition = false;
                foreach($existing as $ex) {
                    $items = json_decode($ex['items'], true);
                    foreach($items as $it) {
                        if (strpos($it['description'], 'Tuition') === 0 || strpos($it['description'], 'Therapy') !== false) {
                            $hasTuition = true; break;
                        }
                    }
                }
                
                $items = [];
                
                // Add Tuition if not exists
                if (!$hasTuition) {
                    // Monthly
                    $stmtCrs = $pdo->prepare("SELECT sc.*, c.name FROM student_courses sc JOIN courses c ON sc.courseId = c.id WHERE sc.studentId = ? AND sc.feeBasis = 'Monthly'");
                    $stmtCrs->execute([$s['id']]);
                    $monthly = $stmtCrs->fetchAll();
                    foreach($monthly as $m) {
                        $items[] = ['description' => $m['name'], 'amount' => (float)$m['agreedFee']];
                    }
                    
                    // Daily (Calculate from Attendance)
                    $stmtDaily = $pdo->prepare("SELECT sc.*, c.name FROM student_courses sc JOIN courses c ON sc.courseId = c.id WHERE sc.studentId = ? AND sc.feeBasis = 'Daily'");
                    $stmtDaily->execute([$s['id']]);
                    $daily = $stmtDaily->fetchAll();
                    if (count($daily) > 0) {
                        // Count present days in that month
                        $likeDate = $month_year . '%';
                        $stmtAtt = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE entityId = ? AND entityType = 'Student' AND date LIKE ? AND (status='Present' OR status='Late')");
                        $stmtAtt->execute([$s['id'], $likeDate]);
                        $days = $stmtAtt->fetchColumn();
                        if ($days > 0) {
                            foreach($daily as $d) {
                                $total = (float)$d['agreedFee'] * $days;
                                $items[] = ['description' => $d['name'] . " ($days days)", 'amount' => $total];
                            }
                        }
                    }
                }
                
                // Add Pending Adjustments
                $stmtAdj = $pdo->prepare("SELECT * FROM student_adjustments WHERE studentId = ? AND isApplied = 0");
                $stmtAdj->execute([$s['id']]);
                $adjs = $stmtAdj->fetchAll();
                
                foreach($adjs as $a) {
                    $items[] = ['description' => $a['type'] . ": " . $a['description'], 'amount' => (float)$a['amount']];
                }
                
                if (count($items) > 0) {
                    $total = array_reduce($items, function($sum, $item) { return $sum + $item['amount']; }, 0);
                    $newInvId = uuid();
                    $lastInvNo++;
                    $invNo = "INV-" . $lastInvNo;
                    $dueDate = date('Y-m-d', strtotime('+10 days'));
                    
                    $stmtIns = $pdo->prepare("INSERT INTO invoices (id, invoiceNo, student_id, student_name, month_year, due_date, status, items, amount_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmtIns->execute([$newInvId, $invNo, $s['id'], $s['name'], $month_year, $dueDate, 'Pending', json_encode($items), $total]);
                    
                    // Mark adjustments as applied
                    foreach($adjs as $a) {
                        $stmtUpd = $pdo->prepare("UPDATE student_adjustments SET isApplied=1, invoiceId=? WHERE id=?");
                        $stmtUpd->execute([$newInvId, $a['id']]);
                    }
                    $generatedCount++;
                }
            }
            
            // Update Invoice No Setting
            $settings['lastInvoiceNo'] = $lastInvNo;
            $stmtSetUpd = $pdo->prepare("UPDATE settings SET data = ? WHERE id = 1");
            $stmtSetUpd->execute([json_encode($settings)]);
            
            $response = ["generated" => $generatedCount];
            break;

        case 'markInvoicePaid':
            $stmt = $pdo->prepare("UPDATE invoices SET status = 'Paid', payment_date = CURDATE() WHERE id = ?");
            $stmt->execute([$params['id']]);
            
            // Record Transaction
            $stmtInv = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
            $stmtInv->execute([$params['id']]);
            $inv = $stmtInv->fetch();
            
            $tid = uuid();
            $stmtTxn = $pdo->prepare("INSERT INTO transactions (id, type, amount, date, entityId, description, status) VALUES (?, 'Fee', ?, CURDATE(), ?, ?, 'Paid')");
            $stmtTxn->execute([$tid, $inv['amount_due'], $inv['student_id'], "Invoice Payment: " . $inv['invoiceNo']]);
            
            $response = ["success" => true];
            break;

        // --- Payroll ---
        case 'getSlipsByMonth':
            $stmt = $pdo->prepare("
                SELECT ss.*, s.name as staff_name, s.designation as staff_designation 
                FROM salary_slips ss 
                JOIN staff s ON ss.staffId = s.id 
                WHERE ss.monthYear = ?
            ");
            $stmt->execute([$params['monthYear']]);
            $response = $stmt->fetchAll();
            break;
            
        case 'getSlipById':
            $stmt = $pdo->prepare("SELECT * FROM salary_slips WHERE id = ?");
            $stmt->execute([$params['id']]);
            $slip = $stmt->fetch();
            if ($slip) {
                // Fetch adjustment details
                $adjIds = json_decode($slip['adjustmentIds'], true) ?? [];
                if (count($adjIds) > 0) {
                    $inQuery = implode(',', array_fill(0, count($adjIds), '?'));
                    $stmtAdj = $pdo->prepare("SELECT * FROM salary_adjustments WHERE id IN ($inQuery)");
                    $stmtAdj->execute($adjIds);
                    $slip['adjustments'] = $stmtAdj->fetchAll();
                } else {
                    $slip['adjustments'] = [];
                }
                $slip['attendanceStats'] = json_decode($slip['attendanceStats']);
                $response = $slip;
            }
            break;

        case 'generatePayroll':
            $monthYear = $params['monthYear'];
            $staffIds = $params['staffIds'] ?? []; // Optional filter
            
            if (empty($staffIds)) {
                $stmtStf = $pdo->query("SELECT * FROM staff WHERE status='Active'");
                $staffList = $stmtStf->fetchAll();
            } else {
                $inQuery = implode(',', array_fill(0, count($staffIds), '?'));
                $stmtStf = $pdo->prepare("SELECT * FROM staff WHERE id IN ($inQuery)");
                $stmtStf->execute($staffIds);
                $staffList = $stmtStf->fetchAll();
            }
            
            $count = 0;
            foreach($staffList as $s) {
                // Delete existing slip for this month
                $pdo->prepare("DELETE FROM salary_slips WHERE staffId=? AND monthYear=? AND status='Pending'")->execute([$s['id'], $monthYear]);
                
                // 1. Base
                $base = (float)$s['salary'];
                
                // 2. Attendance Stats
                $likeDate = $monthYear . '%';
                $stmtAtt = $pdo->prepare("SELECT status, COUNT(*) as cnt FROM attendance WHERE entityId=? AND entityType='Staff' AND date LIKE ? GROUP BY status");
                $stmtAtt->execute([$s['id'], $likeDate]);
                $stats = $stmtAtt->fetchAll(PDO::FETCH_KEY_PAIR); // ['Present' => 5, 'Absent' => 1]
                
                $present = $stats['Present'] ?? 0;
                $late = $stats['Late'] ?? 0;
                $absent = $stats['UnpaidLeave'] ?? 0; // Assuming 'UnpaidLeave' maps to Absent/Unpaid
                $paidLeave = $stats['PaidLeave'] ?? 0;
                $totalDays = $present + $late + $absent + $paidLeave;
                
                $attStats = json_encode(['totalDays'=>$totalDays, 'present'=>$present, 'late'=>$late, 'absent'=>$absent, 'paidLeave'=>$paidLeave]);
                
                // 3. Attendance Deduction
                $perDay = $base / 30; // Standard 30 day month calculation
                $attDed = round($perDay * $absent, 2);
                
                // 4. Adjustments
                $stmtAdj = $pdo->prepare("SELECT * FROM salary_adjustments WHERE staffId=? AND isApplied=0 AND date <= LAST_DAY(CONCAT(?, '-01'))");
                $stmtAdj->execute([$s['id'], $monthYear]);
                $adjs = $stmtAdj->fetchAll();
                
                $bonus = 0;
                $deduct = 0;
                $adjIds = [];
                
                foreach($adjs as $a) {
                    if ($a['type'] == 'Bonus') $bonus += $a['amount'];
                    else $deduct += $a['amount'];
                    $adjIds[] = $a['id'];
                }
                
                $totalDed = $deduct + $attDed;
                $net = $base + $bonus - $totalDed;
                
                // Insert Slip
                $sid = uuid();
                $stmtIns = $pdo->prepare("INSERT INTO salary_slips (id, staffId, monthYear, baseSalary, totalBonuses, totalDeductions, attendanceDeduction, netSalary, adjustmentIds, status, attendanceStats) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)");
                $stmtIns->execute([$sid, $s['id'], $monthYear, $base, $bonus, $deduct, $attDed, $net, json_encode($adjIds), $attStats]);
                
                // Mark adjustments applied
                if (!empty($adjIds)) {
                     $inQ = implode(',', array_fill(0, count($adjIds), '?'));
                     $pdo->prepare("UPDATE salary_adjustments SET isApplied=1 WHERE id IN ($inQ)")->execute($adjIds);
                }
                $count++;
            }
            $response = ["generatedCount" => $count];
            break;

        case 'addAdjustment':
            $id = uuid();
            $stmt = $pdo->prepare("INSERT INTO salary_adjustments (id, staffId, type, amount, description, date, isApplied) VALUES (?, ?, ?, ?, ?, ?, 0)");
            $stmt->execute([$id, $params['staffId'], $params['type'], $params['amount'], $params['description'], $params['date']]);
            $response = ["success" => true];
            break;
            
        case 'deleteAdjustment':
            $stmt = $pdo->prepare("DELETE FROM salary_adjustments WHERE id=?");
            $stmt->execute([$params['id']]);
            $response = ["success" => true];
            break;
            
        case 'paySalarySlip':
             $stmt = $pdo->prepare("UPDATE salary_slips SET status='Paid' WHERE id=?");
             $stmt->execute([$params['id']]);
             // Add Expense Transaction
             $stmtGet = $pdo->prepare("SELECT * FROM salary_slips WHERE id=?");
             $stmtGet->execute([$params['id']]);
             $slip = $stmtGet->fetch();
             
             $tid = uuid();
             $desc = "Salary Payment: " . $slip['monthYear'];
             $pdo->prepare("INSERT INTO transactions (id, type, amount, date, entityId, description, status) VALUES (?, 'Salary', ?, CURDATE(), ?, ?, 'Paid')")->execute([$tid, $slip['netSalary'], $slip['staffId'], $desc]);
             $response = ["success" => true];
             break;

        // --- Academics ---
        case 'getAllClasses':
            $stmt = $pdo->query("SELECT * FROM classes");
            $classes = $stmt->fetchAll();
            foreach($classes as &$c) $c['subjects'] = json_decode($c['subjects']);
            $response = $classes;
            break;
            
        case 'getExams':
             $stmt = $pdo->query("SELECT * FROM exams");
             $exams = $stmt->fetchAll();
             foreach($exams as &$e) $e['schedule'] = json_decode($e['schedule']);
             $response = $exams;
             break;
             
        case 'addExam':
             $id = uuid();
             $stmt = $pdo->prepare("INSERT INTO exams (id, name, classId, schedule) VALUES (?, ?, ?, ?)");
             $stmt->execute([$id, $params['name'], $params['classId'], json_encode($params['schedule'])]);
             $response = ["success" => true];
             break;
             
        case 'recordStudentResult':
             // Check if exists
             $stmtCheck = $pdo->prepare("SELECT id FROM exam_results WHERE examId=? AND studentId=? AND subject=?");
             $stmtCheck->execute([$params['exam_id'], $params['student_id'], $params['subject_name']]);
             $exists = $stmtCheck->fetch();
             
             if ($exists) {
                 $stmt = $pdo->prepare("UPDATE exam_results SET marksObtained=?, totalMarks=?, grade=? WHERE id=?");
                 $stmt->execute([$params['marks_obtained'], $params['total_marks'], $params['grade'], $exists['id']]);
             } else {
                 $id = uuid();
                 $stmt = $pdo->prepare("INSERT INTO exam_results (id, examId, studentId, subject, marksObtained, totalMarks, grade) VALUES (?, ?, ?, ?, ?, ?, ?)");
                 $stmt->execute([$id, $params['exam_id'], $params['student_id'], $params['subject_name'], $params['marks_obtained'], $params['total_marks'], $params['grade']]);
             }
             $response = ["success" => true];
             break;
             
        // --- Files ---
        case 'uploadTherapyFile':
            $id = uuid();
            $stmt = $pdo->prepare("INSERT INTO therapy_files (id, studentId, fileName, fileType, fileBase64, description) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $params['studentId'], $params['fileName'], $params['fileType'], $params['fileBase64'], $params['description']]);
            $response = ["success" => true];
            break;
            
        case 'deleteTherapyFile':
            $stmt = $pdo->prepare("DELETE FROM therapy_files WHERE id=?");
            $stmt->execute([$params['id']]);
            $response = ["success" => true];
            break;
            
        case 'enrollStudentCourse':
            $id = uuid();
            $stmt = $pdo->prepare("INSERT INTO student_courses (id, studentId, courseId, feeBasis, agreedFee) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $params['studentId'], $params['courseId'], $params['feeBasis'], $params['agreedFee']]);
            $response = ["success" => true];
            break;

        case 'removeStudentCourse':
             $stmt = $pdo->prepare("DELETE FROM student_courses WHERE id=?");
             $stmt->execute([$params['id']]);
             $response = ["success" => true];
             break;
             
        case 'createCustomInvoice':
             $id = uuid();
             // Get settings for inv no
             $stmtSet = $pdo->query("SELECT data FROM settings WHERE id=1");
             $settings = json_decode($stmtSet->fetch()['data'], true);
             $lastInvNo = $settings['lastInvoiceNo'] + 1;
             $invNo = "INV-" . $lastInvNo;
             
             // Get student name
             $stmtS = $pdo->prepare("SELECT name FROM students WHERE id=?");
             $stmtS->execute([$params['studentId']]);
             $sName = $stmtS->fetchColumn();
             
             $items = [['description' => $params['type'] . ': ' . $params['description'], 'amount' => $params['amount']]];
             $month = date('Y-m');
             
             $stmt = $pdo->prepare("INSERT INTO invoices (id, invoiceNo, student_id, student_name, month_year, due_date, amount_due, status, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
             $stmt->execute([$id, $invNo, $params['studentId'], $sName, $month, $params['dueDate'], $params['amount'], $params['status'], json_encode($items)]);
             
             // Update settings
             $settings['lastInvoiceNo'] = $lastInvNo;
             $pdo->prepare("UPDATE settings SET data=? WHERE id=1")->execute([json_encode($settings)]);
             
             $response = ["success" => true];
             break;
             
        case 'addStudentAdjustment':
             // Check pending invoice
             $stmtInv = $pdo->prepare("SELECT * FROM invoices WHERE student_id=? AND status='Pending' LIMIT 1");
             $stmtInv->execute([$params['studentId']]);
             $inv = $stmtInv->fetch();
             
             $id = uuid();
             $addedToInvoice = false;
             
             if ($inv) {
                 $items = json_decode($inv['items'], true);
                 $items[] = ['description' => $params['type'] . ': ' . $params['description'], 'amount' => $params['amount']];
                 $newTotal = $inv['amount_due'] + $params['amount'];
                 
                 $pdo->prepare("UPDATE invoices SET items=?, amount_due=? WHERE id=?")->execute([json_encode($items), $newTotal, $inv['id']]);
                 
                 // Log applied adjustment
                 $stmtAdj = $pdo->prepare("INSERT INTO student_adjustments (id, studentId, type, amount, description, date, isApplied, invoiceId) VALUES (?, ?, ?, ?, ?, ?, 1, ?)");
                 $stmtAdj->execute([$id, $params['studentId'], $params['type'], $params['amount'], $params['description'], $params['date'], $inv['id']]);
                 $addedToInvoice = true;
             } else {
                 // Log pending adjustment
                 $stmtAdj = $pdo->prepare("INSERT INTO student_adjustments (id, studentId, type, amount, description, date, isApplied) VALUES (?, ?, ?, ?, ?, ?, 0)");
                 $stmtAdj->execute([$id, $params['studentId'], $params['type'], $params['amount'], $params['description'], $params['date']]);
             }
             $response = ["addedToInvoice" => $addedToInvoice];
             break;
             
        case 'getTransactions':
            $stmt = $pdo->query("SELECT * FROM transactions ORDER BY date DESC");
            $response = $stmt->fetchAll();
            break;
            
        case 'getAuditLogs':
             $stmt = $pdo->query("SELECT * FROM audit_logs ORDER BY timestamp DESC");
             $response = $stmt->fetchAll();
             break;

        case 'logEmployeePromotion':
             $id = uuid();
             $stmt = $pdo->prepare("INSERT INTO employee_history (id, employee_id, designation_from, designation_to, date, reason) VALUES (?, ?, (SELECT designation FROM staff WHERE id=?), ?, ?, ?)");
             $stmt->execute([$id, $params['employee_id'], $params['employee_id'], $params['designation_to'], $params['date'], $params['reason']]);
             
             $stmtUpd = $pdo->prepare("UPDATE staff SET designation=?, salary=? WHERE id=?");
             $stmtUpd->execute([$params['designation_to'], $params['new_salary'], $params['employee_id']]);
             $response = ["success" => true];
             break;

        default:
            $response = ["error" => "Invalid Action"];
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>