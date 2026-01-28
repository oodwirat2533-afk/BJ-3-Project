import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, Teacher, Exam } from '../types';
import {
  TeacherIcon, FolderIcon, SchoolIcon, LinkIcon, KeyIcon, LogoutIcon, EditIcon, TrashIcon,
  CopyIcon, CheckCircleIcon, ArrowLeftIcon, RefreshIcon
} from '../components/Icons';
import ConfirmationModal from '../components/ConfirmationModal';

const TeacherDashboard: React.FC = () => {
  const {
    loggedInUser,
    exams,
    setPage,
    deleteExam,
    updateExam,
    logout,
    selectedSubject,
    setSelectedSubject,
    updateTeacherPassword,
    updateTeacher
  } = useAppContext();

  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [updatingExamId, setUpdatingExamId] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolMessage, setSchoolMessage] = useState({ type: '', text: '' });
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedExamLink, setCopiedExamLink] = useState<string | null>(null);

  if (!loggedInUser || loggedInUser === 'admin') {
    setPage(Page.TeacherLogin);
    return null;
  }

  const teacher = loggedInUser as Teacher;
  const teacherExams = exams.filter(exam => exam.teacherId === teacher.id);

  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(teacherExams.map(exam => exam.subject))];
    return uniqueSubjects.sort((a, b) => (a as string).localeCompare(b as string, 'th'));
  }, [teacherExams]);

  const handleNavigateToCreateExam = (subject: string) => {
    setPage(Page.CreateEditExam, {
      examId: null,
      returnTo: { page: Page.TeacherDashboard, context: { subject: subject } },
    });
  };

  const handleConfirmNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      alert('กรุณากรอกชื่อรายวิชา');
      return;
    }
    handleNavigateToCreateExam(newSubjectName);
    setIsNewSubjectModalOpen(false);
    setNewSubjectName('');
  };

  const handleToggleExamStatus = async (exam: Exam) => {
    if (updatingExamId) return; // Prevent concurrent updates
    setUpdatingExamId(exam.id);
    try {
      await updateExam({ ...exam, isActive: !exam.isActive });
      // The Firestore listener will automatically update the UI state.
      // We'll clear the loading state in the finally block.
    } catch (error) {
      console.error("Failed to toggle exam status", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะข้อสอบ");
    } finally {
      // Ensure the loading state is always cleared after the operation.
      setUpdatingExamId(null);
    }
  };

  const confirmDeleteExam = async () => {
    if (examToDelete) {
      const subjectOfDeletedExam = examToDelete.subject;
      await deleteExam(examToDelete.id);

      // Check if there are any remaining exams for this subject
      const remainingExamsInSubject = teacherExams.filter(
        e => e.subject === subjectOfDeletedExam && e.id !== examToDelete.id
      );

      if (remainingExamsInSubject.length === 0) {
        setSelectedSubject(null);
      }

      setExamToDelete(null);
    }
  };

  // Auto-close subject folder if it becomes empty (e.g., after deletion)
  React.useEffect(() => {
    if (selectedSubject && subjects.length > 0 && !subjects.includes(selectedSubject)) {
      setSelectedSubject(null);
    }
  }, [subjects, selectedSubject, setSelectedSubject]);

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage({ type: '', text: '' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน' });
      return;
    }

    const result = await updateTeacherPassword(currentPassword, newPassword);

    if (result.success) {
      setPasswordMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        handlePasswordModalClose();
      }, 2000);
    } else {
      setPasswordMessage({ type: 'error', text: result.message });
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  const handleSchoolModalOpen = () => {
    setSchoolName(teacher.schoolName || '');
    setSchoolMessage({ type: '', text: '' });
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchoolSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolMessage({ type: '', text: '' });

    try {
      await updateTeacher({ ...teacher, schoolName: schoolName.trim() });
      setSchoolMessage({ type: 'success', text: 'บันทึกการตั้งค่าโรงเรียนสำเร็จ' });
      setTimeout(() => {
        setIsSchoolModalOpen(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to update school settings", error);
      setSchoolMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
  };

  const handleCopyPersonalLink = () => {
    // Determine the base URL (handles local and deployed environments)
    const baseUrl = window.location.origin + window.location.pathname;
    const personalLink = `${baseUrl}?tid=${teacher.id}`;

    navigator.clipboard.writeText(personalLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      alert('ไม่สามารถคัดลอกลิงก์ได้');
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('ไม่สามารถคัดลอกรหัสได้');
    });
  };

  const handleCopyExamLink = (exam: Exam) => {
    const baseUrl = window.location.origin + window.location.pathname;
    // Use accessKey if available, otherwise fallback to examCode (backward compatibility)
    const keyParam = exam.accessKey ? `ak=${exam.accessKey}` : `ec=${exam.examCode}`;
    const examLink = `${baseUrl}?tid=${teacher.id}&${keyParam}`;

    navigator.clipboard.writeText(examLink).then(() => {
      setCopiedExamLink(exam.id);
      setTimeout(() => setCopiedExamLink(null), 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      alert('ไม่สามารถคัดลอกลิงก์ได้');
    });
  };

  const handleRegenerateExamLink = async (exam: Exam) => {
    const newKey = Math.random().toString(36).substring(2, 12).toUpperCase();
    const baseUrl = window.location.origin + window.location.pathname;
    const newLink = `${baseUrl}?tid=${teacher.id}&ak=${newKey}`;

    try {
      await updateExam({ ...exam, accessKey: newKey });

      // Auto-copy new link to clipboard
      await navigator.clipboard.writeText(newLink);

      // Show visual feedback (reusing setCopiedExamLink)
      setCopiedExamLink(exam.id);
      setTimeout(() => setCopiedExamLink(null), 2000);
    } catch (error) {
      console.error("Failed to regenerate or copy exam link", error);
      alert("เกิดข้อผิดพลาดในการสร้างลิงก์หรือคัดลอกลิงก์");
    }
  };

  const examsInSelectedSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return teacherExams
      .filter(exam => exam.subject === selectedSubject)
      .sort((a, b) => a.title.localeCompare(b.title, 'th'));
  }, [teacherExams, selectedSubject]);

  const renderExamCards = (examList: Exam[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {examList.map(exam => {
        const buttonClass = exam.isActive
          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
          : 'bg-green-500 hover:bg-green-600 text-white';

        return (
          <div key={exam.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between transition-shadow hover:shadow-xl animate-fade-in-up">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-800">วิชา {exam.subject}</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${exam.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {exam.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </div>
              <p className="text-gray-600 mt-1">{exam.title}</p>
              <div className="mt-4 text-sm text-gray-500 space-y-1">
                <p>จำนวนข้อในคลัง: {exam.questions.length} ข้อ</p>
                <p>ข้อที่ใช้สอบจริง: {exam.totalQuestions} ข้อ</p>
                <p>เวลา: {exam.timeLimit} นาที</p>
                {exam.minSubmitTime > 0 && (
                  <p>เวลาส่งขั้นต่ำ: {exam.minSubmitTime} นาที</p>
                )}
                <div className="flex items-center pt-1">
                  <p>รหัสเข้าสอบ: <span className="font-semibold text-gray-700">{exam.examCode}</span></p>
                  <button
                    onClick={() => handleCopyCode(exam.examCode)}
                    title="คัดลอกรหัส"
                    className="ml-2 p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {copiedCode === exam.examCode ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <CopyIcon className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopyExamLink(exam)}
                    title="คัดลอกลิงก์ให้นักเรียนเข้าร่วมทันที"
                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {copiedExamLink === exam.id ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <LinkIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRegenerateExamLink(exam)}
                    title="รีเซ็ตลิงก์ใหม่ (ลิงก์เดิมจะใช้ไม่ได้ทันที)"
                    className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                  >
                    <RefreshIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col space-y-2">
              <button onClick={() => setPage(Page.ExamDashboard, { examId: exam.id })} className="w-full bg-blue-500 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-blue-600">
                ดูผลคะแนน
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleExamStatus(exam)}
                  disabled={updatingExamId === exam.id}
                  className={`w-full text-sm font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait ${buttonClass}`}
                >
                  {updatingExamId === exam.id ? 'กำลังอัปเดต...' : (exam.isActive ? 'ปิดข้อสอบ' : 'เปิดข้อสอบ')}
                </button>
                <button onClick={() => setPage(Page.CreateEditExam, { examId: exam.id, returnTo: { page: Page.TeacherDashboard, context: { subject: selectedSubject } } })} className="p-2 text-gray-500 hover:text-indigo-600 bg-gray-100 rounded-lg"><EditIcon className="w-5 h-5" /></button>
                <button onClick={() => setExamToDelete(exam)} className="p-2 text-gray-500 hover:text-red-600 bg-gray-100 rounded-lg"><TrashIcon className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSubjectFolders = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {subjects.map(subject => {
        const examCount = teacherExams.filter(e => e.subject === subject).length;
        return (
          <div key={subject} onClick={() => setSelectedSubject(subject)} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl animate-fade-in-up">
            <FolderIcon className="h-16 w-16 text-indigo-500 mb-3" />
            <h3 className="text-lg font-bold text-gray-800">วิชา {subject}</h3>
            <p className="text-sm text-gray-500">{examCount} ชุดข้อสอบ</p>
          </div>
        )
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-2.5 rounded-xl">
            <TeacherIcon className="h-10 w-10 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">แผงควบคุมครู</h1>
            <p className="text-gray-500 mt-2">ยินดีต้อนรับ {teacher.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {selectedSubject ? (
            <button
              onClick={() => handleNavigateToCreateExam(selectedSubject)}
              className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 shadow-md transition-transform transform hover:scale-105"
            >
              + สร้างข้อสอบในรายวิชานี้
            </button>
          ) : (
            <button
              onClick={() => setIsNewSubjectModalOpen(true)}
              className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 shadow-md transition-transform transform hover:scale-105"
            >
              + สร้างรายวิชาใหม่
            </button>
          )}
          <button onClick={handleSchoolModalOpen} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 bg-white px-4 py-2 rounded-lg shadow-sm border">
            <SchoolIcon className="h-5 w-5" />
            <span>ตั้งค่าโรงเรียน</span>
          </button>
          <button onClick={() => setIsPasswordModalOpen(true)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 bg-white px-4 py-2 rounded-lg shadow-sm border">
            <KeyIcon className="h-5 w-5" />
            <span>เปลี่ยนรหัสผ่าน</span>
          </button>
          <button onClick={() => setIsLogoutModalOpen(true)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 bg-white px-4 py-2 rounded-lg shadow-sm border">
            <LogoutIcon className="h-5 w-5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </header>

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex items-center">
            {selectedSubject && (
              <button
                onClick={() => setSelectedSubject(null)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg shadow-sm border border-gray-300 transition-colors mr-4 whitespace-nowrap"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>กลับไปที่รายวิชา</span>
              </button>
            )}
            <h2 className="text-2xl font-semibold text-gray-800">{selectedSubject ? `วิชา: ${selectedSubject}` : 'รายวิชาทั้งหมด'}</h2>
          </div>
        </div>

        {teacherExams.length > 0 ? (
          selectedSubject ? renderExamCards(examsInSelectedSubject) : renderSubjectFolders()
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">คุณยังไม่มีรายวิชาและชุดข้อสอบ</p>
            <p className="text-gray-500">คลิก "+ สร้างรายวิชาใหม่" เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>

      {
        examToDelete && (
          <ConfirmationModal
            title="ยืนยันการลบชุดข้อสอบ"
            message={`คุณแน่ใจหรือไม่ว่าต้องการลบชุดข้อสอบวิชา "${examToDelete.subject}" (${examToDelete.title})? ผลสอบของนักเรียนทั้งหมดที่เกี่ยวข้องจะถูกลบไปด้วย และการกระทำนี้ไม่สามารถย้อนกลับได้`}
            onConfirm={confirmDeleteExam}
            onCancel={() => setExamToDelete(null)}
          />
        )
      }

      {
        isNewSubjectModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">สร้างรายวิชาใหม่</h2>
                <button onClick={() => setIsNewSubjectModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleConfirmNewSubject}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">ชื่อรายวิชา</label>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                    placeholder="เช่น วิทยาการคำนวณ"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button type="button" onClick={() => setIsNewSubjectModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">ยกเลิก</button>
                  <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700">สร้างและเริ่มเพิ่มข้อสอบ</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        isPasswordModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">เปลี่ยนรหัสผ่าน</h2>
                <button onClick={handlePasswordModalClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleChangePassword}>
                {passwordMessage.text && (
                  <div className={`p-3 rounded-lg mb-4 text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {passwordMessage.text}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                </div>
                <div className="flex justify-end gap-4">
                  <button type="button" onClick={handlePasswordModalClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                    ยกเลิก
                  </button>
                  <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700">
                    อัปเดตรหัสผ่าน
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        isSchoolModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">ตั้งค่าข้อมูลโรงเรียน</h2>
                <button onClick={() => setIsSchoolModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleSaveSchoolSettings}>
                {schoolMessage.text && (
                  <div className={`p-3 rounded-lg mb-4 text-sm ${schoolMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {schoolMessage.text}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">ชื่อโรงเรียน</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="เช่น โรงเรียนตัวอย่างวิทยา"
                  />
                  <p className="mt-1 text-xs text-gray-500">ชื่อนี้จะแสดงในหน้าแรกของนักเรียน เมื่อนักเรียนเข้าผ่านลิงก์ส่วนตัวของคุณ</p>
                </div>

                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <label className="block text-sm font-bold text-indigo-900 mb-2">ลิงก์หน้าแรกส่วนตัวของคุณ</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}${window.location.pathname}?tid=${teacher.id}`}
                      className="flex-grow bg-white px-3 py-2 text-xs border border-indigo-200 rounded text-gray-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPersonalLink}
                      className={`p-2 rounded-md transition-all ${copiedLink ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                      {copiedLink ? <CheckCircleIcon className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-indigo-600">คุณสามารถคัดลอกลิงก์นี้ไปให้นักเรียนเพื่อให้แสดงชื่อโรงเรียนของคุณได้ทันทีครับ</p>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsSchoolModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                    ยกเลิก
                  </button>
                  <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 shadow-md">
                    บันทึกการตั้งค่า
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        isLogoutModalOpen && (
          <ConfirmationModal
            title="ยืนยันการออกจากระบบ"
            message="คุณต้องการออกจากระบบใช่หรือไม่?"
            confirmText="ออกจากระบบ"
            onConfirm={handleLogoutConfirm}
            onCancel={() => setIsLogoutModalOpen(false)}
            confirmButtonClass="bg-red-600 hover:bg-red-700"
          />
        )
      }
    </div >
  );
};

export default TeacherDashboard;
