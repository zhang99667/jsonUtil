import type { AIConfig } from '../types';
import {
  getAIProviderDefaultModel,
  getOpenAICompatibleDefaultBaseUrl,
} from '../utils/aiProviderDefaults';
import { AiRepairErrorCode, createAiRepairError } from '../utils/aiRepairErrors';
import {
  formatAiErrorDetailSummary,
  redactAiErrorDetail,
} from '../utils/aiProviderErrorRedaction';
import {
  AI_REPAIR_SYSTEM_PROMPT,
  buildAiRepairUserPrompt,
} from './aiRepairPrompt';
import {
  assertNonEmptyAiResponseText,
  createIncompleteAiResponseError,
} from './aiRepairProviderResponse';

export const AI_INVALID_RESPONSE_JSON_MESSAGE = 'AI 返回内容格式不是 JSON，请检查 Base URL 或模型服务配置';

interface OpenAICompatibleRepairRequest {
  requestUrl: string;
  requestInit: RequestInit;
}

interface OpenAICompatibleRepairResponseBody {
  choices?: OpenAICompatibleChoice[];
}

type OpenAICompatibleMessageContent = string | Array<{ text?: unknown; type?: unknown }>;

interface OpenAICompatibleChoice {
  finish_reason?: unknown;
  message?: { content?: OpenAICompatibleMessageContent };
}

const OPENAI_INCOMPLETE_FINISH_REASONS = new Set(['length', 'content_filter']);

