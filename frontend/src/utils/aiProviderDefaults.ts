import { AIProvider } from '../types';

const OPENAI_COMPATIBLE_FALLBACK_BASE_URL = 'https://api.openai.com/v1';
const CUSTOM_PROVIDER_BASE_URL_PLACEHOLDER = 'https://your-api-endpoint.com/v1';

const AI_PROVIDER_DEFAULT_MODELS: Record<AIProvider, string> = {
  [AIProvider.GEMINI]: 'gemini-2.0-flash',
  [AIProvider.OPENAI]: 'gpt-4o-mini',
  [AIProvider.QWEN]: 'qwen-max',
  [AIProvider.GLM]: 'glm-4',
  [AIProvider.DEEPSEEK]: 'deepseek-chat',
  [AIProvider.CUSTOM]: 'gpt-4o-mini',
};

const AI_PROVIDER_DEFAULT_BASE_URLS: Partial<Record<AIProvider, string>> = {
  [AIProvider.OPENAI]: OPENAI_COMPATIBLE_FALLBACK_BASE_URL,
  [AIProvider.QWEN]: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  [AIProvider.GLM]: 'https://open.bigmodel.cn/api/paas/v4',
  [AIProvider.DEEPSEEK]: 'https://api.deepseek.com/v1',
};

export const getAIProviderDefaultModel = (provider: AIProvider): string => (
  AI_PROVIDER_DEFAULT_MODELS[provider] || AI_PROVIDER_DEFAULT_MODELS[AIProvider.OPENAI]
);

export const getOpenAICompatibleDefaultBaseUrl = (provider: AIProvider): string => (
  AI_PROVIDER_DEFAULT_BASE_URLS[provider] || OPENAI_COMPATIBLE_FALLBACK_BASE_URL
);

export const getAIProviderBaseUrlPlaceholder = (provider: AIProvider): string => (
  provider === AIProvider.CUSTOM
    ? CUSTOM_PROVIDER_BASE_URL_PLACEHOLDER
    : getOpenAICompatibleDefaultBaseUrl(provider)
);
