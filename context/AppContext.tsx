
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Page, Teacher, Exam, ExamResult, Student } from '../types';
import { 
  fetchData,
  addTeacherAPI, updateTeacherAPI, deleteTeacherAPI,
  addExamAPI, updateExamAPI, deleteExamAPI,
  addResultAPI, deleteResultAPI,
  updateAdminPasswordAPI,
  teachersCol,
  examsCol,
  resultsCol,
  configCol
} from '../services/databaseService';
import { onSnapshot, Timestamp } from 'firebase/firestore';

interface AppContextType {
  // State
  isLoading: boolean;
  error: string | null;
  page: Page;
  teachers: Teacher[];
  exams: Exam[];
  results: ExamResult[];
  loggedInUser: Teacher | 'admin' | null;
  activeExam: Exam | null;
  activeResult: ExamResult | null;
  activeStudent: Student | null;
  selectedSubject: string | null;
  returnPath: { page: Page; context?: any } | null;
  examDashboardFilters: { room: string; sortBy: 'number' | 'score' | 'date'; score: string };
  
  // Actions
  setPage: (page: Page, context?: any) => void;
  goBack: () => void;
  retryLoad: () => void;
  login: (user: Teacher | 'admin') => void;
  logout: () => void;
  authenticateAdmin: (password: string) => boolean;
  authenticateTeacher: (email: string, password: string) => Teacher | null;
  updateAdminPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateTeacherPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  setSelectedSubject: (subject: string | null) => void;
  setExamDashboardFilters: (filters: AppContextType['examDashboardFilters']) => void;
  
  // Teacher Actions
  addTeacher: (teacher: Omit<Teacher, 'id' | 'approved'>) => Promise<void>;
  updateTeacher: (teacher: Teacher) => Promise<void>;
  deleteTeacher: (teacherId: string) => Promise<void>;
  
  // Exam Actions
  addExam: (exam: Omit<Exam, 'id'>) => Promise<Exam | null>;
  updateExam: (exam: Exam) => Promise<void>;
  deleteExam: (examId: string) => Promise<void>;
  