export const buildOpenAICompatibleRepairRequest = (
  config: AIConfig,
  brokenJson: string,
  signal: AbortSignal,
): OpenAICompatibleRepairRequest => {
  const requestUrl = buildChatCompletionsUrl(getOpenAICompatibleBaseUrl(config));

  return {
    requestUrl,
    requestInit: {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getOpenAICompatibleApiKey(config)}`,
      },
      body: JSON.stringify({
        model: getOpenAICompatibleRepairModel(config),
        messages: [
          {
            role: 'system',
            content: AI_REPAIR_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: buildAiRepairUserPrompt(brokenJson),
          },
        ],
        temperature: 0.1,
      }),
    },
  };
};

export const readOpenAICompatibleRepairText = async (response: Response): Promise<string> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw createAiRepairError(
      getAiHttpErrorCode(response.status),
      formatAiHttpErrorMessage(response.status, errorText)
    );
  }

  let data: OpenAICompatibleRepairResponseBody;

  try {
    data = await response.json() as OpenAICompatibleRepairResponseBody;
  } catch {
    throw createAiRepairError(AiRepairErrorCode.InvalidResponse, AI_INVALID_RESPONSE_JSON_MESSAGE);
  }

  const text = isOpenAICompatibleRepairResponseBody(data)
    ? readFirstOpenAICompatibleChoiceText(data)
    : undefined;
  return assertNonEmptyAiResponseText(text);
};

const isOpenAICompatibleRepairResponseBody = (
  value: unknown
): value is OpenAICompatibleRepairResponseBody => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const readFirstOpenAICompatibleChoiceText = (
  data: OpenAICompatibleRepairResponseBody
): string | undefined => {
  const choices = Array.isArray(data.choices) ? data.choices : [];
  let blockedFinishReason = '';

  for (const choice of choices) {
    const finishReason = readOpenAICompatibleFinishReason(choice);
    const text = readOpenAICompatibleMessageText(choice?.message?.content);
    if (text) {
      assertOpenAICompatibleFinishReason(finishReason);
      return text;
    }
    if (!blockedFinishReason && isOpenAICompatibleIncompleteFinishReason(finishReason)) {
      blockedFinishReason = finishReason;
    }
  }

  if (blockedFinishReason) {
    throw createIncompleteAiResponseError(`finish_reason: ${blockedFinishReason}`);
  }

  return undefined;
};

const readOpenAICompatibleFinishReason = (
  choice: OpenAICompatibleChoice | undefined
): string => (
  typeof choice?.finish_reason === 'string' ? choice.finish_reason.trim().toLowerCase() : ''
);

const assertOpenAICompatibleFinishReason = (finishReason: string): void => {
  if (isOpenAICompatibleIncompleteFinishReason(finishReason)) {
    throw createIncompleteAiResponseError(`finish_reason: ${finishReason}`);
  }
};

const isOpenAICompatibleIncompleteFinishReason = (finishReason: string): boolean => (
  OPENAI_INCOMPLETE_FINISH_REASONS.has(finishReason)
);

const readOpenAICompatibleMessageText = (
  content: OpenAICompatibleMessageContent | undefined
): string | undefined => {
  if (typeof content === 'string') return content.trim() ? content : undefined;
  if (!Array.isArray(content)) return undefined;

  const text = content
    .map(part => typeof part.text === 'string' ? part.text : '')
    .filter(partText => partText.trim())
    .join('\n');
  return text || undefined;
};

const getOpenAICompatibleBaseUrl = (config: AIConfig): string => {
  const configuredBaseUrl = config.baseUrl?.trim();
  return configuredBaseUrl || getOpenAICompatibleDefaultBaseUrl(config.provider);
};

const getOpenAICompatibleApiKey = (config: AIConfig): string => (
  config.apiKey.trim()
);

const getOpenAICompatibleRepairModel = (config: AIConfig): string => (
  config.model.trim() || getAIProviderDefaultModel(config.provider)
);

export const buildChatCompletionsUrl = (baseUrl: string): string => {
  // 兼容用户复制版本 Base URL 或完整 chat/completions 端点，避免拼出重复路径。
  const url = new URL(baseUrl.trim());
  const normalizedPathname = url.pathname.replace(/\/+$/, '');
  url.pathname = /\/chat\/completions$/i.test(normalizedPathname)
    ? normalizedPathname
    : `${normalizedPathname}/chat/completions`;
  return url.toString();
};

export const formatAiHttpErrorMessage = (status: number, errorText: string): string => {
  const detail = extractAiErrorDetail(errorText);
  const suffix = detail ? `：${detail}` : '';

  if (status === 401) return `API Key 无效或无权限${suffix}`;
  if (status === 404) return `API 地址不存在 (404)${suffix}。请确认 Base URL 已填写到 OpenAI-compatible 版本路径或完整 chat/completions 端点，例如 https://example.com/v1`;
  if (status === 429) return `API 调用频率超限，请稍后重试${suffix}`;
  if (status >= 500) return `AI 服务暂时不可用，请稍后重试${suffix}`;

  return `API 错误 (${status})${suffix}`;
};

const getAiHttpErrorCode = (status: number): AiRepairErrorCode => {
  if (status === 401) return AiRepairErrorCode.ProviderAuth;
  if (status === 404) return AiRepairErrorCode.ProviderEndpoint;
  if (status === 429) return AiRepairErrorCode.ProviderRateLimit;
  if (status >= 500) return AiRepairErrorCode.ProviderUnavailable;
  return AiRepairErrorCode.ProviderApiError;
};

const extractAiErrorDetail = (errorText: string): string => {
  const trimmed = errorText.trim();
  if (!trimmed) return '';

  try {
    const data = JSON.parse(trimmed) as { error?: { message?: unknown } | string; message?: unknown };
    const message = typeof data.error === 'object' && data.error
      ? data.error.message
      : data.message ?? data.error;
    if (typeof message === 'string' && message.trim()) return formatAiErrorDetailSummary(message);
  } catch {
    // 非 JSON 错误体继续使用原始文本摘要。
  }

  return formatAiErrorDetailSummary(trimmed);
};

export const formatAiNetworkErrorMessage = (requestUrl: string, errorMessage: string): string => {
  const target = requestUrl ? `请求地址：${redactAiErrorDetail(requestUrl)}。` : '';
  return `网络连接失败：浏览器未拿到 AI 服务响应。${target}可能原因：内网/VPN/零信任未登录、网关或 CORS 拦截、证书异常，或 Base URL 无法从当前浏览器访问。原始错误：${formatAiErrorDetailSummary(errorMessage)}`;
};
