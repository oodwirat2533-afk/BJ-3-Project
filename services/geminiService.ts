
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    questionText: {
      type: Type.STRING,
      description: "ข้อความคำถาม",
    },
    options: {
      type: Type.ARRAY,
      description: "ตัวเลือก 4 ข้อสำหรับคำถามนี้ เป็นข้อความทั้งหมด",
      items: {
        type: Type.STRING,
      },
    },
    correctAnswerIndex: {
      type: Type.INTEGER,
      description: "ดัชนีของคำตอบที่ถูกต้องใน options array (0-3)",
    },
  },
  required: ["questionText", "options", "correctAnswerIndex"],
};

export const generateQuestions = async (
  topic: string,
  count: number
): Promise<Omit<Question, 'id'>[]> => {
  if (!API_KEY) {
    throw new Error("ไม่สามารถสร้างข้อสอบได้: API Key ไม่ได้ถูกตั้งค่า");
  }

  const model = "gemini-3-flash-preview";

  const prompt = `สร้างชุดข้อสอบแบบปรนัย 4 ตัวเลือก (ก, ข, ค, ง) ที่ไม่ซ้ำกัน จำนวน ${count} ข้อ เกี่ยวกับหัวข้อ "${topic}" สำหรับนักเรียนระดับมัธยมศึกษาในประเทศไทย แต่ละข้อต้องมีคำถามที่ชัดเจน, ตัวเลือก 4 ข้อ, และระบุคำตอบที่ถูกต้อง`;

  try {
    const result = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: questionSchema,
            },
          },
        },
        temperature: 0.8,
      },
    });

    const responseText = result.text.trim();
    const parsedResponse = JSON.parse(responseText);

    if (parsedResponse.questions && Array.isArray(parsedResponse.questions) && parsedResponse.questions.length > 0) {
      // Validate that each question has 4 options
      const validQuestions = parsedResponse.questions.filter((q: any) => q.options && q.options.length === 4);
      if (validQuestions.length !== parsedResponse.questions.length) {
        console.warn("AI generated some questions with incorrect number of options.");
      }
      return validQuestions.slice(0, count).map((q: any) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
      }));
    } else {
      throw new Error("AI ไม่สามารถสร้างชุดคำถามที่ถูกต้องได้");
    }
  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    throw new Error("เกิดข้อผิดพลาดในการสื่อสารกับ AI เพื่อสร้างข้อสอบ");
  }
};
