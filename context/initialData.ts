
import { Teacher, Exam, Question, ExamResult } from '../types';

export const initialTeachers: Teacher[] = [
  {
    id: 't-1',
    name: 'วิรัตน์ ธีรพิพัฒนปัญญา',
    email: 'wirat@banhan3.ac.th',
    approved: true,
    password: 'password123',
  },
  {
    id: 't-2',
    name: 'สมศรี มีชัย',
    email: 'somsri@test.com',
    approved: false,
    password: 'password456',
  },
];

const sampleAIQuestions: Question[] = [
    { id: 'q-1', questionText: 'ข้อใดคือส่วนประกอบหลักของคอมพิวเตอร์ที่ทำหน้าที่ประมวลผล', options: ['จอภาพ', 'ซีพียู', 'เมาส์', 'คีย์บอร์ด'], correctAnswerIndex: 1 },
    { id: 'q-2', questionText: 'อุปกรณ์ใดใช้สำหรับเก็บข้อมูลแบบถาวร', options: ['แรม', 'ฮาร์ดดิสก์', 'ซีพียู', 'การ์ดจอ'], correctAnswerIndex: 1 },
    { id: 'q-3', questionText: 'ซอฟต์แวร์ประเภทใดที่ใช้สำหรับจัดการระบบทั้งหมดของคอมพิวเตอร์', options: ['ซอฟต์แวร์ประยุกต์', 'ซอฟต์แวร์ระบบ', 'ไดรเวอร์', 'เว็บเบราว์เซอร์'], correctAnswerIndex: 1 },
    { id: 'q-4', questionText: '1 กิกะไบต์ (GB) มีค่าเท่ากับกี่เมกะไบต์ (MB)', options: ['100 MB', '1024 MB', '1000 KB', '1024 KB'], correctAnswerIndex: 1 },
    { id: 'q-5', questionText: 'HTML ย่อมาจากอะไร', options: ['HyperText Markup Language', 'High-level Text Management Language', 'Hyperlink and Text Markup Language', 'Home Tool Markup Language'], correctAnswerIndex: 0 },
    { id: 'q-6', questionText: 'ข้อใดคือหน้าที่หลักของ RAM', options: ['เก็บข้อมูลถาวร', 'แสดงผลภาพ', 'เป็นหน่วยความจำหลักชั่วคราว', 'ควบคุมการทำงานของเมาส์'], correctAnswerIndex: 2 },
    { id: 'q-7', questionText: 'ภาษาโปรแกรมใดที่นิยมใช้ในการพัฒนาเว็บไซต์ฝั่ง Client-side', options: ['Java', 'Python', 'JavaScript', 'C++'], correctAnswerIndex: 2 },
    { id: 'q-8', questionText: 'ไวรัสคอมพิวเตอร์คืออะไร', options: ['อุปกรณ์ฮาร์ดแวร์', 'โปรแกรมที่ช่วยให้คอมพิวเตอร์เร็วขึ้น', 'โปรแกรมที่สร้างความเสียหายให้กับข้อมูลหรือระบบ', 'ระบบปฏิบัติการชนิดหนึ่ง'], correctAnswerIndex: 2 },
    { id: 'q-9', questionText: 'URL ย่อมาจากอะไร', options: ['Universal Resource Locator', 'Uniform Resource Locator', 'Universal Resource Link', 'Uniform Resource Link'], correctAnswerIndex: 1 },
    { id: 'q-10', questionText: 'การเชื่อมต่ออินเทอร์เน็ตแบบไร้สายเรียกว่าอะไร', options: ['LAN', 'Wi-Fi', 'WAN', 'Bluetooth'], correctAnswerIndex: 1 },
    { id: 'q-11', questionText: 'ข้อใดคือ Input Device', options: ['ลำโพง', 'เครื่องพิมพ์', 'ไมโครโฟน', 'จอภาพ'], correctAnswerIndex: 2 },
    { id: 'q-12', questionText: 'ข้อใดคือ Output Device', options: ['สแกนเนอร์', 'เมาส์', 'คีย์บอร์ด', 'โปรเจคเตอร์'], correctAnswerIndex: 3 },
    { id: 'q-13', questionText: 'ระบบปฏิบัติการ (OS) ใดที่เป็น Open-source', options: ['Windows', 'macOS', 'Linux', 'iOS'], correctAnswerIndex: 2 },
    { id: 'q-14', questionText: 'Firewall มีหน้าที่อะไร', options: ['ป้องกันไวรัส', 'จัดการไฟล์', 'ป้องกันการเข้าถึงที่ไม่ได้รับอนุญาต', 'เพิ่มความเร็วอินเทอร์เน็ต'], correctAnswerIndex: 2 },
    { id: 'q-15', questionText: 'Cloud Computing คืออะไร', options: ['การประมวลผลบนคอมพิวเตอร์ส่วนตัว', 'การใช้บริการคอมพิวเตอร์ผ่านอินเทอร์เน็ต', 'การเก็บข้อมูลใน Flash Drive', 'เครือข่ายคอมพิวเตอร์ขนาดเล็ก'], correctAnswerIndex: 1 },
    { id: 'q-16', questionText: 'Database คืออะไร', options: ['โปรแกรมวาดรูป', 'ระบบเก็บข้อมูลอย่างมีโครงสร้าง', 'โปรแกรมเล่นสื่อ', 'ภาษาโปรแกรม'], correctAnswerIndex: 1 },
    { id: 'q-17', questionText: 'อัลกอริทึม (Algorithm) คืออะไร', options: ['ชื่อของโปรแกรม', 'ชุดคำสั่งที่เป็นขั้นตอนในการแก้ปัญหา', 'ภาษาที่คอมพิวเตอร์เข้าใจ', 'อุปกรณ์อิเล็กทรอนิกส์'], correctAnswerIndex: 1 },
    { id: 'q-18', questionText: '".docx" เป็นนามสกุลของไฟล์ประเภทใด', options: ['รูปภาพ', 'เอกสาร', 'วิดีโอ', 'เสียง'], correctAnswerIndex: 1 },
    { id: 'q-19', questionText: 'โปรแกรมใดใช้สำหรับสร้างตารางคำนวณ', options: ['Microsoft Word', 'Microsoft PowerPoint', 'Microsoft Excel', 'Notepad'], correctAnswerIndex: 2 },
    { id: 'q-20', questionText: 'การ "บีบอัดไฟล์" (File Compression) มีประโยชน์อย่างไร', options: ['ทำให้ไฟล์มีขนาดเล็กลง', 'ทำให้ไฟล์ปลอดภัยขึ้น', 'เพิ่มความละเอียดของไฟล์', 'เปลี่ยนประเภทของไฟล์'], correctAnswerIndex: 0 }
];

