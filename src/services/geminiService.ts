import { GoogleGenerativeAI } from "@google/generative-ai";

// ใช้ชื่อ API_KEY ให้ตรงกับที่แม่ตั้งใน Vercel (รูป image_18e092)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY || "");

export async function analyzeFoodImage(base64Image: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "วิเคราะห์ภาพอาหารนี้และตอบเป็น JSON ภาษาไทย: { \"name\": \"ชื่ออาหาร\", \"calories\": 0, \"nutrition\": { \"protein\": 0, \"carbs\": 0, \"fat\": 0 }, \"trainerComment\": \"คำแนะนำ\" }";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}
