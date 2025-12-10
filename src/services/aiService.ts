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
  // 检查 API Key
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('API Key 未配置，请先在设置中配置 API Key');
  }

  try {
    // Gemini 接口调用
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

    // OpenAI 兼容接口调用 (OpenAI, Qwen, GLM, DeepSeek, Custom)
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

      // 根据 HTTP 状态码提供更友好的错误信息
      if (response.status === 401) {
        throw new Error('API Key 无效，请检查配置');
      } else if (response.status === 429) {
        throw new Error('API 调用频率超限，请稍后重试');
      } else if (response.status >= 500) {
        throw new Error('AI 服务暂时不可用，请稍后重试');
      }

      throw new Error(`API 错误 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '{}';

    // 移除 Markdown 代码块标记
    return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  } catch (error: any) {
    console.error("Error calling AI API:", error);

    // 如果已经是我们自定义的错误信息，直接抛出
    if (error.message.includes('API Key') || error.message.includes('API 错误') || error.message.includes('服务')) {
      throw error;
    }

    // 网络错误
    if (error.message.includes('fetch') || error.message.includes('network')) {
      throw new Error('网络连接失败，请检查网络后重试');
    }

    // 其他未知错误
    throw new Error('AI 修复失败: ' + error.message);
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