
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page } from '../types';
import { AdminIcon, LogoIcon, StudentIcon, TeacherIcon } from '../components/Icons';

const HomePage: React.FC = () => {
  const { setPage, exams } = useAppContext();
  const [examCode, setExamCode] = useState('');
  const [error, setError] = useState('');

  /**
   * Sanitizes an exam code by trimming whitespace, converting to uppercase,
   * and removing all non-alphanumeric characters.
   * This makes matching more robust against copy-paste errors, typos,
   * or different formatting (e.g., "A68-MUL" vs "A68MUL").
   * @param code The input code string.
   * @returns A sanitized code string.
   */
  const sanitizeCode = (code: string): string => {
    if (!code) return '';
    return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();

    const studentInputCode = sanitizeCode(examCode);

    // --- การตรวจสอบรหัสที่ยืดหยุ่น ---
    // เปรียบเทียบรหัสที่นักเรียนป้อน (ซึ่งถูก sanitize แล้ว) กับรหัสในฐานข้อมูล
    // โดยทำการ sanitize รหัสจากฐานข้อมูลก่อนเปรียบเทียบด้วย
    // เพื่อป้องกันปัญหาจากข้อมูลเก่าที่อาจมีรูปแบบไม่ถูกต้อง (เช่น ตัวพิมพ์เล็ก, มีขีดกลาง)
    const foundExam = exams.find(
      (ex) => sanitizeCode(ex.examCode) === studentInputCode && ex.isActive
    );

    if (foundExam) {
      setError('');
      setPage(Page.StudentInfo, { examId: foundExam.id });
    } else {
      // ตรวจสอบสาเหตุที่หาไม่เจอเพื่อแสดงข้อความที่ชัดเจนขึ้น
      const examExists = exams.find(
        (ex) => sanitizeCode(ex.examCode) === studentInputCode
      );
      if (!examExists) {
        setError('รหัสข้อสอบไม่ถูกต้อง');
      } else if (!examExists.isActive) {
        setError('ชุดข้อสอบนี้ยังไม่เปิดให้ทำ');
      } else {
        // กรณีที่ไม่น่าจะเกิดขึ้น แต่ใส่ไว้เผื่อ
        setError('เกิดข้อผิดพลาดในการค้นหาข้อสอบ');
      }
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 animate-fade-in-down">
          <LogoIcon className="h-20 w-20 mx-auto text-indigo-500" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mt-4">
            ระบบข้อสอบออนไลน์
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 transform transition-all hover:scale-105 duration-500 animate-fade-in-up">
          <div className="flex items-center justify-center mb-6">
            <StudentIcon className="h-8 w-8 text-indigo-500" />
            <h2 className="text-2xl font-semibold text-gray-700 ml-3">สำหรับนักเรียน</h2>
          </div>
          <form onSubmit={handleStartExam}>
            <div className="mb-4">
              <label htmlFor="examCode" className="sr-only">รหัสเข้าสอบ</label>
              <input
                id="examCode"
                type="text"
                value={examCode}
                onChange={(e) => {
                  // Sanitize input in real-time for better UX.
                  const sanitizedValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setExamCode(sanitizedValue);
                  setError('');
                }}
                placeholder="กรอกรหัสเข้าสอบ"
                className="w-full px-4 py-3 text-center text-lg bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
              />
            </div>
            {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:translate-y-[-2px] transition-all duration-200 shadow-lg"
            >
              เข้าสู่ระบบการสอบ
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex justify-center items-center space-x-4 mb-4">
            <button
              onClick={() => setPage(Page.TeacherLogin)}
              className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <TeacherIcon className="h-5 w-5 mr-1" />
              <span>สำหรับครู</span>
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setPage(Page.AdminLogin)}
              className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <AdminIcon className="h-5 w-5 mr-1" />
              <span>สำหรับผู้ดูแลระบบ</span>
            </button>
          </div>

          <div className="text-sm text-indigo-700 font-semibold mt-2">
            พัฒนาโดย ครูวิรัตน์ ธีรพิพัฒนปัญญา
          </div>
        </div>


      </div>
    </div>
  );
};

export default HomePage;
