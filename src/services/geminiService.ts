import { GoogleGenerativeAI } from "@google/generative-ai";

// ใช้คีย์จาก Vercel
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzeFoodImage(imageBase64: string, profile: any, trainer: any, todayCalories: number) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // สร้างคำสั่งให้ AI รู้จักแม่และโค้ช
    const prompt = `คุณคือ ${trainer.name} โค้ชบุคลิก ${trainer.personality} 
    กำลังวิเคราะห์อาหารให้ ${profile.name} (เป้าหมาย: ${profile.goal})
    วันนี้เขากินไปแล้ว ${todayCalories} แคลอรี่
    ช่วยวิเคราะห์รูปนี้และตอบเป็น JSON ภาษาไทย: 
    { "name": "ชื่ออาหาร", "calories": 0, "nutrition": { "protein": 0, "carbs": 0, "fat": 0 }, "trainerComment": "คำแนะนำสไตล์ ${trainer.personality}" }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
    ]);

    const response = await result.response;
    // ตัดเอาแค่ส่วนที่เป็น JSON มาใช้
    const text = response.text().replace(/```json|```/g, "");
    return JSON.parse(text);
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
}
