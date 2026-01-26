
import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, Prefix, Grade, Student } from '../types';

const StudentInfoPage: React.FC = () => {
  const { setPage, activeExam } = useAppContext();
  
  const [prefix, setPrefix] = useState<Prefix>(Prefix.Boy);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [grade, setGrade] = useState<Grade>(Grade.M1);
  const [room, setRoom] = useState('1');
  const [number, setNumber] = useState('1');
  const [showWarning, setShowWarning] = useState(false);

  const roomOptions = useMemo(() => {
    const gradeNumber = parseInt(grade.split(' ')[1]);
    const maxRoom = gradeNumber <= 3 ? 15 : 11;
    return Array.from({ length: maxRoom }, (_, i) => (i + 1).toString());
  }, [grade]);
  
  const numberOptions = Array.from({ length: 45 }, (_, i) => (i + 1).toString());

  if (!activeExam) {
    setPage(Page.Home);
    return null;
  }
  
  const proceedToExam = useCallback(() => {
    const student: Student = {
        prefix,
        firstName,
        lastName,
        grade,
        room,
        number,
    };
    setPage(Page.TakingExam, { student, examId: activeExam.id });
  }, [prefix, firstName, lastName, grade, room, number, setPage, activeExam.id]);

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!firstName.trim() || !lastName.trim()) {
        alert("กรุณากรอกชื่อและนามสกุล");
        return;
      }
      setShowWarning(true);
  };

  const handleStartExam = () => {
    if (activeExam?.requireFullscreen) {
      const elem = document.documentElement as any;
      const requestFullScreen =
        elem.requestFullscreen ||
        elem.webkitRequestFullscreen ||
        elem.mozRequestFullScreen ||
        elem.msRequestFullscreen;

      if (requestFullScreen) {
        requestFullScreen.call(elem).then(() => {
          proceedToExam();
        }).catch((err: Error) => {
          // If fullscreen fails (e.g., unsupported on device), alert the user but allow them to proceed.
          alert(`ไม่สามารถเข้าสู่โหมดเต็มจอได้ (อาจไม่รองรับบนอุปกรณ์นี้) กรุณาทำข้อสอบด้วยความระมัดระวัง`);
          proceedToExam();
        });
      } else {
        // If the API doesn't exist at all, proceed without fullscreen.
        console.warn("Fullscreen API is not supported on this browser.");
        proceedToExam();
      }
    } else {
      proceedToExam();
    }
  };

  if (showWarning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50 p-4">
        <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">คำเตือนก่อนเริ่มทำข้อสอบ</h2>
          <div className="text-left space-y-3 text-gray-700">
            <p>1. ระบบจะเริ่มนับเวลาทันทีหลังจากกดปุ่ม "เริ่มทำข้อสอบ"</p>
            <p>2. <span className="font-bold">ห้ามสลับแอป, สลับหน้าจอ, หรือออกจากเบราว์เซอร์โดยเด็ดขาด</span></p>
            <p>3. <span className="font-bold">ห้ามใช้โหมดแบ่งหน้าจอ (Split View) บน iPad</span> หรืออุปกรณ์อื่น</p>
            <p>4. หากระบบตรวจพบการกระทำดังกล่าว <span className="font-bold text-red-700">ชุดข้อสอบจะถูกเริ่มใหม่ทั้งหมด และเวลาก็จะเริ่มนับใหม่</span></p>
            <p>5. ระบบปิดการคลิกขวา และการคัดลอก/วางข้อความ</p>
            {activeExam?.requireFullscreen && <p className="font-bold text-indigo-700">6. ข้อสอบนี้บังคับให้ทำในโหมดเต็มจอ (Fullscreen) เท่านั้น</p>}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setShowWarning(false)} className="w-full sm:w-auto bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
              กลับไปแก้ไขข้อมูล
            </button>
            <button onClick={handleStartExam} className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700">
              รับทราบและเริ่มทำข้อสอบ
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">ข้อมูลผู้เข้าสอบ</h1>
            <p className="text-gray-600 mt-2">
              <strong>วิชา:</strong> {activeExam.subject} - {activeExam.title}
            </p>
          </div>
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prefix">
                  คำนำหน้า
                </label>
                <select
                  id="prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value as Prefix)}
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-white text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
                >
                  {Object.values(Prefix).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                  ชื่อ
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-white text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
                  นามสกุล
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-white text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="grade">
                  ระดับชั้น
                </label>
                <select
                  id="grade"
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value as Grade);
                    setRoom('1');
                  }}
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-white text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
                >
                  {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="room">
                  ห้อง
                </label>
                <select
                  id="room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-white text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
                >
                  {roomOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="number">
                  เลขที่
                </label>
                <select
                  id="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 bg-white text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
                >
                  {numberOptions.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-8 flex flex-col items-center justify-between space-y-4">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-transform transform hover:scale-105"
              >
                เริ่มทำข้อสอบ
              </button>
              <button
                type="button"
                onClick={() => setPage(Page.Home)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentInfoPage;
