import { GoogleGenAI } from "@google/genai";
import { AIConfig, AIProvider } from "../types";

/**
 * 将 AI 返回内容规范化为有效的压缩 JSON，避免解释文本或 Markdown 写回编辑器
 */
export const normalizeAiJsonResponse = (rawText: string): string => {
  const trimmed = rawText.trim();
  if (!trimmed) return '{}';

  const direct = tryNormalizeJson(trimmed);
  if (direct) return direct;

  const fenced = extractMarkdownFence(trimmed);
  if (fenced) {
    const normalized = tryNormalizeJson(fenced);
    if (normalized) return normalized;
  }

  const snippet = extractBalancedJsonSnippet(trimmed);
  if (snippet) {
    const normalized = tryNormalizeJson(snippet);
    if (normalized) return normalized;
  }

  throw new Error('AI 返回内容不是有效 JSON，请重试或调整模型配置');
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
      return normalizeAiJsonResponse(text || '{}');
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

    return normalizeAiJsonResponse(text);
  } catch (error: unknown) {
    console.error("Error calling AI API:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // 如果已经是我们自定义的错误信息，直接抛出
    if (
      errorMessage.includes('API Key') ||
      errorMessage.includes('API 错误') ||
      errorMessage.includes('服务') ||
      errorMessage.includes('AI 返回内容')
    ) {
      throw error;
    }

    // 网络错误
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      throw new Error('网络连接失败，请检查网络后重试');
    }

    // 其他未知错误
    throw new Error('AI 修复失败: ' + errorMessage);
  }
};

const tryNormalizeJson = (candidate: string): string | null => {
  try {
    return JSON.stringify(JSON.parse(candidate));
  } catch {
    return null;
  }
};

const extractMarkdownFence = (text: string): string | null => {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
};

const extractBalancedJsonSnippet = (text: string): string | null => {
  for (let i = 0; i < text.length; i++) {
    const start = text[i];
    if (start !== '{' && start !== '[') continue;

    const endStack = [start === '{' ? '}' : ']'];
    let inString = false;
    let escaped = false;

    for (let j = i + 1; j < text.length; j++) {
      const char = text[j];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') {
        endStack.push('}');
      } else if (char === '[') {
        endStack.push(']');
      } else if (char === endStack[endStack.length - 1]) {
        endStack.pop();
        if (endStack.length === 0) {
          return text.slice(i, j + 1);
        }
      }
    }
  }

  return null;
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
