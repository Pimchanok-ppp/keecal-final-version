import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Trainer, FoodEntry } from "../types";

// ใช้ process.env.API_KEY ตามข้อกำหนดของระบบเพื่อความปลอดภัยและประสิทธิภาพ
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemPrompt = (profile: UserProfile, trainer: Trainer, currentDailyCalories: number, langText: string) => {
  return `You are a professional fitness trainer named "${trainer.name}" with a "${trainer.personality}" personality.
          
          TASK: Analyze the food image provided and provide nutrition details in ${langText}.
          
          USER CONTEXT:
          - User Goal: ${profile.goal}
          - Daily Calorie Limit: ${profile.dailyLimit} kcal
          - Calories consumed today: ${currentDailyCalories} kcal
          
          PERSONALITY GUIDELINES:
          - "kind": Very gentle, uses emojis, encourages the user.
          - "aggressive": Very strict, sounds like a drill instructor, demands discipline.
          - "funny": Joking, uses humor, makes light of the situation.
          
          REQUIRED JSON OUTPUT:
          {
            "name": "Food Name",
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "trainerComment": "Feedback based on your personality and their progress."
          }`;
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    fat: { type: Type.NUMBER },
    trainerComment: { type: Type.STRING },
  },
  required: ["name", "calories", "protein", "carbs", "fat", "trainerComment"],
};

export const analyzeFoodImage = async (
  base64Image: string,
  profile: UserProfile,
  trainer: Trainer,
  currentDailyCalories: number
): Promise<Partial<FoodEntry>> => {
  const langText = profile.language === 'th' ? "Thai" : "English";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: getSystemPrompt(profile, trainer, currentDailyCalories, langText)
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  const jsonStr = response.text?.trim() || "{}";
  const result = JSON.parse(jsonStr);

  return {
    name: result.name,
    calories: Math.round(result.calories),
    nutrition: {
      protein: Math.round(result.protein),
      carbs: Math.round(result.carbs),
      fat: Math.round(result.fat),
    },
    trainerComment: result.trainerComment,
  };
};
