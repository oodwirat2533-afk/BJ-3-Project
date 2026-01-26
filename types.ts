
export enum Page {
  Home,
  AdminLogin,
  AdminDashboard,
  TeacherLogin,
  TeacherDashboard,
  CreateEditExam,
  ExamDashboard,
  StudentInfo,
  TakingExam,
  StudentResult,
  StudentAnswerDetail,
  Migration,
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  approved: boolean;
  password: string;
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
  requireFullscreen: boolean;
  restrictedRoom?: string;
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
