
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Page } from '../types';
import { CheckCircleIcon } from '../components/Icons';

const StudentResultPage: React.FC = () => {
  const { setPage, activeResult } = useAppContext();

  if (!activeResult) {
    setPage(Page.Home);
    return null;
  }

  const { student, score, total } = activeResult;
  const percentage = total > 0 ? (score / total) * 100 : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100 p-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl text-center transform transition-all hover:scale-105 duration-500 animate-fade-in-up">
        <CheckCircleIcon className="h-20 w-20 mx-auto text-green-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ส่งข้อสอบเรียบร้อยแล้ว!</h1>
        <p className="text-gray-600 mb-8">นี่คือผลการสอบของคุณ</p>

        <div className="bg-gray-50 rounded-lg p-6 text-left space-y-3 border">
            <div className="flex justify-between">
                <span className="font-semibold text-gray-700">ชื่อ-นามสกุล:</span>
                <span className="text-gray-800">{`${student.prefix}${student.firstName} ${student.lastName}`}</span>
            </div>
             <div className="flex justify-between">
                <span className="font-semibold text-gray-700">ระดับชั้น:</span>
                <span className="text-gray-800">{`${student.grade.replace('มัธยมศึกษาปีที่ ', 'ม.')}/${student.room}`}</span>
            </div>
             <div className="flex justify-between">
                <span className="font-semibold text-gray-700">เลขที่:</span>
                <span className="text-gray-800">{student.number}</span>
            </div>
        </div>
        
        <div className="mt-8">
            <p className="text-lg text-gray-600">คะแนนที่ได้</p>
            <p className="text-6xl font-bold text-indigo-600 my-2">{score}<span className="text-3xl text-gray-500 font-medium">/{total}</span></p>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
              <div
                className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
        </div>

        <div className="mt-10">
            <button
                onClick={() => setPage(Page.Home)}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg"
            >
                กลับหน้าหลัก
            </button>
        </div>
      </div>
    </div>
  );
};

export default StudentResultPage;
