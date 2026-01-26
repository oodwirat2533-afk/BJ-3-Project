import React, { useState } from 'react';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import { Page } from '../types';
import { db as currentDb } from '../services/firebaseConfig';
import { WarningIcon } from '../components/Icons';

// Helper to download JSON
const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const MigrationPage: React.FC = () => {
    const { setPage } = useAppContext();
    const [oldConfigStr, setOldConfigStr] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [backupFile, setBackupFile] = useState<File | null>(null);

    const handleExport = async () => {
        setError('');
        setStatus('กำลังเชื่อมต่อกับฐานข้อมูลเก่า...');
        let oldApp: FirebaseApp | null = null;

        try {
            // 1. Parse Config
            // 1. Parse Config
            let cleanConfigComp = oldConfigStr.replace(/const firebaseConfig =/g, '').replace(/;/g, '').trim();

            // Auto-add braces if user forgot them
            if (!cleanConfigComp.startsWith('{')) {
                cleanConfigComp = `{ ${cleanConfigComp} }`;
            }

            // Safe evaluation of JS object string
            const oldConfig = new Function(`return ${cleanConfigComp}`)();

            // 2. Initialize Old App
            oldApp = initializeApp(oldConfig, 'OLD_APP_MIGRATION_' + Date.now());
            const oldDb = getFirestore(oldApp);

            // 3. Fetch Data
            setStatus('กำลังดึงข้อมูล Teachers...');
            const teachersSnap = await getDocs(collection(oldDb, 'teachers'));
            const teachers = teachersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            setStatus('กำลังดึงข้อมูล Exams...');
            const examsSnap = await getDocs(collection(oldDb, 'exams'));
            const exams = examsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            setStatus('กำลังดึงข้อมูล Results...');
            const resultsSnap = await getDocs(collection(oldDb, 'results'));
            const results = resultsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            const backupData = { teachers, exams, results };

            // 4. Download
            setStatus('ดาวน์โหลดไฟล์ backup.json...');
            downloadJson(backupData, 'backup-bj3-legacy.json');
            setStatus('เสร็จสิ้น! กรุณาดำเนินการขั้นตอนที่ 2 ต่อ');

        } catch (err: any) {
            console.error(err);
            setError('เกิดข้อผิดพลาด: ' + err.message + '\n(ตรวจสอบว่า Config ถูกต้องและเป็น JSON format)');
        } finally {
            if (oldApp) deleteApp(oldApp);
        }
    };

    const handleImport = async () => {
        if (!backupFile) {
            setError('กรุณาเลือกไฟล์ Backup ก่อน');
            return;
        }
        setError('');
        setStatus('กำลังอ่านไฟล์...'); // Fixed status text

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                if (!data.teachers || !data.exams) {
                    throw new Error('ไฟล์ไม่ถูกต้อง (ไม่มี teachers หรือ exams)');
                }

                // Upload Logic
                const batch = writeBatch(currentDb);
                let count = 0;
                const BATCH_LIMIT = 400; // Firebase limit is 500

                // Helper to commit and reset batch
                const checkBatch = async () => {
                    count++;
                    if (count >= BATCH_LIMIT) {
                        await batch.commit();
                        count = 0;
                    }
                };

                setStatus('กำลังอัปโหลดข้อมูล Teachers...');
                for (const t of data.teachers) {
                    batch.set(doc(currentDb, 'teachers', t.id), t);
                    await checkBatch();
                }

                setStatus('กำลังอัปโหลดข้อมูล Exams...');
                for (const item of data.exams) {
                    batch.set(doc(currentDb, 'exams', item.id), item);
                    await checkBatch();
                }

                setStatus('กำลังอัปโหลดข้อมูล Results...');
                for (const item of data.results) {
                    // Fix timestamps if they are strings
                    if (item.submittedAt && typeof item.submittedAt === 'string') {
                        // Convert back if needed, or just save as string/timestamp
                        // Firestore handles JS Date objects in set()
                        // item.submittedAt = new Date(item.submittedAt);
                    }
                    batch.set(doc(currentDb, 'results', item.id), item);
                    await checkBatch();
                }

                await batch.commit(); // Final commit
                setStatus('✅ ย้ายข้อมูลเสร็จสมบูรณ์! คุณสามารถกลับไปหน้าหลักได้เลย');

            } catch (err: any) {
                setError('Import Error: ' + err.message);
            }
        };
        reader.readAsText(backupFile);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl">
                <h1 className="text-3xl font-bold mb-6 text-indigo-700">ระบบย้ายข้อมูล (Migration Tool)</h1>

                {/* Step 1 */}
                <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
                    <h2 className="text-xl font-semibold mb-4 text-blue-800">1. ดึงข้อมูลเก่า (Export)</h2>
                    <p className="mb-2 text-sm text-blue-600">นำ Config ของโปรเจกต์เก่า (bj-3-53fff) มาวางที่นี่ (เฉพาะในวงเล็บปีกกา)</p>
                    <textarea
                        className="w-full h-32 p-3 border rounded font-mono text-sm mb-4"
                        placeholder='{ "apiKey": "...", "projectId": "bj-3-53fff", ... }'
                        value={oldConfigStr}
                        onChange={e => setOldConfigStr(e.target.value)}
                    />
                    <button
                        onClick={handleExport}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold"
                    >
                        ⬇️ ดึงข้อมูลและโหลดไฟล์ Backup
                    </button>
                </div>

                <div className="border-t border-gray-200 my-8"></div>

                {/* Step 2 */}
                <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-100">
                    <h2 className="text-xl font-semibold mb-4 text-green-800">2. นำเข้าข้อมูลใหม่ (Import)</h2>
                    <p className="mb-2 text-sm text-green-600">เลือกไฟล์ <code>backup-bj3-legacy.json</code> ที่ได้จากขั้นตอนที่ 1</p>
                    <input
                        type="file"
                        accept=".json"
                        onChange={e => setBackupFile(e.target.files ? e.target.files[0] : null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 mb-4"
                    />
                    <button
                        onClick={handleImport}
                        disabled={!backupFile}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold disabled:opacity-50"
                    >
                        ⬆️ อัปโหลดข้อมูลเข้าสู่ระบบใหม่
                    </button>
                </div>

                {/* Status Area */}
                {status && (
                    <div className="mb-4 p-4 bg-gray-100 rounded text-center font-semibold text-indigo-600">
                        {status}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 rounded text-red-600 flex items-center">
                        <WarningIcon className="w-6 h-6 mr-2" />
                        {error}
                    </div>
                )}

                <button onClick={() => setPage(Page.Home)} className="text-gray-500 hover:text-gray-800 underline mt-4 w-full text-center">
                    กลับไปหน้าหลัก
                </button>
            </div>
        </div>
    );
};

export default MigrationPage;
