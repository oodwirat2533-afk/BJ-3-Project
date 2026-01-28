
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page } from '../types';
import { TeacherIcon, AdminIcon } from '../components/Icons';

const StaffLoginPage: React.FC = () => {
    const { login, setPage, teachers, addTeacher, authenticateTeacher, authenticateAdmin } = useAppContext();
    const [isLogin, setIsLogin] = useState(true);

    // Unified Login state
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Signup state
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [signupMessage, setSignupMessage] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check for Admin Login
        // Note: User can use 'admin' or their email. Admin uses 'admin' as username.
        if (usernameOrEmail.trim().toLowerCase() === 'admin') {
            if (authenticateAdmin(password)) {
                login('admin');
                return;
            } else {
                setError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
                return;
            }
        }

        // Check for Teacher Login
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

        addTeacher({ name: signupName, email: signupEmail, password: signupPassword });
        setSignupMessage('การสมัครเสร็จสมบูรณ์! กรุณารอผู้ดูแลระบบอนุมัติ');
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupConfirmPassword('');
        setTimeout(() => {
            setIsLogin(true);
            setSignupMessage('');
            setError('');
        }, 3000)
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center space-x-2">
                            <TeacherIcon className="h-10 w-10 text-indigo-500" />
                            <AdminIcon className="h-10 w-10 text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mt-4">สำหรับบุคลากร</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {isLogin ? 'เข้าสู่ระบบครูหรือผู้ดูแลระบบ' : 'สมัครสมาชิกสำหรับการใช้งานครู'}
                        </p>
                    </div>

                    {isLogin ? (
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                                    ชื่อผู้ใช้ หรือ อีเมล
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={usernameOrEmail}
                                    onChange={(e) => { setUsernameOrEmail(e.target.value); setError(''); }}
                                    className="shadow-sm appearance-none border rounded w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                    placeholder="admin หรือ email@banhan3.ac.th"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                                    รหัสผ่าน
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    className="shadow-sm appearance-none border rounded w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                            <div className="flex flex-col items-center justify-between space-y-4">
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all transform hover:scale-[1.02] active:scale-95 shadow-md">
                                    เข้าสู่ระบบ
                                </button>
                                <p className="text-sm">
                                    คุณครูที่ยังไม่มีบัญชี? <button type="button" onClick={() => { setIsLogin(false); setError('') }} className="font-bold text-indigo-600 hover:underline">สมัครใช้งานที่นี่</button>
                                </p>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSignup}>
                            {signupMessage && <p className="text-green-600 bg-green-100 p-3 rounded-lg text-center text-sm mb-4">{signupMessage}</p>}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="signup-name">
                                    ชื่อ-นามสกุล
                                </label>
                                <input
                                    id="signup-name"
                                    type="text"
                                    value={signupName}
                                    onChange={(e) => setSignupName(e.target.value)}
                                    className="shadow-sm appearance-none border rounded w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="signup-email">
                                    อีเมล
                                </label>
                                <input
                                    id="signup-email"
                                    type="email"
                                    value={signupEmail}
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                    className="shadow-sm appearance-none border rounded w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="signup-password">
                                    รหัสผ่าน (อย่างน้อย 4 ตัวอักษร)
                                </label>
                                <input
                                    id="signup-password"
                                    type="password"
                                    value={signupPassword}
                                    onChange={(e) => setSignupPassword(e.target.value)}
                                    className="shadow-sm appearance-none border rounded w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="signup-confirm-password">
                                    ยืนยันรหัสผ่าน
                                </label>
                                <input
                                    id="signup-confirm-password"
                                    type="password"
                                    value={signupConfirmPassword}
                                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                    className="shadow-sm appearance-none border rounded w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                    required
                                />
                            </div>
                            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                            <div className="flex flex-col items-center justify-between space-y-4">
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all transform hover:scale-[1.02] active:scale-95 shadow-md">
                                    สมัครใช้งาน
                                </button>
                                <p className="text-sm">
                                    มีบัญชีแล้ว? <button type="button" onClick={() => { setIsLogin(true); setError('') }} className="font-bold text-indigo-600 hover:underline">เข้าสู่ระบบ</button>
                                </p>
                            </div>
                        </form>
                    )}

                    <div className="text-center mt-8 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setPage(Page.Home)}
                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            ← กลับหน้าแรก (สำหรับนักเรียน)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffLoginPage;
