import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeFoodImage(imageBase64: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "วิเคราะห์ภาพอาหารนี้และตอบเป็น JSON ภาษาไทยเท่านั้น: { \"name\": \"ชื่ออาหาร\", \"calories\": 0, \"nutrition\": { \"protein\": 0, \"carbs\": 0, \"fat\": 0 }, \"trainerComment\": \"คำแนะนำ\" }";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
    ]);

    return result.response.text();
  } catch (error) {
    console.error(error);
    throw new Error("AI Fail");
  }
}
