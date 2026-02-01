import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function analyzeFoodImage(imageBase64: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `วิเคราะห์ภาพอาหารนี้และตอบกลับเป็น JSON ภาษาไทยเท่านั้น ห้ามมีข้อความอื่นปน โดยใช้โครงสร้างนี้: 
    { 
      "name": "ชื่ออาหาร", 
      "calories": 0, 
      "nutrition": { "protein": 0, "carbs": 0, "fat": 0 }, 
      "trainerComment": "คำแนะนำสั้นๆ จากเทรนเนอร์" 
    }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw new Error("AI Analysis Failed");
  }
}
