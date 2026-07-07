import type { AiRepairError } from '../utils/aiRepairErrors';
import { AiRepairErrorCode, createAiRepairError } from '../utils/aiRepairErrors';

export const normalizeAiProviderStatusError = (
  error: unknown,
  rawErrorMessage: string,
  errorSummary: string
): AiRepairError | null => {
  const providerStatus = readAiProviderErrorStatus(error, rawErrorMessage);
  if (providerStatus === null) return null;
  return createAiRepairError(
    getAiProviderStatusErrorCode(providerStatus),
    formatAiProviderStatusErrorMessage(providerStatus, errorSummary)
  );
};

const readAiProviderErrorStatus = (error: unknown, rawErrorMessage: string): number | null => {
  const statusFromObject = readNumericProperty(error, 'status')
    ?? readNumericProperty(error, 'statusCode')
    ?? readNumericProperty(error, 'code');
  if (statusFromObject !== null) return statusFromObject;

  const statusMatch = rawErrorMessage.match(/\b(?:status|statusCode|code)\D{0,12}([1-5]\d{2})\b/i);
  return statusMatch ? Number(statusMatch[1]) : null;
};

const readNumericProperty = (value: unknown, property: string): number | null => {
  if (typeof value !== 'object' || value === null) return null;
  const rawValue = (value as Record<string, unknown>)[property];
  if (typeof rawValue === 'number' && Number.isInteger(rawValue)) return rawValue;
  if (typeof rawValue === 'string' && /^[1-5]\d{2}$/.test(rawValue.trim())) return Number(rawValue);
  return null;
};

const getAiProviderStatusErrorCode = (status: number): AiRepairErrorCode => {
  if (status === 401 || status === 403) return AiRepairErrorCode.ProviderAuth;
  if (status === 404) return AiRepairErrorCode.ProviderEndpoint;
  if (status === 429) return AiRepairErrorCode.ProviderRateLimit;
  if (status >= 500) return AiRepairErrorCode.ProviderUnavailable;
  return AiRepairErrorCode.ProviderApiError;
};

const formatAiProviderStatusErrorMessage = (status: number, detail: string): string => {
  const suffix = detail ? `：${detail}` : '';
  if (status === 401 || status === 403) return `API Key 无效或无权限${suffix}`;
  if (status === 404) return `API 地址不存在 (404)${suffix}`;
  if (status === 429) return `API 调用频率超限，请稍后重试${suffix}`;
  if (status >= 500) return `AI 服务暂时不可用，请稍后重试${suffix}`;
  return `API 错误 (${status})${suffix}`;
};
