
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page } from '../types';
import { TrashIcon, DownloadIcon, StudentIcon, CheckCircleIcon, ArrowLeftIcon } from '../components/Icons';
import ConfirmationModal from '../components/ConfirmationModal';

const ExamDashboardPage: React.FC = () => {
  const { 
    activeExam, 
    results, 
    setPage, 
    deleteResult, 
    deleteResultsForExam,
    deleteResultsForRoom,
    examDashboardFilters,
    setExamDashboardFilters
  } = useAppContext();
  
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  if (!activeExam) {
    setPage(Page.TeacherDashboard);
    return null;
  }
  
  const examResults = results.filter(r => r.examId === activeExam.id);
  
  const availableRooms = useMemo(() => {
    const rooms = new Set(examResults.map(r => r.student.room));
    // FIX: Explicitly type sort parameters as string to prevent type inference issues.
    return Array.from(rooms).sort((a: string, b: string) => parseInt(a) - parseInt(b));
  }, [examResults]);

  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...examResults];
    if (examDashboardFilters.room !== 'all') {
      filtered = filtered.filter(r => r.student.room === examDashboardFilters.room);
    }
    if (examDashboardFilters.score !== '') {
      const minScore = parseFloat(examDashboardFilters.score);
      if (!isNaN(minScore)) {
        filtered = filtered.filter(r => r.score >= minScore);
      }
    }
    return filtered.sort((a, b) => {
      if (examDashboardFilters.sortBy === 'number') {
        return parseInt(a.student.number) - parseInt(b.student.number);
      } else if (examDashboardFilters.sortBy === 'score') {
        return b.score - a.score;
      } else { // date
        // Sort by newest first (descending)
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
    });
  }, [examResults, examDashboardFilters.room, examDashboardFilters.score, examDashboardFilters.sortBy]);
  
  const handleDeleteResult = (resultId: string) => {
    setModalState({
      isOpen: true,
      title: 'ยืนยันการลบผลสอบ',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบผลสอบของนักเรียนคนนี้?',
      onConfirm: () => {
        deleteResult(resultId);
        setModalState(null);
      }
    });
  };

  const handleDeleteAllResults = () => {
     setModalState({
      isOpen: true,
      title: 'ยืนยันการลบผลสอบทั้งหมด',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบผลสอบทั้งหมดของชุดข้อสอบนี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
      onConfirm: () => {
        deleteResultsForExam(activeExam.id);
        setModalState(null);
      }
    });
  };

  const handleDeleteResultsForRoom = () => {
    const room = examDashboardFilters.room;
    if (room === 'all') return;

    const resultsInRoomCount = examResults.filter(r => r.student.room === room).length;

    if (resultsInRoomCount === 0) {
        alert(`ไม่พบผลสอบสำหรับห้อง ${room} ที่จะลบ`);
        return;
    }

    setModalState({
     isOpen: true,
     title: `ยืนยันการลบผลสอบห้อง ${room}`,
     message: `คุณแน่ใจหรือไม่ว่าต้องการลบผลสอบทั้งหมด (${resultsInRoomCount} รายการ) ของห้อง ${room} สำหรับชุดข้อสอบนี้? การกระทำนี้ไม่สามารถย้อนกลับได้`,
     onConfirm: () => {
       deleteResultsForRoom(activeExam.id, room);
       setModalState(null);
     }
   });
 };

  const handleExportCsv = () => {
    if (filteredAndSortedResults.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    const headers = [
      "คำนำหน้า",
      "ชื่อ",
      "นามสกุล",
      "ระดับชั้น",
      "ห้อง",
      "เลขที่",
      "คะแนนที่ได้",
      "คะแนนเต็ม",
      "ร้อยละ (%)",
      "วันที่ส่ง",
    ];

    const data = filteredAndSortedResults.map(result => [
      result.student.prefix,
      result.student.firstName,
      result.student.lastName,
      result.student.grade.replace('มัธยมศึกษาปีที่ ', 'ม.'),
      result.student.room,
      result.student.number,
      result.score,
      result.total,
      ((result.score / result.total) * 100).toFixed(2),
      new Date(result.submittedAt).toLocaleString('th-TH'),
    ]);

    let csvContent = "\uFEFF"; // BOM for UTF-8 to support Thai characters in Excel
    csvContent += headers.join(",") + "\n";
    data.forEach(row => {
      csvContent += row.map(field => `"${field}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const fileName = `${activeExam.subject.replace(/\s/g, '_')}_${activeExam.title.replace(/\s/g, '_')}_Results.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  const closeModal = () => {
    setModalState(null);
  };

  const dateLocaleOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'buddhist',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => setPage(Page.TeacherDashboard, { subject: activeExam.subject })} 
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg shadow-sm border border-gray-300 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>กลับไปที่หน้ารายวิชา</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{activeExam.subject}</h1>
          <p className="text-gray-600">{activeExam.title}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <StudentIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">จำนวนผู้เข้าสอบ</p>
              <p className="text-2xl font-bold text-gray-800">{examResults.length} คน</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">คะแนนเต็ม</p>
              <p className="text-2xl font-bold text-gray-800">{activeExam.totalQuestions} คะแนน</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">ผลการสอบของนักเรียน</h2>
              {examResults.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                  <button onClick={handleExportCsv} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg">
                      <DownloadIcon className="w-4 h-4" />
                      <span>ส่งออกเป็น CSV</span>
                  </button>
                  {examDashboardFilters.room !== 'all' && (
                    <button onClick={handleDeleteResultsForRoom} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg">
                        <TrashIcon className="w-4 h-4" />
                        <span>ลบผลสอบห้อง {examDashboardFilters.room}</span>
                    </button>
                  )}
                  <button onClick={handleDeleteAllResults} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg">
                      <TrashIcon className="w-4 h-4" />
                      <span>ลบผลสอบทั้งหมด</span>
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                    <label className="text-sm font-medium text-gray-700">กรองตามห้อง:</label>
                    <select 
                        value={examDashboardFilters.room} 
                        onChange={e => setExamDashboardFilters({ ...examDashboardFilters, room: e.target.value })} 
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="all">ทุกห้อง</option>
                        {availableRooms.map(room => <option key={room} value={room}>ห้อง {room}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">เรียงตาม:</label>
                    <select 
                        value={examDashboardFilters.sortBy} 
                        onChange={e => setExamDashboardFilters({ ...examDashboardFilters, sortBy: e.target.value as 'number' | 'score' | 'date' })} 
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="number">เลขที่</option>
                        <option value="date">วันที่ส่งและเวลาล่าสุด</option>
                        <option value="score">คะแนน</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">คะแนนตั้งแต่:</label>
                    <input 
                        type="number" 
                        value={examDashboardFilters.score} 
                        onChange={e => setExamDashboardFilters({ ...examDashboardFilters, score: e.target.value })} 
                        placeholder="เช่น 5" 
                        className="mt-1 block w-full pl-3 pr-2 py-2 text-base bg-white border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="space-y-4 md:hidden">
              {filteredAndSortedResults.map(result => (
                <div key={result.id} className="bg-white p-4 rounded-xl shadow border">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow">
                      <button 
                        onClick={() => setPage(Page.StudentAnswerDetail, { result: result, examId: activeExam.id })} 
                        className="font-bold text-indigo-600 hover:underline text-left break-words"
                      >
                        {`${result.student.prefix}${result.student.firstName} ${result.student.lastName}`}
                      </button>
                      <p className="text-sm text-gray-600">
                        {`ชั้น ม.${result.student.grade.split(' ')[1]}/${result.student.room} เลขที่ ${result.student.number}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <p className="text-lg font-bold text-gray-800">{result.score}<span className="text-base text-gray-500">/{result.total}</span></p>
                      <button onClick={() => handleDeleteResult(result.id)} className="text-red-500 hover:text-red-700 mt-2 p-1">
                        <TrashIcon className="w-5 h-5"/>
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-right">
                      ส่งเมื่อ: {new Date(result.submittedAt).toLocaleString('th-TH', dateLocaleOptions)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชั้น/ห้อง</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เลขที่</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คะแนน</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ส่งและเวลาล่าสุด</th>
                             <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">การกระทำ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedResults.map(result => (
                            <tr key={result.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  <button onClick={() => setPage(Page.StudentAnswerDetail, { result: result, examId: activeExam.id })} className="text-indigo-600 hover:underline text-left">
                                    {`${result.student.prefix}${result.student.firstName} ${result.student.lastName}`}
                                  </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${result.student.grade.replace('มัธยมศึกษาปีที่ ', 'ม.')}/${result.student.room}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.student.number}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{result.score} / {result.total}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(result.submittedAt).toLocaleString('th-TH', dateLocaleOptions)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                  <button onClick={() => handleDeleteResult(result.id)} className="text-red-600 hover:text-red-900">
                                    <TrashIcon className="w-5 h-5"/>
                                  </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredAndSortedResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>ไม่พบผลการสอบที่ตรงกับเงื่อนไข</p>
                </div>
            )}
        </div>
      </div>
      {modalState?.isOpen && (
        <ConfirmationModal
          title={modalState.title}
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          onCancel={closeModal}
        />
      )}
    </div>
  );
};

export default ExamDashboardPage;