const sampleMathQuestions: Question[] = [
    { id: 'mq-1', questionText: '5 + 7 มีค่าเท่ากับเท่าไหร่?', options: ['10', '11', '12', '13'], correctAnswerIndex: 2 },
    { id: 'mq-2', questionText: '10 คูณ 3 มีค่าเท่ากับเท่าไหร่?', options: ['20', '30', '40', '50'], correctAnswerIndex: 1 },
    { id: 'mq-3', questionText: '15 หารด้วย 5 มีค่าเท่ากับเท่าไหร่?', options: ['2', '3', '4', '5'], correctAnswerIndex: 1 },
    { id: 'mq-4', questionText: 'รูปสามเหลี่ยมมีกี่ด้าน?', options: ['2 ด้าน', '3 ด้าน', '4 ด้าน', '5 ด้าน'], correctAnswerIndex: 1 },
    { id: 'mq-5', questionText: '100 - 25 มีค่าเท่ากับเท่าไหร่?', options: ['65', '70', '75', '80'], correctAnswerIndex: 2 },
];


export const initialExams: Exam[] = [
  {
    id: 'e-1',
    teacherId: 't-1',
    subject: 'วิทยาการคำนวณ',
    title: 'ทดสอบกลางภาค',
    questions: sampleAIQuestions,
    totalQuestions: 10,
    timeLimit: 15, // 15 minutes
    minSubmitTime: 5, // 5 minutes
    isActive: true,
    examCode: 'WCS101',
    requireFullscreen: false,
  },
  {
    id: 'e-2',
    teacherId: 't-1',
    subject: 'คณิตศาสตร์พื้นฐาน',
    title: 'ทดสอบหลังเรียน - การบวกลบคูณหาร',
    questions: sampleMathQuestions,
    totalQuestions: 5,
    timeLimit: 10,
    minSubmitTime: 2,
    isActive: true,
    examCode: '6XH4VS',
    requireFullscreen: false,
  },
];

export const initialResults: ExamResult[] = [];
