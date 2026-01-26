
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Page } from '../types';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '../components/Icons';

const StudentAnswerDetailPage: React.FC = () => {
  const { activeResult, activeExam, setPage } = useAppContext();
  const optionLabels = ['ก', 'ข', 'ค', 'ง'];

  if (!activeResult || !activeExam) {
    setPage(Page.TeacherDashboard);
    return null;
  }
  
  const { student, score, total, answers } = activeResult;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <button 
            onClick={() => setPage(Page.ExamDashboard, { examId: activeExam.id, resetFilters: false })} 
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg shadow-sm border border-gray-300 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>กลับไปที่ผลการสอบ</span>
          </button>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900">รายละเอียดผลสอบ: {student.prefix}{student.firstName} {student.lastName}</h1>
            <p className="text-gray-600">วิชา: {activeExam.subject} ({activeExam.title})</p>
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-700 gap-2">
              <span>{student.grade.replace('มัธยมศึกษาปีที่ ', 'ม.')}/{student.room} เลขที่ {student.number}</span>
              <span className="text-lg font-bold">คะแนนที่ได้: <span className="text-indigo-600">{score}</span> / {total}</span>
            </div>
          </div>
        </header>

        <main>
          <div className="space-y-4">
            {answers.map((answer, index) => {
              const question = activeExam.questions.find(q => q.id === answer.questionId);
              if (!question) return <div key={index} className="bg-white p-4 rounded-lg shadow">ไม่พบข้อมูลคำถาม</div>;

              const isCorrect = answer.selectedAnswerIndex === question.correctAnswerIndex;

              return (
                <div key={question.id} className="bg-white p-5 rounded-xl shadow-md">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-gray-800 mb-3">{index + 1}. {question.questionText}</p>
                    {isCorrect 
                      ? <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 ml-4" /> 
                      : <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0 ml-4" />}
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => {
                      const isSelected = answer.selectedAnswerIndex === optIndex;
                      const isCorrectAnswer = question.correctAnswerIndex === optIndex;
                      
                      let styles = "flex items-center justify-between p-3 rounded-lg border-2 transition-colors ";
                      if (isCorrectAnswer) {
                        styles += "bg-green-50 border-green-400 text-green-900";
                      } else if (isSelected && !isCorrectAnswer) {
                        styles += "bg-red-50 border-red-400 text-red-900";
                      } else {
                        styles += "bg-gray-50 border-gray-200 text-gray-700";
                      }

                      return (
                        <div key={optIndex} className={styles}>
                          <div className="flex items-center">
                            <span className="font-mono mr-2">{optionLabels[optIndex]}.</span>
                            <span>{option}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected && <span className="text-xs font-bold">[คำตอบของคุณ]</span>}
                            {isCorrectAnswer && <span className="text-xs font-bold">[คำตอบที่ถูก]</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentAnswerDetailPage;
