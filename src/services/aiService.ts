import { GoogleGenAI } from "@google/genai";
import { AIConfig, AIProvider } from "../types";

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const fixJsonWithAI = async (brokenJson: string, config: AIConfig): Promise<string> => {
  try {
    // Handle Gemini provider
    if (config.provider === AIProvider.GEMINI) {
      const ai = new GoogleGenAI({ apiKey: config.apiKey });

      const response = await ai.models.generateContent({
        model: config.model || 'gemini-2.0-flash',
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
    }

    // Handle OpenAI-compatible providers (OpenAI, Qwen, GLM, DeepSeek, Custom)
    const baseUrl = config.baseUrl || getDefaultBaseUrl(config.provider);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || getDefaultModel(config.provider),
        messages: [
          {
            role: 'system',
            content: 'You are a JSON repair tool. Return ONLY valid, minified JSON. No markdown, no explanations.'
          },
          {
            role: 'user',
            content: `Repair this malformed JSON. If not recoverable, return "{}". Input:\n${brokenJson}`
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '{}';

    // Clean up potential markdown formatting
    return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  } catch (error: any) {
    console.error("Error calling AI API:", error);
    throw new Error(error.message || "AI 服务暂时无法修复该 JSON。请检查 API Key 或稍后重试。");
  }
};

function getDefaultBaseUrl(provider: AIProvider): string {
  switch (provider) {
    case AIProvider.OPENAI:
      return 'https://api.openai.com/v1';
    case AIProvider.QWEN:
      return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    case AIProvider.ERNIE:
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1';
    case AIProvider.GLM:
      return 'https://open.bigmodel.cn/api/paas/v4';
    case AIProvider.DEEPSEEK:
      return 'https://api.deepseek.com/v1';
    default:
      return 'https://api.openai.com/v1';
  }
}

function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case AIProvider.GEMINI:
      return 'gemini-2.0-flash';
    case AIProvider.OPENAI:
      return 'gpt-4o-mini';
    case AIProvider.QWEN:
      return 'qwen-max';
    case AIProvider.ERNIE:
      return 'ernie-4.0-8k';
    case AIProvider.GLM:
      return 'glm-4';
    case AIProvider.DEEPSEEK:
      return 'deepseek-chat';
    default:
      return 'gpt-4o-mini';
  }
}