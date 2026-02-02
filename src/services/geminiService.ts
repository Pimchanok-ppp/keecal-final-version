import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function analyzeFoodImage(imageBase64: string) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const prompt = `วิเคราะห์ภาพอาหารและตอบเป็น JSON ภาษาไทยเท่านั้น: 
    {
      "name": "ชื่ออาหาร",
      "calories": 0,
      "nutrition": { "protein": 0, "carbs": 0, "fat": 0 },
      "trainerComment": "คำแนะนำสั้นๆ สไตล์เทรนเนอร์"
    }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
