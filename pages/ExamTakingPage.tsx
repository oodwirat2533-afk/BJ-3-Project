
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, Question, StudentAnswer } from '../types';
import useAntiCheat from '../hooks/useAntiCheat';
import useSingletonTab from '../hooks/useSingletonTab';
import { ClockIcon, WarningIcon } from '../components/Icons';
import ConfirmationModal from '../components/ConfirmationModal';

const ExamTakingPage: React.FC = () => {
    const { setPage, activeExam, addResult, activeStudent: student, setNotification } = useAppContext();
    const { isPrimaryTab } = useSingletonTab('exam-session-channel');

    const [isInitialized, setIsInitialized] = useState(false);
    const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<StudentAnswer[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [shuffledOptionOrders, setShuffledOptionOrders] = useState<Record<string, number[]>>({});
    const isSubmitting = useRef(false);
    const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);

    const optionLabels = ['ก', 'ข', 'ค', 'ง'];

    const shuffleArray = <T,>(array: T[]): T[] => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const [localExam, setLocalExam] = useState<typeof activeExam>(null);
    const hasInitialized = useRef(false);

    const submitExam = useCallback(async () => {
        if (!student || !activeExam) return;
        isSubmitting.current = true;
        setShowConfirmModal(false);

        const doc = document as any;
        if (doc.fullscreenElement || doc.webkitFullscreenElement) {
            if (doc.exitFullscreen) {
                doc.exitFullscreen();
            } else if (doc.webkitExitFullscreen) {
                doc.webkitExitFullscreen();
            }
        }

        let score = 0;
        const examData = localExam || activeExam;
        if (!examData) return;

        answers.forEach(answer => {
            const question = examData.questions.find(q => q.id === answer.questionId);
            if (question && question.correctAnswerIndex === answer.selectedAnswerIndex) {
                score++;
            }
        });
        await addResult({
            examId: examData.id,
            student,
            score,
            total: examData.totalQuestions,
            answers
        });
    }, [student, activeExam, localExam, answers, addResult]);

    const startNewTest = useCallback((examToUse: typeof activeExam) => {
        if (examToUse) {
            // 1. Shuffle questions
            const shuffled = shuffleArray(examToUse.questions);
            const selectedQuestions = shuffled.slice(0, examToUse.totalQuestions);

            // 2. Create shuffled order for options for each question
            const newOrders: Record<string, number[]> = {};
            selectedQuestions.forEach((q: Question) => {
                newOrders[q.id] = shuffleArray([0, 1, 2, 3]);
            });
            setShuffledOptionOrders(newOrders);

            setCurrentQuestions(selectedQuestions);
            setAnswers(selectedQuestions.map((q: Question) => ({ questionId: q.id, selectedAnswerIndex: null })));
            setTimeLeft(examToUse.timeLimit * 60);
            setCurrentQuestionIndex(0);
            setIsInitialized(true);
            hasInitialized.current = true;
        }
    }, []);

    useEffect(() => {
        if (!student) {
            setPage(Page.Home);
            return;
        }

        // Initialize from activeExam once and ONLY once
        if (activeExam && !localExam && !hasInitialized.current) {
            setLocalExam(activeExam);
            startNewTest(activeExam);
        }
    }, [activeExam, student, setPage, localExam, startNewTest]);

    const handleReEnterFullscreen = () => {
        const elem = document.documentElement as any;
        const requestFullScreen =
            elem.requestFullscreen ||
            elem.webkitRequestFullscreen ||
            elem.mozRequestFullScreen ||
            elem.msRequestFullscreen;

        if (requestFullScreen) {
            requestFullScreen.call(elem).then(() => {
                setShowFullscreenWarning(false);
            }).catch((err: Error) => {
                alert(`กรุณาอนุญาตให้เข้าสู่โหมดเต็มจอเพื่อทำข้อสอบต่อ (Error: ${err.message})`);
            });
        }
    };

    // Fullscreen enforcement effect for restarting the test
    useEffect(() => {
        if (!activeExam?.requireFullscreen) return;

        const getFullscreenElement = () => {
            const doc = document as any;
            return doc.fullscreenElement ||
                doc.webkitFullscreenElement ||
                doc.mozFullScreenElement ||
                doc.msFullscreenElement;
        }

        const elem = document.documentElement as any;
        const isFullscreenApiSupported =
            elem.requestFullscreen ||
            elem.webkitRequestFullscreen ||
            elem.mozRequestFullScreen ||
            elem.msRequestFullscreen;

        if (!isFullscreenApiSupported) {
            console.warn("Fullscreen API not supported, anti-cheat for fullscreen will be disabled.");
            return;
        }

        const handleFullscreenChange = () => {
            if (isSubmitting.current) return;

            // Only trigger reset if we WERE in fullscreen and now we are NOT.
            // This prevents resets during simple React re-renders.
            if (hasInitialized.current && !getFullscreenElement()) {
                setShowFullscreenWarning(true);
                if (localExam) startNewTest(localExam);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [activeExam?.requireFullscreen, isInitialized, startNewTest]);



    const handleCheating = useCallback(() => {
        if (!hasInitialized.current) return;

        setNotification({
            title: "ตรวจพบการทุจริต",
            message: "คุณออกจากหน้าจอสอบ หรือพยายามทุจริต!\nระบบจะทำการเริ่มข้อสอบใหม่ทันที",
            type: "error"
        });
        if (localExam) startNewTest(localExam);
    }, [localExam, startNewTest, setNotification]);

    useAntiCheat(handleCheating, true);

    // Monitor if teacher closes the exam while student is taking it
    useEffect(() => {
        if (isInitialized && activeExam && activeExam.isActive === false && !isSubmitting.current) {
            submitExam().then(() => {
                setNotification({
                    title: "การสอบถูกปิดแล้ว",
                    message: "คุณครูปิดระบบรับคำตอบแล้ว\nระบบได้ทำการส่งคำตอบให้คุณโดยอัตโนมัติ",
                    type: "info"
                });
            });
        }
    }, [activeExam?.isActive, isInitialized, submitExam, setNotification]);



    useEffect(() => {
        if (!isInitialized) return;
        if (timeLeft <= 0) {
            submitExam();
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isInitialized, submitExam]);

    if (!isPrimaryTab) {
        return (
            <div className="fixed inset-0 bg-red-800 bg-opacity-95 flex flex-col items-center justify-center z-50 text-white p-4">
                <WarningIcon className="w-24 h-24 text-yellow-300 mb-6 animate-pulse" />
                <h1 className="text-4xl font-bold mb-4">ตรวจพบการเปิดหน้าต่างซ้อนกัน</h1>
                <p className="text-xl max-w-2xl text-center">
                    ระบบอนุญาตให้เปิดหน้าต่างข้อสอบได้เพียงหน้าต่างเดียวเท่านั้น
                    กรุณาปิดหน้าต่างนี้แล้วทำข้อสอบในหน้าต่างเดิม
                </p>
            </div>
        );
    }

    if (!activeExam || !student || currentQuestions.length === 0) {
        return null;
    }

    const handleSelectAnswer = (questionId: string, answerIndex: number) => {
        setAnswers(prev => prev.map(ans => ans.questionId === questionId ? { ...ans, selectedAnswerIndex: answerIndex } : ans));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < currentQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const currentQuestion = currentQuestions[currentQuestionIndex];

    const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);
    const isCurrentQuestionAnswered = currentAnswer?.selectedAnswerIndex !== null && currentAnswer?.selectedAnswerIndex !== undefined;

    const minSubmitTimeInSeconds = (activeExam.minSubmitTime || 0) * 60;
    const elapsedTimeInSeconds = (activeExam.timeLimit * 60) - timeLeft;
    const isSubmitAllowed = elapsedTimeInSeconds >= minSubmitTimeInSeconds;
    const remainingMinSubmitTime = Math.ceil((minSubmitTimeInSeconds - elapsedTimeInSeconds) / 60);

    return (
        <>
            {showFullscreenWarning && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center z-[100] text-white p-4">
                    <WarningIcon className="w-24 h-24 text-yellow-300 mb-6" />
                    <h1 className="text-4xl font-bold mb-4">คุณได้ออกจากโหมดเต็มจอ!</h1>
                    <p className="text-xl max-w-2xl text-center mb-8">
                        ระบบได้ทำการเริ่มข้อสอบใหม่ตามกฎการสอบ<br />
                        กรุณาคลิกปุ่มด้านล่างเพื่อกลับเข้าสู่โหมดเต็มจอและทำข้อสอบต่อ
                    </p>
                    <button
                        onClick={handleReEnterFullscreen}
                        className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 text-lg"
                    >
                        กลับเข้าสู่โหมดเต็มจอ
                    </button>
                </div>
            )}
            <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center no-select">
                <div className="w-full max-w-4xl">
                    <header className="bg-white shadow-md rounded-xl p-4 mb-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">วิชา {activeExam.subject}</h1>
                                <p className="text-md text-gray-500">{activeExam.title}</p>
                            </div>
                            <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-2 mt-2 md:mt-0">
                                <p className="text-sm text-gray-600 font-medium">{`${student.prefix}${student.firstName} ${student.lastName}`}</p>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm font-medium">ข้อที่ {currentQuestionIndex + 1} / {activeExam.totalQuestions}</div>
                                    <div className={`flex items-center gap-2 font-bold p-2 rounded-lg ${timeLeft < 60 ? 'text-red-600 bg-red-100' : 'text-indigo-600 bg-indigo-100'}`}>
                                        <ClockIcon className="h-5 w-5" />
                                        <span>{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / activeExam.totalQuestions) * 100}%` }}></div>
                        </div>
                    </header>

                    <main>
                        <div className="bg-white p-6 rounded-xl shadow-lg mb-4 min-h-[300px] flex flex-col justify-center">
                            <p className="font-semibold text-xl mb-4 text-center">{currentQuestionIndex + 1}. {currentQuestion.questionText}</p>
                            <div className="space-y-3">
                                {(shuffledOptionOrders[currentQuestion.id] || [0, 1, 2, 3]).map((originalOptIndex, displayIndex) => {
                                    const answer = answers.find(a => a.questionId === currentQuestion.id);
                                    const isSelected = answer?.selectedAnswerIndex === originalOptIndex;
                                    const optionText = currentQuestion.options[originalOptIndex];

                                    return (
                                        <label key={originalOptIndex} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-100 border-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                            <input
                                                type="radio"
                                                name={currentQuestion.id}
                                                checked={isSelected}
                                                onChange={() => handleSelectAnswer(currentQuestion.id, originalOptIndex)}
                                                className="hidden"
                                            />
                                            <span className={`w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400 bg-white'}`}></span>
                                            {`${optionLabels[displayIndex]}. ${optionText}`}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="mt-8 flex justify-between items-center">
                            {currentQuestionIndex > 0 ? (
                                <button onClick={handlePreviousQuestion} className="bg-gray-200 text-gray-700 font-bold py-3 px-8 sm:px-12 rounded-lg hover:bg-gray-300 shadow-lg transition-transform transform hover:scale-105">
                                    ย้อนกลับ
                                </button>
                            ) : <div />}

                            {currentQuestionIndex < currentQuestions.length - 1 ? (
                                <button onClick={handleNextQuestion} disabled={!isCurrentQuestionAnswered} className="bg-indigo-600 text-white font-bold py-3 px-8 sm:px-12 rounded-lg hover:bg-indigo-700 shadow-xl transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none">
                                    ข้อถัดไป
                                </button>
                            ) : (
                                <div className="relative group">
                                    <button
                                        onClick={() => setShowConfirmModal(true)}
                                        disabled={!isSubmitAllowed}
                                        className="bg-green-600 text-white font-bold py-3 px-8 sm:px-12 rounded-lg hover:bg-green-700 shadow-xl transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                                    >
                                        ส่งคำตอบ
                                    </button>
                                    {!isSubmitAllowed && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            ต้องรออีกประมาณ {remainingMinSubmitTime} นาทีจึงจะส่งได้
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>

                    {showConfirmModal &&
                        <ConfirmationModal
                            title="ยืนยันการส่งข้อสอบ"
                            message="คุณแน่ใจหรือไม่ว่าต้องการส่งคำตอบ?"
                            confirmText="ส่งคำตอบ"
                            onConfirm={submitExam}
                            onCancel={() => setShowConfirmModal(false)}
                            confirmButtonClass="bg-green-600 hover:bg-green-700"
                        />
                    }
                </div>
            </div>
        </>
    );
};

export default ExamTakingPage;
