import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const fixJsonWithAI = async (brokenJson: string): Promise<string> => {
  try {
    const ai = getGenAI();
    
    // We use gemini-2.5-flash for speed and efficiency on this utility task
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a JSON repair tool. 
      I have a malformed JSON string. Please repair it.
      
      Rules:
      1. Return ONLY the raw, valid, minified JSON string. 
      2. Do NOT include markdown formatting (no \`\`\`json ... \`\`\`).
      3. Do NOT include any explanations.
      4. If the input is not recoverable, return an empty object "{}".

      Input:
      ${brokenJson}`,
    });

    const text = response.text;
    return text ? text.trim() : '{}';
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("AI 服务暂时无法修复该 JSON。请检查 API Key 或稍后重试。");
  }
};