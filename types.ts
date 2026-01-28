
export enum Page {
  Home = 'home',
  AdminDashboard = 'admin-dashboard',
  StaffLogin = 'staff-login',
  AdminLogin = 'admin-login',
  TeacherDashboard = 'teacher-dashboard',
  TeacherLogin = 'teacher-login',
  CreateEditExam = 'create-edit-exam',
  ExamDashboard = 'exam-dashboard',
  StudentInfo = 'student-info',
  TakingExam = 'taking-exam',
  StudentResult = 'student-result',
  StudentAnswerDetail = 'student-answer-detail',
  Migration = 'migration',
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  approved: boolean;
  password: string;
  schoolName?: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: string[]; // [A, B, C, D]
  correctAnswerIndex: number;
}

export interface Exam {
  id: string;
  teacherId: string;
  subject: string;
  title: string; // Unit/Midterm/Final
  questions: Question[];
  totalQuestions: number; // Number of questions to be presented in the test
  timeLimit: number; // in minutes
  minSubmitTime: number; // in minutes
  isActive: boolean;
  examCode: string;
  requireFullscreen?: boolean;
  restrictedRoom?: string;
  restrictedGrade?: string;
  schoolName?: string;
  accessKey?: string;
}

export interface Student {
  prefix: string;
  firstName: string;
  lastName: string;
  grade: string;
  room: string;
  number: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedAnswerIndex: number | null;
}

export interface ExamResult {
  id: string;
  examId: string;
  student: Student;
  score: number;
  total: number;
  submittedAt: Date;
  answers: StudentAnswer[];
}

export enum Prefix {
  Boy = "เด็กชาย",
  Girl = "เด็กหญิง",
  Mr = "นาย",
  Ms = "นางสาว",
}

export enum Grade {
  M1 = "มัธยมศึกษาปีที่ 1",
  M2 = "มัธยมศึกษาปีที่ 2",
  M3 = "มัธยมศึกษาปีที่ 3",
  M4 = "มัธยมศึกษาปีที่ 4",
  M5 = "มัธยมศึกษาปีที่ 5",
  M6 = "มัธยมศึกษาปีที่ 6",
}
