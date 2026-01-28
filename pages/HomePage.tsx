
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, Teacher } from '../types';
import { AdminIcon, LogoIcon, TeacherIcon, StudentIcon } from '../components/Icons';

const HomePage: React.FC = () => {
  const { login, setPage, teachers, addTeacher, authenticateTeacher, authenticateAdmin, exams } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [isStudentView, setIsStudentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('tid');
  });
  const [customBranding, setCustomBranding] = useState<{ schoolName: string } | null>(null);
  const [waitingExam, setWaitingExam] = useState<{ id: string, subject: string, title: string } | null>(null);
  const [isInvalidLink, setIsInvalidLink] = useState(false);

  // Student State
  const [examCode, setExamCode] = useState('');
  const [studentError, setStudentError] = useState('');

  // Unified Login state
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupSchool, setSignupSchool] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupMessage, setSignupMessage] = useState('');

  const hasAttemptedAutoJoin = React.useRef(false);

  // Student Auto-Join & Branding Logic
  useEffect(() => {
    // Check for URL parameters
    const params = new URLSearchParams(window.location.search);
    const tid = params.get('tid');
    const ec = params.get('ec') || params.get('code');
    const ak = params.get('ak');

    // Handle branding
    if (tid && teachers.length > 0) {
      const foundTeacher = teachers.find(t => t.id === tid);
      if (foundTeacher && foundTeacher.schoolName) {
        setCustomBranding({ schoolName: foundTeacher.schoolName });
      }
    }

    // Handle auto-join if exam code or access key is provided in URL
    if ((ec || ak) && exams.length > 0 && !hasAttemptedAutoJoin.current) {
      hasAttemptedAutoJoin.current = true;
      let foundExam = null;

      if (ak) {
        foundExam = exams.find(ex => ex.accessKey === ak && ex.isActive);
      }
      if (!foundExam && ec) {
        const studentInputCode = ec.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        foundExam = exams.find(
          (ex) => ex.examCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === studentInputCode && ex.isActive
        );
      }

      if (foundExam) {
        setPage(Page.StudentInfo, { examId: foundExam.id });
      } else {
        // Find if exam exists but is inactive
        let inactiveExam = null;
        if (ak) inactiveExam = exams.find(ex => ex.accessKey === ak);
        if (!inactiveExam && ec) {
          const studentInputCode = ec.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          inactiveExam = exams.find(
            (ex) => ex.examCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === studentInputCode
          );
        }
        if (inactiveExam && !inactiveExam.isActive) {
          setWaitingExam({ id: inactiveExam.id, subject: inactiveExam.subject, title: inactiveExam.title });
        } else if (ak && !inactiveExam) {
          // Access key provided but no exam found at all (could be deleted or key regenerated)
          setIsInvalidLink(true);
        }
      }
    }
  }, [teachers, exams, setPage]);

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedCode = examCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const foundExam = exams.find(
      (ex) => ex.examCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === sanitizedCode && ex.isActive
    );

    if (foundExam) {
      setStudentError('');
      setPage(Page.StudentInfo, { examId: foundExam.id });
    } else {
      const exists = exams.find(ex => ex.examCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === sanitizedCode);
      if (!exists) {
        setStudentError('รหัสข้อสอบไม่ถูกต้อง');
      } else if (!exists.isActive) {
        setWaitingExam({ id: exists.id, subject: exists.subject, title: exists.title });
      } else {
        setStudentError('เกิดข้อผิดพลาดในการค้นหาข้อสอบ');
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (usernameOrEmail.trim().toLowerCase() === 'admin') {
      if (authenticateAdmin(password)) {
        login('admin');
        return;
      } else {
        setError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
        return;
      }
    }

    const teacher = authenticateTeacher(usernameOrEmail, password);
    if (teacher) {
      if (teacher.approved) {
        login(teacher);
      } else {
        setError('บัญชีของคุณยังไม่ได้รับการอนุมัติ');
      }
    } else {
      setError('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (teachers.find(t => t.email === signupEmail)) {
      setError('อีเมลนี้ถูกใช้สมัครไปแล้ว');
      return;
    }
    if (signupPassword.length < 4) {
      setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError('รหัสผ่านและการยืนยันไม่ตรงกัน');
      return;
    }

    addTeacher({ name: signupName, email: signupEmail, password: signupPassword, schoolName: signupSchool });
    setSignupMessage('การสมัครเสร็จสมบูรณ์! กรุณารอผู้ดูแลระบบอนุมัติ');
    setSignupName('');
    setSignupEmail('');
    setSignupSchool('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setTimeout(() => {
      setIsLogin(true);
      setSignupMessage('');
      setError('');
    }, 3000)
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start md:justify-center p-4 pt-[4vh] md:pt-0">
      <div className="w-full max-w-md">
        {/* Header Section (Branding) */}
        <div className="text-center mb-6 md:mb-8 animate-fade-in-down">
          <LogoIcon className="h-20 w-20 md:h-24 md:w-24 mx-auto text-indigo-600 mb-3 drop-shadow-sm" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-wide">
            ระบบข้อสอบออนไลน์
          </h1>
          {customBranding?.schoolName && (
            <p className="text-base md:text-xl font-medium text-indigo-600 mt-2 px-2 tracking-wide">
              {customBranding.schoolName}
            </p>
          )}
        </div>

        {/* Login/Signup Card */}
        <div className="bg-white rounded-xl shadow-2xl p-5 md:p-6 transform transition-all hover:shadow-indigo-100 animate-fade-in-up">
          {isInvalidLink ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-50 rounded-full">
                  <LogoIcon className="h-12 w-12 text-red-400 opacity-50" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                ลิงก์ข้อสอบนี้ถูกยกเลิกหรือไม่มีอยู่ในระบบแล้ว<br />
                <span className="text-xs mt-2 block font-medium text-red-500">คุณครูอาจมีการเปลี่ยนรหัสเข้าสอบใหม่ (Regenerate Link)</span>
                <span className="text-xs mt-1 block">กรุณาขอลิงก์ชุดใหม่จากคุณครูผู้สอนอีกครั้ง</span>
              </p>
            </div>
          ) : waitingExam ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <LogoIcon className="h-16 w-16 text-indigo-200" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">ยังไม่เปิดให้ทำข้อสอบ</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                วิชา <span className="font-bold text-indigo-600">{waitingExam.subject}</span><br />
                {waitingExam.title}<br />
                <span className="text-xs mt-2 block">กรุณารอคุณครูเปิดระบบ แล้วกดปุ่ม "ลองอีกครั้ง"</span>
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  ลองอีกครั้ง (Refresh)
                </button>
              </div>
            </div>
          ) : isStudentView ? (
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <StudentIcon className="h-8 w-8 text-indigo-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-5 tracking-wide border-b border-indigo-50 pb-2 inline-block px-4">สำหรับนักเรียน</h2>
              <form onSubmit={handleStartExam} className="space-y-5">
                <div>
                  <input
                    type="text"
                    value={examCode}
                    onChange={(e) => { setExamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setStudentError(''); }}
                    className="shadow-sm appearance-none border-2 border-gray-300 rounded-xl w-full py-3 px-4 text-center text-xl text-gray-700 leading-tight focus:outline-none focus:border-indigo-500 transition-all bg-white font-bold tracking-[0.2em] placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-300"
                    placeholder="รหัสเข้าสอบ"
                    required
                  />
                </div>
                {studentError && <p className="text-red-500 text-xs italic font-medium">{studentError}</p>}
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl focus:outline-none shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01] active:scale-95 tracking-wide">
                  เข้าสู่ระบบการสอบ
                </button>
                <div className="pt-2">
                  {/* Toggle button removed */}
                </div>
                <div className="text-[10px] text-indigo-400 font-medium mt-2 uppercase">
                  พัฒนาโดย ครูวิรัตน์ ธีรพิพัฒนปัญญา
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="flex justify-center space-x-2 mb-1">
                  <TeacherIcon className="h-7 w-7 text-indigo-500" />
                  <AdminIcon className="h-7 w-7 text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 tracking-wide border-b border-indigo-50 pb-1.5 inline-block px-4">สำหรับบุคลากร</h2>
                <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-wider font-medium">
                  {isLogin ? 'เข้าสู่ระบบครูและผู้ดูแลระบบ' : 'สมัครสมาชิกใหม่สำหรับคุณครู'}
                </p>
              </div>

              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1.5" htmlFor="username">
                      ชื่อผู้ใช้ หรือ อีเมล
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={usernameOrEmail}
                      onChange={(e) => { setUsernameOrEmail(e.target.value); setError(''); }}
                      className="shadow-sm appearance-none border-2 border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-indigo-500 transition-colors bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1.5" htmlFor="password">
                      รหัสผ่าน
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      className="shadow-sm appearance-none border-2 border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-indigo-500 transition-colors bg-white"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs italic">{error}</p>}
                  <div className="pt-2">
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl focus:outline-none shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01] active:scale-95 tracking-wide">
                      เข้าสู่ระบบ
                    </button>
                  </div>
                  <div className="text-center pt-3">
                    <p className="text-sm text-gray-500 mb-2">
                      ยังไม่มีบัญชีครู? <button type="button" onClick={() => { setIsLogin(false); setError('') }} className="font-bold text-indigo-600 hover:underline">สมัครใช้งานที่นี่</button>
                    </p>
                    {/* Toggle button removed */}
                    <div className="text-[10px] text-indigo-400 font-medium mt-2 uppercase">
                      พัฒนาโดย ครูวิรัตน์ ธีรพิพัฒนปัญญา
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-3">
                  {signupMessage && <p className="text-green-600 bg-green-100 p-2.5 rounded-lg text-center text-xs">{signupMessage}</p>}
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="signup-name">
                      ชื่อ-นามสกุล
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="shadow-sm appearance-none border-2 border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-indigo-400 transition-colors bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="signup-email">
                      อีเมล
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="shadow-sm appearance-none border-2 border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-indigo-400 transition-colors bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="signup-school">
                      ชื่อโรงเรียน
                    </label>
                    <input
                      id="signup-school"
                      type="text"
                      value={signupSchool}
                      onChange={(e) => setSignupSchool(e.target.value)}
                      className="shadow-sm appearance-none border-2 border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-indigo-400 transition-colors bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="signup-password">
                      รหัสผ่าน (4 ตัวขึ้นไป)
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="shadow-sm appearance-none border-2 border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-indigo-400 transition-colors bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1" htmlFor="signup-confirm-password">
                      ยืนยันรหัสผ่าน
                    </label>
                    <input
                      id="signup-confirm-password"
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="shadow-sm appearance-none border-2 border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-indigo-400 transition-colors bg-white"
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs italic">{error}</p>}
                  <div className="pt-2">
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl focus:outline-none shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01] active:scale-95 tracking-wide">
                      สมัครใช้งาน
                    </button>
                  </div>
                  <div className="text-center pt-3">
                    <p className="text-sm text-gray-500 mb-1">
                      มีบัญชีแล้ว? <button type="button" onClick={() => { setIsLogin(true); setError('') }} className="font-bold text-indigo-600 hover:underline">กลับไปเข้าสู่ระบบ</button>
                    </p>
                    <div className="text-[10px] text-indigo-400 font-medium mt-2 uppercase">
                      พัฒนาโดย ครูวิรัตน์ ธีรพิพัฒนปัญญา
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
