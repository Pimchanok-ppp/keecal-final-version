import { GoogleGenerativeAI } from "@google/generative-ai";

// เราจะดึง API Key จาก Environment Variable ที่ตั้งไว้ใน Vercel
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeFoodImage(base64Image: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `วิเคราะห์ภาพอาหารนี้และตอบเป็น JSON เท่านั้น:
    {
      "name": "ชื่ออาหาร",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "comment": "คำแนะนำสั้นๆ จากเทรนเนอร์"
    }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text.replace(/```json|```/g, ""));
  } catch (error) {
    console.error("Error analyzing food:", error);
    throw error;
  }
}
