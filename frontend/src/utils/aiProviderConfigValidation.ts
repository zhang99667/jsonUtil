import { AIProvider, type AIConfig } from '../types';
import { AiRepairErrorCode, createAiRepairError } from './aiRepairErrors';

export const AI_API_KEY_REQUIRED_MESSAGE = 'API Key 未配置，请先在设置中配置 API Key';
export const AI_CUSTOM_BASE_URL_REQUIRED_MESSAGE = '自定义 AI 提供商需要填写 Base URL';
export const AI_BASE_URL_INVALID_MESSAGE = 'Base URL 格式无效，请填写 http(s) 开头的完整地址，例如 https://example.com/v1';

export const getAIProviderConfigValidationError = (config: AIConfig): string => {
  if (config.provider === AIProvider.GEMINI) return '';

  const baseUrl = config.baseUrl?.trim() ?? '';
  if (!baseUrl) return config.provider === AIProvider.CUSTOM ? AI_CUSTOM_BASE_URL_REQUIRED_MESSAGE : '';

  if (!isValidOpenAICompatibleBaseUrl(baseUrl)) return AI_BASE_URL_INVALID_MESSAGE;

  return '';
};

export const getAIProviderRequestValidationError = (config: AIConfig): string => {
  if (!config.apiKey.trim()) {
    return AI_API_KEY_REQUIRED_MESSAGE;
  }

  return getAIProviderConfigValidationError(config);
};

export const assertAIProviderRequestConfig = (config: AIConfig): void => {
  const validationError = getAIProviderRequestValidationError(config);
  if (validationError) {
    throw createAiRepairError(getAIProviderValidationErrorCode(validationError), validationError);
  }
};

export const isValidOpenAICompatibleBaseUrl = (baseUrl: string): boolean => {
  try {
    const url = new URL(baseUrl.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const getAIProviderValidationErrorCode = (validationError: string): AiRepairErrorCode => {
  if (validationError === AI_API_KEY_REQUIRED_MESSAGE) return AiRepairErrorCode.ApiKeyRequired;
  if (validationError === AI_BASE_URL_INVALID_MESSAGE) return AiRepairErrorCode.BaseUrlInvalid;
  return AiRepairErrorCode.CustomBaseUrlRequired;
};
