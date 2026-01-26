
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, Exam, Question } from '../types';
import { generateQuestions } from '../services/geminiService';
import { AIGenerateIcon, TrashIcon } from '../components/Icons';

/**
 * Creates a deep copy of an Exam object, ensuring it's a plain JavaScript object
 * without any circular references from Firestore class instances.
 * @param exam The exam object to copy.
 * @returns A clean, deep-copied Exam object.
 */
const deepCopyExam = (exam: Exam): Exam => {
    return {
        id: exam.id,
        teacherId: exam.teacherId,
        subject: exam.subject,
        title: exam.title,
        questions: exam.questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            options: [...q.options], // Deep copy the options array
            correctAnswerIndex: q.correctAnswerIndex,
        })),
        totalQuestions: exam.totalQuestions,
        timeLimit: exam.timeLimit,
        minSubmitTime: exam.minSubmitTime,
        isActive: exam.isActive,
        examCode: exam.examCode,
        requireFullscreen: exam.requireFullscreen,
        restrictedRoom: exam.restrictedRoom,
    };
};

const CreateEditExamPage: React.FC = () => {
    const { activeExam, loggedInUser, updateExam, addExam, setPage, exams, returnPath, goBack } = useAppContext();

    const [localExam, setLocalExam] = useState<Exam | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Other UI-specific states
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');
    const [isMinTimeEnabled, setIsMinTimeEnabled] = useState(false);


    const generateUniqueCode = (): string => {
        const sanitize = (code: string): string => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        let newCode = '';
        let isUnique = false;
        while (!isUnique) {
            newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            isUnique = !exams.some(ex => sanitize(ex.examCode) === newCode);
        }
        return newCode;
    };

    // Initialize local state from activeExam or create a new one
    useEffect(() => {
        if (activeExam) { // EDIT MODE
            const examCopy = deepCopyExam(activeExam);
            setLocalExam(examCopy);
            setIsMinTimeEnabled(examCopy.minSubmitTime > 0);
        } else { // CREATE MODE
            if (loggedInUser && loggedInUser !== 'admin') {
                const teacher = loggedInUser;
                const initialSubject = returnPath?.context?.subject || 'รายวิชาใหม่';
                const newExamData: Exam = {
                    id: '', // Empty ID signifies a new, unsaved exam
                    teacherId: teacher.id,
                    subject: initialSubject,
                    title: 'แบบทดสอบที่ยังไม่มีชื่อ',
                    questions: [],
                    totalQuestions: 0,
                    timeLimit: 10,
                    minSubmitTime: 0,
                    isActive: false,
                    examCode: generateUniqueCode(),
                    requireFullscreen: false,
                    restrictedRoom: '',
                };
                setLocalExam(newExamData);
                setIsMinTimeEnabled(newExamData.minSubmitTime > 0);
            } else {
                setPage(Page.TeacherLogin); // Safeguard
            }
        }
    }, [activeExam, loggedInUser, returnPath, setPage]);

    const handleFinishAndSave = async () => {
        if (!localExam || isSaving) return;

        setIsSaving(true);
        try {
            const examToSave = { ...localExam };

            // Data validation
            if (examToSave.questions.length > 0 && examToSave.totalQuestions > examToSave.questions.length) {
                examToSave.totalQuestions = examToSave.questions.length;
            } else if (examToSave.questions.length === 0) {
                examToSave.totalQuestions = 0;
            }
            if (examToSave.minSubmitTime > examToSave.timeLimit) {
                examToSave.minSubmitTime = examToSave.timeLimit;
            }

            if (examToSave.id) { // EDIT mode
                await updateExam(examToSave);
            } else { // CREATE mode
                const { id, ...newExamData } = examToSave; // Exclude empty id
                await addExam(newExamData);
            }

            // After saving, navigate directly to the TeacherDashboard with the
            // (potentially new) subject selected. This ensures the user lands
            // in the correct folder view.
            setPage(Page.TeacherDashboard, { subject: examToSave.subject });

        } catch (error) {
            console.error("Error saving exam:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อสอบ");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        goBack();
    };

    const handleFieldChange = (field: keyof Omit<Exam, 'id'>, value: any) => {
        setLocalExam(prev => prev ? { ...prev, [field]: value } : null);
    };

    const sanitizeCode = (code: string): string => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const handleGenerateNewCodeClick = () => {
        handleFieldChange('examCode', generateUniqueCode());
    };

    const handleAddQuestion = () => {
        const newQuestion: Question = {
            id: `q-${Date.now()}`,
            questionText: '',
            options: ['', '', '', ''],
            correctAnswerIndex: 0,
        };
        handleFieldChange('questions', [...(localExam?.questions || []), newQuestion]);
    };

    const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
        if (!localExam) return;
        const newQuestions = [...localExam.questions];
        const questionToUpdate = { ...newQuestions[index] };

        if (field === 'options') {
            const { optionIndex, optionValue } = value;
            questionToUpdate.options[optionIndex] = optionValue;
        } else {
            (questionToUpdate as any)[field] = value;
        }
        newQuestions[index] = questionToUpdate;
        handleFieldChange('questions', newQuestions);
    };

    const handleDeleteQuestion = (id: string) => {
        if (!localExam) return;
        const updatedQuestions = localExam.questions.filter(q => q.id !== id);
        handleFieldChange('questions', updatedQuestions);
    };

    const handleAIGenerate = async () => {
        if (!aiTopic || aiCount <= 0) return;
        setIsGenerating(true);
        setAiError('');
        try {
            const newQuestionsData = await generateQuestions(aiTopic, aiCount);
            const newQuestions: Question[] = newQuestionsData.map(q => ({
                ...q,
                id: `q-${Date.now()}-${Math.random()}`,
            }));
            handleFieldChange('questions', [...(localExam?.questions || []), ...newQuestions]);
        } catch (error: any) {
            setAiError(error.message || 'เกิดข้อผิดพลาดในการสร้างข้อสอบ');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!localExam) {
        return <div className="min-h-screen flex items-center justify-center"><p>กำลังเตรียมหน้าแก้ไข...</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{localExam.id ? 'แก้ไขชุดข้อสอบ' : 'สร้างชุดข้อสอบใหม่'}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 shadow-md disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleFinishAndSave}
                            disabled={isSaving}
                            className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 shadow-md disabled:bg-indigo-300 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </div>
                </header>
                <div>
                    <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">ข้อมูลทั่วไป</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">วิชา</label>
                                <input
                                    type="text"
                                    value={localExam.subject}
                                    onChange={e => handleFieldChange('subject', e.target.value)}
                                    required
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">หัวข้อสอบ</label>
                                <input type="text" value={localExam.title} onChange={e => handleFieldChange('title', e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">จำนวนข้อที่จะสอบจริง</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={localExam.questions.length}
                                    value={localExam.totalQuestions || ''}
                                    onChange={e => handleFieldChange('totalQuestions', Number(e.target.value))}
                                    required
                                    disabled={localExam.questions.length === 0}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                                {localExam.questions.length < localExam.totalQuestions && <p className="text-xs text-red-500 mt-1">คลังข้อสอบมีไม่พอ</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">เวลาในการสอบ (นาที)</label>
                                <input type="number" min="1" value={localExam.timeLimit || ''} onChange={e => handleFieldChange('timeLimit', Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <input
                                        type="checkbox"
                                        id="useMinSubmitTime"
                                        checked={isMinTimeEnabled}
                                        onChange={e => {
                                            const checked = e.target.checked;
                                            setIsMinTimeEnabled(checked);
                                            if (!checked) {
                                                handleFieldChange('minSubmitTime', 0);
                                            } else if (localExam.minSubmitTime <= 0) {
                                                handleFieldChange('minSubmitTime', 1);
                                            }
                                        }}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 bg-white"
                                    />
                                    <label htmlFor="useMinSubmitTime" className="block text-sm font-medium text-gray-700">
                                        กำหนดเวลาส่งขั้นต่ำ (นาที)
                                    </label>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    max={localExam.timeLimit}
                                    value={localExam.minSubmitTime || ''}
                                    onChange={e => handleFieldChange('minSubmitTime', Number(e.target.value))}
                                    required
                                    disabled={!isMinTimeEnabled}
                                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" />
                                {localExam.minSubmitTime > localExam.timeLimit && <p className="text-xs text-red-500 mt-1">เวลาส่งขั้นต่ำต้องไม่เกินเวลาสอบ</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">จำกัดห้องที่เข้าสอบ (เลือกเฉพาะถ้าต้องการล็อคห้อง)</label>
                                <select
                                    value={localExam.restrictedRoom || ''}
                                    onChange={e => handleFieldChange('restrictedRoom', e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                                >
                                    <option value="">ทุกห้อง (ไม่จำกัด)</option>
                                    {Array.from({ length: 15 }, (_, i) => (i + 1).toString()).map(r => (
                                        <option key={r} value={r}>ห้อง {r}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end pb-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="requireFullscreen"
                                        checked={localExam.requireFullscreen}
                                        onChange={(e) => handleFieldChange('requireFullscreen', e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 bg-white"
                                    />
                                    <label htmlFor="requireFullscreen" className="block text-sm font-medium text-gray-700">
                                        บังคับทำข้อสอบแบบเต็มจอ (แนะนำให้ใช้บนคอมพิวเตอร์)
                                    </label>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">รหัสเข้าสอบ</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="text"
                                        value={localExam.examCode}
                                        onChange={e => handleFieldChange('examCode', sanitizeCode(e.target.value))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 font-mono tracking-widest text-center" />
                                    <button type="button" onClick={handleGenerateNewCodeClick} className="bg-gray-200 hover:bg-gray-300 text-sm font-medium text-gray-700 py-2 px-4 rounded-md flex-shrink-0 whitespace-nowrap">สร้างรหัสใหม่</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-xl shadow-lg mb-6 border-2 border-dashed border-indigo-200 text-center">
                        <h2 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center justify-center"><AIGenerateIcon className="w-6 h-6 mr-2" />สร้างข้อสอบด้วย AI</h2>
                        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                            <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="ระบุเนื้อหา" className="flex-grow px-4 py-2 bg-white border border-gray-300 rounded-lg w-full md:w-auto" />
                            <div className="flex items-center gap-2">
                                <label className="whitespace-nowrap">จำนวนข้อ:</label>
                                <input type="number" min="1" value={aiCount || ''} onChange={e => setAiCount(Number(e.target.value))} className="w-24 px-4 py-2 bg-white border border-gray-300 rounded-lg text-center" />
                            </div>
                            <button type="button" onClick={handleAIGenerate} disabled={isGenerating || !aiTopic} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 w-full md:w-auto disabled:bg-indigo-300">{isGenerating ? 'กำลังสร้าง...' : 'สร้างข้อสอบ'}</button>
                        </div>
                        {aiError && <p className="text-sm text-red-600 mt-3">{aiError}</p>}
                    </div>


                    <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                        <div className="mb-4 border-b pb-2"><h2 className="text-xl font-semibold text-gray-800">คลังข้อสอบ ({localExam.questions.length} ข้อ)</h2></div>
                        {localExam.questions.map((q, i) => (
                            <div key={q.id} className="border p-4 rounded-lg mb-4 bg-gray-50 relative">
                                <button type="button" onClick={() => handleDeleteQuestion(q.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">คำถามที่ {i + 1}</label>
                                    <textarea value={q.questionText} onChange={e => handleQuestionChange(i, 'questionText', e.target.value)} rows={2} required className="w-full p-2 bg-white border rounded-md" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {['ก', 'ข', 'ค', 'ง'].map((_, optIndex) => (
                                        <div key={optIndex} className="flex items-center">
                                            <input type="radio" name={`correct-answer-${q.id}`} checked={q.correctAnswerIndex === optIndex} onChange={() => handleQuestionChange(i, 'correctAnswerIndex', optIndex)} className="mr-2 h-4 w-4 text-indigo-600" />
                                            <input type="text" value={q.options[optIndex]} onChange={e => handleQuestionChange(i, 'options', { optionIndex: optIndex, optionValue: e.target.value })} required className={`w-full p-2 border rounded-md bg-white ${q.correctAnswerIndex === optIndex ? 'border-green-500 bg-green-50' : ''}`} placeholder={`ตัวเลือก ${['ก', 'ข', 'ค', 'ง'][optIndex]}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddQuestion} className="mt-4 border-2 border-dashed border-gray-300 text-gray-500 w-full py-2 rounded-lg hover:bg-gray-100 hover:border-gray-400">+ เพิ่มข้อสอบด้วยตนเอง</button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreateEditExamPage;
