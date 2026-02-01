import { GoogleGenerativeAI } from "@google/generative-ai";

// เรียกกุญแจให้ถูกชื่อตามที่ตั้งใน Vercel
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeFoodImage(imageBase64: string) {
  try {
    // ใช้โมเดลตัวล่าสุด
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // คำสั่งภาษาไทยที่ถูกต้อง
    const prompt = "วิเคราะห์ภาพอาหารนี้ บอกชื่อ แคลอรี่ และสารอาหาร เป็นภาษาไทยในรูปแบบ JSON";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(",")[1],
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
