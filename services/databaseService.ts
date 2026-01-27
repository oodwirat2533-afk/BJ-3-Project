
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from './firebaseConfig';
import { Teacher, Exam, ExamResult } from '../types';

export interface AppData {
  teachers: Teacher[];
  exams: Exam[];
  results: ExamResult[];
  adminPassword: string;
}

// --- Firestore Collection References ---
export const teachersCol = collection(db, "teachers");
export const examsCol = collection(db, "exams");
export const resultsCol = collection(db, "results");
export const configCol = collection(db, "app_config");


// --- Firestore Data Fetching ---
export const fetchData = async (): Promise<AppData> => {
  try {
    const fetchDataPromise = Promise.all([
      getDocs(teachersCol),
      getDocs(examsCol),
      getDocs(resultsCol),
      getDocs(configCol)
    ]);

    // Add a timeout to the database fetch operation to prevent infinite loading
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("การเชื่อมต่อฐานข้อมูลหมดเวลา")), 10000) // 10 seconds timeout
    );

    // Race the fetch against the timeout
    const [teachersSnap, examsSnap, resultsSnap, configSnap] = await Promise.race([
      fetchDataPromise,
      timeoutPromise
    ]);

    if (configSnap.empty) {
      console.log("No config found. Application might not be initialized.");
      return {
        teachers: [],
        exams: [],
        results: [],
        adminPassword: ''
      };
    }

    const teachers = teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
    const exams = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
    const results = resultsSnap.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamp to JS Date
      // Convert Firestore Timestamp to JS Date
      if (data.submittedAt) {
        if (typeof data.submittedAt.toDate === 'function') {
          // Real Firestore Timestamp
          data.submittedAt = data.submittedAt.toDate();
        } else if (data.submittedAt.seconds !== undefined) {
          // Plain object resembling timestamp (from JSON import)
          data.submittedAt = new Date(data.submittedAt.seconds * 1000);
        } else if (typeof data.submittedAt === 'string') {
          // ISO String
          data.submittedAt = new Date(data.submittedAt);
        }

        // Debugging logs
        if (data.submittedAt instanceof Date && isNaN(data.submittedAt.getTime())) {
          console.error("Found Invalid Date in doc:", doc.id, "Raw value:", doc.data().submittedAt);
        }
      }
      return { id: doc.id, ...data } as ExamResult;
    });
    const adminPassword = configSnap.docs[0].data().adminPassword;

    console.log("Data loaded successfully from Firestore.");
    return { teachers, exams, results, adminPassword };

  } catch (error: any) {
    console.error("Failed to fetch data from Firestore:", error);

    const errorMessage = error.message.includes("หมดเวลา")
      ? `การเชื่อมต่อฐานข้อมูลหมดเวลา (Timeout) ปัญหานี้มักเกิดจากสาเหตุต่อไปนี้:
1. ยังไม่ได้สร้างฐานข้อมูล Firestore ในโปรเจกต์ Firebase ของคุณ
2. การตั้งค่า 'firebaseConfig' ในไฟล์ services/firebaseConfig.ts ไม่ถูกต้อง
3. อินเทอร์เน็ตของคุณมีปัญหาในการเชื่อมต่อกับเซิร์ฟเวอร์ของ Google

กรุณาตรวจสอบขั้นตอนเหล่านี้ใน Firebase Console แล้วลองอีกครั้ง`
      : "เกิดข้อผิดพลาดร้ายแรงในการเชื่อมต่อกับฐานข้อมูล ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการตั้งค่า Firebase";

    throw new Error(errorMessage);
  }
};

// --- CRUD Functions for Firestore ---

// Teacher
export const addTeacherAPI = async (teacher: Omit<Teacher, 'id'>): Promise<Teacher> => {
  const docRef = await addDoc(teachersCol, teacher);
  return { id: docRef.id, ...teacher };
};
export const updateTeacherAPI = async (teacher: Teacher): Promise<Teacher> => {
  const { id, ...data } = teacher;
  // Create a clean object to avoid circular reference issues when updating Firestore documents.
  const cleanData = {
    name: data.name,
    email: data.email,
    approved: data.approved,
    password: data.password,
  };
  await updateDoc(doc(db, "teachers", id), cleanData);
  return teacher;
};
export const deleteTeacherAPI = (teacherId: string): Promise<void> => deleteDoc(doc(db, "teachers", teacherId));

// Exam
export const addExamAPI = async (exam: Omit<Exam, 'id'>): Promise<Exam> => {
  const docRef = await addDoc(examsCol, exam);
  return { id: docRef.id, ...exam };
};
export const updateExamAPI = async (exam: Exam): Promise<Exam> => {
  const { id, ...data } = exam;

  // Create a clean, plain JavaScript object for Firestore to avoid circular reference errors.
  // The 'questions' array, when coming from Firestore state, can contain complex objects.
  const cleanData = {
    teacherId: data.teacherId,
    subject: data.subject,
    title: data.title,
    questions: data.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      options: [...q.options],
      correctAnswerIndex: q.correctAnswerIndex,
    })),
    totalQuestions: data.totalQuestions,
    timeLimit: data.timeLimit,
    minSubmitTime: data.minSubmitTime,
    isActive: data.isActive,
    examCode: data.examCode,
    requireFullscreen: data.requireFullscreen,
    restrictedRoom: data.restrictedRoom || '',
  };

  await updateDoc(doc(db, "exams", id), cleanData);
  return exam;
};
export const deleteExamAPI = (examId: string): Promise<void> => deleteDoc(doc(db, "exams", examId));

// Result
// FIX: The `submittedAt` property is generated by the server, so it shouldn't be part of the input type.
export const addResultAPI = async (result: Omit<ExamResult, 'id' | 'submittedAt'>): Promise<ExamResult> => {
  const dataToSave = { ...result, submittedAt: serverTimestamp() };
  const docRef = await addDoc(resultsCol, dataToSave);
  return {
    id: docRef.id,
    ...result,
    submittedAt: new Date() // Return current date for immediate UI update
  };
};
export const deleteResultAPI = (resultId: string): Promise<void> => deleteDoc(doc(db, "results", resultId));

// Admin Password
export const updateAdminPasswordAPI = (newPassword: string): Promise<void> => {
  const configRef = doc(db, "app_config", "main_config");
  return updateDoc(configRef, { adminPassword: newPassword });
};