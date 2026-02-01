import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeFoodImage(base64Image: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "วิเคราะห์ภาพอาหารนี้และตอบเป็น JSON: { 'name': 'ชื่ออาหาร', 'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0, 'comment': 'คำแนะนำ' }";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image.split(",")[1], mimeType: "image/jpeg" } }
    ]);

    return (await result.response).text();
  } catch (error) {
    throw error;
  }
}