  // Result Actions
  addResult: (result: Omit<ExamResult, 'id' | 'submittedAt'>) => Promise<void>;
  deleteResult: (resultId: string) => Promise<void>;
  deleteResultsForExam: (examId: string) => Promise<void>;
  deleteResultsForRoom: (examId: string, room: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultExamDashboardFilters = {
  room: 'all',
  sortBy: 'number' as 'number' | 'score' | 'date',
  score: '',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [page, setPageState] = useState<Page>(Page.Home);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [loggedInUser, setLoggedInUser] = useState<Teacher | 'admin' | null>(null);

  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<ExamResult | null>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [returnPath, setReturnPath] = useState<{ page: Page; context?: any } | null>(null);
  const [examDashboardFilters, setExamDashboardFilters] = useState(defaultExamDashboardFilters);
  
  // Effect for initial data loading from the online database
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchData();
        setTeachers(data.teachers);
        setExams(data.exams);
        setResults(data.results);
        setAdminPassword(data.adminPassword);

        // Check for saved user session after data is loaded
        const savedUserJson = localStorage.getItem('loggedInUser');
        if (savedUserJson) {
            const savedUser = JSON.parse(savedUserJson);
            if (savedUser.type === 'admin') {
                setLoggedInUser('admin');
                setPageState(Page.AdminDashboard);
            } else if (savedUser.type === 'teacher' && savedUser.id) {
                const foundTeacher = data.teachers.find(t => t.id === savedUser.id);
                if (foundTeacher && foundTeacher.approved) {
                    setLoggedInUser(foundTeacher);
                    setPageState(Page.TeacherDashboard);
                } else {
                    // Clear invalid session if teacher not found or not approved
                    localStorage.removeItem('loggedInUser');
                }
            }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [retryCount]);

  // Effect for real-time updates after initial load
  useEffect(() => {
    if (isLoading || error) return; // Don't attach listeners until initial load is successful

    // These listeners are for globally needed data (teachers, exams, config)
    const unsubTeachers = onSnapshot(teachersCol, (snapshot) => {
        setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher)));
    }, (err) => console.error("Real-time teachers update failed:", err));
    
    const unsubExams = onSnapshot(examsCol, (snapshot) => {
        setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
    }, (err) => console.error("Real-time exams update failed:", err));

    const unsubConfig = onSnapshot(configCol, (snapshot) => {
        if (!snapshot.empty) {
            setAdminPassword(snapshot.docs[0].data().adminPassword);
        }
    }, (err) => console.error("Real-time config update failed:", err));

    // ** FIX **: Conditionally listen for results only on pages that need it.
    // This prevents students taking an exam from re-rendering when another student submits a result.
    let unsubResults = () => {}; // No-op function by default
    if (page === Page.ExamDashboard || page === Page.StudentAnswerDetail) {
        unsubResults = onSnapshot(resultsCol, (snapshot) => {
            setResults(snapshot.docs.map(doc => {
                const data = doc.data();
                if (data.submittedAt && data.submittedAt instanceof Timestamp) {
                    data.submittedAt = data.submittedAt.toDate();
                }
                return { id: doc.id, ...data } as ExamResult;
            }));
        }, (err) => console.error("Real-time results update failed:", err));
    }

    // Cleanup listeners on component unmount or when page changes
    return () => {
        unsubTeachers();
        unsubExams();
        unsubConfig();
        unsubResults();
    };
  }, [isLoading, error, page]); // Add 'page' to dependency array to re-evaluate listeners on page change


  const retryLoad = () => setRetryCount(prev => prev + 1);

  const activeExam = exams.find(e => e.id === activeExamId) || null;
  
  const stableSetSelectedSubject = useCallback((subject: string | null) => {
    setSelectedSubject(subject);
  }, []);

  const setPage = useCallback((newPage: Page, context?: any) => {
    const { returnTo, ...restContext } = context || {};
    
    if (returnTo) {
      setReturnPath(returnTo);
    } else if (newPage !== Page.CreateEditExam) {
      // Clear the return path when navigating to any page that is NOT the editor
      setReturnPath(null);
    }

    // When navigating to the Exam Dashboard, reset filters to default
    // unless explicitly told not to (e.g., coming back from a detail view).
    if (newPage === Page.ExamDashboard && context?.resetFilters !== false) {
      setExamDashboardFilters(defaultExamDashboardFilters);
    }

    if (restContext?.examId !== undefined) setActiveExamId(restContext.examId);
    else if (![Page.CreateEditExam, Page.ExamDashboard, Page.StudentInfo, Page.TakingExam, Page.StudentAnswerDetail].includes(newPage)) setActiveExamId(null);
    
    // ** FINAL FIX **: Rely ONLY on the passed 'result' object.
    // The component calling setPage (Student or Teacher) is responsible for providing the full object.
    // This removes the dependency on the global 'results' array, making this function stable.
    if (restContext?.result) {
        setActiveResult(restContext.result);
    } else if (![Page.StudentResult, Page.StudentAnswerDetail].includes(newPage)) {
        // Clear activeResult when navigating away from result pages
        setActiveResult(null);
    }


    if (restContext?.student) setActiveStudent(restContext.student);
    else if (newPage !== Page.TakingExam) setActiveStudent(null);
    
    if (restContext?.subject !== undefined) {
        setSelectedSubject(restContext.subject);
    } else if (newPage !== Page.TeacherDashboard && newPage !== Page.CreateEditExam) {
        // Clear subject when navigating away completely
        setSelectedSubject(null);
    }

    setPageState(newPage);
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => {
    if (returnPath) {
        setPage(returnPath.page, returnPath.context);
    } else {
        // Sensible fallback
        setPage(Page.TeacherDashboard);
    }
  }, [returnPath, setPage]);

  const login = useCallback((user: Teacher | 'admin') => {
    setLoggedInUser(user);
    if (user === 'admin') {
      localStorage.setItem('loggedInUser', JSON.stringify({ type: 'admin' }));
      setPage(Page.AdminDashboard);
    } else {
      localStorage.setItem('loggedInUser', JSON.stringify({ type: 'teacher', id: user.id }));
      setPage(Page.TeacherDashboard);
    }
  }, [setPage]);

  const logout = useCallback(() => {
    localStorage.removeItem('loggedInUser');
    setLoggedInUser(null);
    setPage(Page.Home);
  }, [setPage]);

  const authenticateAdmin = (password: string): boolean => password === adminPassword;

  const authenticateTeacher = (email: string, password: string): Teacher | null => {
    const teacher = teachers.find(t => t.email === email && t.password === password);
    return teacher || null;
  };

  const updateTeacher = useCallback(async (updatedTeacher: Teacher) => {
    try {
      await updateTeacherAPI(updatedTeacher);
    } catch (error) { console.error("Failed to update teacher:", error); }
  }, []);

  const updateAdminPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (currentPassword !== adminPassword) return { success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };
    try {
      await updateAdminPasswordAPI(newPassword);
      return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
    } catch (error) {
      console.error("Failed to update admin password:", error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน' };
    }
  }, [adminPassword]);

  const updateTeacherPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!loggedInUser || loggedInUser === 'admin') {
      return { success: false, message: 'ไม่มีผู้ใช้งานเข้าสู่ระบบ' };
    }
    
    const teacher = loggedInUser as Teacher;

    if (currentPassword !== teacher.password) {
      return { success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };
    }

    try {
      const updatedTeacher = { ...teacher, password: newPassword };
      await updateTeacher(updatedTeacher);
      // Update the state for the current session
      setLoggedInUser(updatedTeacher);
      return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
    } catch (error) {
      console.error("Failed to update teacher password:", error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน' };
    }
  }, [loggedInUser, updateTeacher]);
  
  const addTeacher = useCallback(async (teacherData: Omit<Teacher, 'id' | 'approved'>) => {
    try {
      const newTeacherData = { ...teacherData, approved: false };
      await addTeacherAPI(newTeacherData);
    } catch (error) { console.error("Failed to add teacher:", error); }
  }, []);

  const deleteTeacher = useCallback(async (teacherId: string) => {
    try {
      await deleteTeacherAPI(teacherId);
    } catch (error) { console.error("Failed to delete teacher:", error); }
  }, []);
  
  const addExam = useCallback(async (examData: Omit<Exam, 'id'>): Promise<Exam | null> => {
    try {
      const newExamFromAPI = await addExamAPI(examData);
      return newExamFromAPI;
    } catch (error) {
      console.error("Failed to add exam:", error);
      return null;
    }
  }, []);

  const updateExam = useCallback(async (updatedExam: Exam) => {
    try {
      await updateExamAPI(updatedExam);
    } catch (error) { console.error("Failed to update exam:", error); }
  }, []);

  const deleteExam = useCallback(async (examId: string) => {
    try {
      const resultsToDelete = results.filter(r => r.examId === examId);
      await Promise.all(resultsToDelete.map(r => deleteResultAPI(r.id)));
      await deleteExamAPI(examId);
    } catch (error) { console.error("Failed to delete exam and its results:", error); }
  }, [results]);
  
  const addResult = useCallback(async (resultData: Omit<ExamResult, 'id' | 'submittedAt'>) => {
    try {
      const newResultFromAPI = await addResultAPI(resultData);
      // ** FIX **: Do NOT update the global results state.
      // Instead, pass the newly created result object directly to the result page.
      // This prevents re-rendering for other students taking the exam.
      setPage(Page.StudentResult, { result: newResultFromAPI });
    } catch (error) {
      console.error("Failed to add result:", error);
    }
  }, [setPage]);

  const deleteResult = useCallback(async (resultId: string) => {
    try {
      await deleteResultAPI(resultId);
    } catch (error) { console.error("Failed to delete result:", error); }
  }, []);

  const deleteResultsForExam = useCallback(async (examId: string) => {
    try {
      const resultsToDelete = results.filter(r => r.examId === examId);
      await Promise.all(resultsToDelete.map(r => deleteResultAPI(r.id)));
    } catch (error) { console.error("Failed to delete results for exam:", error); }
  }, [results]);

  const deleteResultsForRoom = useCallback(async (examId: string, room: string) => {
    try {
      const resultsToDelete = results.filter(r => r.examId === examId && r.student.room === room);
      await Promise.all(resultsToDelete.map(r => deleteResultAPI(r.id)));
      setExamDashboardFilters(prev => ({...prev, room: 'all'}));
    } catch (error) {
      console.error(`Failed to delete results for exam ${examId} in room ${room}:`, error);
    }
  }, [results]);

  const value = {
    isLoading,
    error,
    page,
    teachers,
    exams,
    results,
    loggedInUser,
    activeExam,
    activeResult,
    activeStudent,
    selectedSubject,
    returnPath,
    examDashboardFilters,
    setPage,
    goBack,
    retryLoad,
    login,
    logout,
    authenticateAdmin,
    authenticateTeacher,
    updateAdminPassword,
    updateTeacherPassword,
    setSelectedSubject: stableSetSelectedSubject,
    setExamDashboardFilters,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addExam,
    updateExam,
    deleteExam,
    addResult,
    deleteResult,
    deleteResultsForExam,
    deleteResultsForRoom,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
