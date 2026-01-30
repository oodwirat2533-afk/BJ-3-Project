
import React, { useState } from 'react';
import { useAppContext, SUPER_ADMIN_EMAIL } from '../context/AppContext';
import { Teacher, Page } from '../types';
import { AdminIcon, EditIcon, LogoutIcon, TrashIcon, CheckCircleIcon, XCircleIcon, TeacherIcon } from '../components/Icons';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminDashboard: React.FC = () => {
    const { teachers, exams, updateTeacher, deleteTeacher, addTeacher, logout, loggedInUser, setPage } = useAppContext();
    const isSuperAdmin = typeof loggedInUser === 'object' && loggedInUser?.email === SUPER_ADMIN_EMAIL;

    // State for modals
    const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // State for forms
    const [newTeacherName, setNewTeacherName] = useState('');
    const [newTeacherEmail, setNewTeacherEmail] = useState('');
    const [newTeacherSchool, setNewTeacherSchool] = useState('');
    const [newTeacherPassword, setNewTeacherPassword] = useState('1234');

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTeacherName && newTeacherEmail && newTeacherPassword) {
            if (newTeacherPassword.length < 4) {
                alert("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
                return;
            }
            await addTeacher({
                name: newTeacherName,
                email: newTeacherEmail,
                password: newTeacherPassword,
                schoolName: newTeacherSchool
            });
            closeAddTeacherModal();
        }
    };

    const handleUpdateTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTeacher) {
            if (editingTeacher.password.length < 4) {
                alert("รหัสผ่านของครูต้องมีอย่างน้อย 4 ตัวอักษร");
                return;
            }
            await updateTeacher(editingTeacher);
            setEditingTeacher(null);
        }
    };

    const closeAddTeacherModal = () => {
        setIsAddTeacherModalOpen(false);
        setNewTeacherName('');
        setNewTeacherEmail('');
        setNewTeacherSchool('');
        setNewTeacherPassword('1234');
    }

    const confirmDeleteTeacher = async () => {
        if (teacherToDelete) {
            await deleteTeacher(teacherToDelete.id);
            setTeacherToDelete(null);
        }
    };

    const handleLogoutConfirm = () => {
        logout();
        setIsLogoutModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col items-start md:flex-row md:justify-between md:items-center mb-8 gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-2.5 rounded-xl">
                        <AdminIcon className="h-10 w-10 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">แผงควบคุมผู้ดูแลระบบ</h1>
                        <p className="text-gray-500 mt-2">จัดการบัญชีผู้ใช้งานครูและตั้งค่าระบบ</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button onClick={() => setIsAddTeacherModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-3 md:py-2.5 rounded-xl shadow-lg transition-all active:scale-95">
                        <span>+ เพิ่มครูใหม่</span>
                    </button>
                    {isSuperAdmin && (
                        <button onClick={() => setPage(Page.TeacherDashboard)} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-5 py-3 md:py-2.5 rounded-xl border border-indigo-200 transition-all active:scale-95">
                            <TeacherIcon className="h-5 w-5" />
                            <span>แผงควบคุมครู</span>
                        </button>
                    )}
                    <button onClick={() => setIsLogoutModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-bold text-gray-700 hover:text-red-600 bg-white px-5 py-3 md:py-2.5 rounded-xl shadow-sm border border-gray-200 transition-all active:scale-95">
                        <LogoutIcon className="h-5 w-5" />
                        <span>ออก</span>
                    </button>
                </div>
            </header>

            {/* Teacher List Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 sm:p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">รายชื่อครู</h2>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมล</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">โรงเรียน</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนชุดข้อสอบ</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">การกระทำ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {teachers.map(teacher => {
                                    const examCount = exams.filter(exam => exam.teacherId === teacher.id).length;
                                    return (
                                        <tr key={teacher.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.schoolName || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{examCount} ชุด</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${teacher.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                >
                                                    {teacher.approved ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3">
                                                {teacher.approved ? (
                                                    <button onClick={() => updateTeacher({ ...teacher, approved: false })} className="text-yellow-500 hover:text-yellow-700 inline-block align-middle" title="ยกเลิกอนุมัติ">
                                                        <XCircleIcon className="w-6 h-6" />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => updateTeacher({ ...teacher, approved: true })} className="text-green-500 hover:text-green-700 inline-block align-middle" title="อนุมัติ">
                                                        <CheckCircleIcon className="w-6 h-6" />
                                                    </button>
                                                )}
                                                <button onClick={() => setEditingTeacher(teacher)} className="text-indigo-600 hover:text-indigo-900 inline-block align-middle"><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={() => setTeacherToDelete(teacher)} className="text-red-600 hover:text-red-900 inline-block align-middle"><TrashIcon className="w-5 h-5" /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="md:hidden space-y-4">
                        {teachers.map(teacher => {
                            const examCount = exams.filter(exam => exam.teacherId === teacher.id).length;
                            return (
                                <div key={teacher.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 shadow-sm transition-all hover:bg-white hover:shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <p className="text-lg font-bold text-gray-900 leading-tight">{teacher.name}</p>
                                            <p className="text-sm text-gray-500">{teacher.email}</p>
                                            <p className="text-xs text-gray-400 mt-1">{teacher.schoolName || 'ไม่มีข้อมูลโรงเรียน'}</p>
                                        </div>
                                        <span
                                            className={`ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${teacher.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                        >
                                            {teacher.approved ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4 bg-white p-2 rounded border border-gray-100">
                                        <span>จํานวนข้อสอบ:</span>
                                        <span className="font-semibold text-indigo-600">{examCount} ชุด</span>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                                        {teacher.approved ? (
                                            <button
                                                onClick={() => updateTeacher({ ...teacher, approved: false })}
                                                className="flex items-center gap-1.5 text-xs font-bold text-yellow-600 hover:text-yellow-700 bg-yellow-50 px-2 py-1.5 rounded"
                                            >
                                                <XCircleIcon className="w-4 h-4" />
                                                ยกเลิกอนุมัติ
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => updateTeacher({ ...teacher, approved: true })}
                                                className="flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-2 py-1.5 rounded"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" />
                                                อนุมัติ
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setEditingTeacher(teacher)}
                                            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1.5 rounded"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                            แก้ไข
                                        </button>
                                        <button
                                            onClick={() => setTeacherToDelete(teacher)}
                                            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-2 py-1.5 rounded"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            ลบ
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Add Teacher Modal */}
            {isAddTeacherModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">เพิ่มครูใหม่</h2>
                            <button onClick={closeAddTeacherModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleAddTeacher}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                                <input type="text" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" placeholder="สมชาย ใจดี" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                                <input type="email" value={newTeacherEmail} onChange={e => setNewTeacherEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" placeholder="somchai@example.com" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">ชื่อโรงเรียน</label>
                                <input type="text" value={newTeacherSchool} onChange={e => setNewTeacherSchool(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" placeholder="เช่น โรงเรียนไทยวิทยา" />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700">รหัสผ่านเริ่มต้น</label>
                                <input type="text" value={newTeacherPassword} onChange={e => setNewTeacherPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" required />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={closeAddTeacherModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">ยกเลิก</button>
                                <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700">เพิ่มครู</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Teacher Modal */}
            {editingTeacher && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">แก้ไขข้อมูลครู</h2>
                            <button onClick={() => setEditingTeacher(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateTeacher}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                                <input type="text" value={editingTeacher.name} onChange={e => setEditingTeacher({ ...editingTeacher, name: e.target.value })} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                                <input type="email" value={editingTeacher.email} onChange={e => setEditingTeacher({ ...editingTeacher, email: e.target.value })} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">ชื่อโรงเรียน</label>
                                <input type="text" value={editingTeacher.schoolName || ''} onChange={e => setEditingTeacher({ ...editingTeacher, schoolName: e.target.value })} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
                                <input type="text" value={editingTeacher.password} onChange={e => setEditingTeacher({ ...editingTeacher, password: e.target.value })} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setEditingTeacher(null)} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">ยกเลิก</button>
                                <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {teacherToDelete && (
                <ConfirmationModal
                    title="ยืนยันการลบครู"
                    message={`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ "${teacherToDelete.name}"? ข้อสอบและผลการสอบทั้งหมดของครูท่านนี้จะถูกลบออกด้วยถาวร และการกระทำนี้ไม่สามารถย้อนกลับได้`}
                    onConfirm={confirmDeleteTeacher}
                    onCancel={() => setTeacherToDelete(null)}
                />
            )}

            {isLogoutModalOpen && (
                <ConfirmationModal
                    title="ยืนยันการออกจากระบบ"
                    message="คุณต้องการออกจากระบบใช่หรือไม่?"
                    confirmText="ออกจากระบบ"
                    onConfirm={handleLogoutConfirm}
                    onCancel={() => setIsLogoutModalOpen(false)}
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}
        </div>
    );
};

export default AdminDashboard;