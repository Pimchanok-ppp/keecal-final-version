import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const analyzeFoodImage = async (imageBase64: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const prompt = "วิเคราะห์ภาพอาหารและตอบเป็น JSON ภาษาไทย: { \"name\": \"ชื่ออาหาร\", \"calories\": 0, \"nutrition\": { \"protein\": 0, \"carbs\": 0, \"fat\": 0 }, \"trainerComment\": \"คำแนะนำ\" }";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    throw error;
  }
};
