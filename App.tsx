
import React from 'react';
import { useAppContext } from './context/AppContext';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherLoginPage from './pages/TeacherLoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateEditExamPage from './pages/CreateEditExamPage';
import ExamDashboardPage from './pages/ExamDashboardPage';
import StudentInfoPage from './pages/StudentInfoPage';
import ExamTakingPage from './pages/ExamTakingPage';
import StudentResultPage from './pages/StudentResultPage';
import StudentAnswerDetailPage from './pages/StudentAnswerDetailPage';
import MigrationPage from './pages/MigrationPage';
import { Page } from './types';
import { LogoIcon, WarningIcon, RefreshIcon } from './components/Icons';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
    <LogoIcon className="h-16 w-16 text-indigo-500 animate-spin mb-4" />
    <p className="text-lg text-gray-700 font-semibold">กำลังโหลดข้อมูลล่าสุด...</p>
  </div>
);

const ErrorScreen: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-center">
    <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-2xl">
      <WarningIcon className="h-16 w-16 mx-auto text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-red-700 mb-4">เกิดข้อผิดพลาดในการเชื่อมต่อ</h1>
      <pre className="text-sm text-gray-600 bg-gray-100 p-4 rounded-md whitespace-pre-wrap text-left font-sans">
        {message}
      </pre>
      <button
        onClick={onRetry}
        className="mt-8 w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center mx-auto"
      >
        <RefreshIcon className="h-5 w-5 mr-2" />
        ลองอีกครั้ง
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const { page, isLoading, error, retryLoad } = useAppContext();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 text-gray-800">
      {isLoading ? (
        <LoadingScreen />
      ) : error ? (
        <ErrorScreen message={error} onRetry={retryLoad} />
      ) : (
        <>
          <main className="flex-grow flex flex-col">
            {(() => {
              switch (page) {
                case Page.Home: return <HomePage />;
                case Page.AdminLogin: return <AdminLoginPage />;
                case Page.AdminDashboard: return <AdminDashboard />;
                case Page.TeacherLogin: return <TeacherLoginPage />;
                case Page.TeacherDashboard: return <TeacherDashboard />;
                case Page.CreateEditExam: return <CreateEditExamPage />;
                case Page.ExamDashboard: return <ExamDashboardPage />;
                case Page.StudentInfo: return <StudentInfoPage />;
                case Page.TakingExam: return <ExamTakingPage />;
                case Page.StudentResult: return <StudentResultPage />;
                case Page.StudentAnswerDetail: return <StudentAnswerDetailPage />;
                case Page.Migration: return <MigrationPage />;
                default: return <HomePage />;
              }
            })()}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
