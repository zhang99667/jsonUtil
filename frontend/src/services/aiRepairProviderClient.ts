import { AIConfig, AIProvider } from '../types';
import { formatUnknownError, isAbortError } from '../utils/errors';
import { formatAiErrorDetailSummary } from '../utils/aiProviderErrorRedaction';
import {
  AiRepairErrorCode,
  createAiRepairError,
  isAiRepairError,
} from '../utils/aiRepairErrors';
import { requestGeminiRepairText } from './aiRepairGeminiTransport';
import {
  buildOpenAICompatibleRepairRequest,
  formatAiNetworkErrorMessage,
  readOpenAICompatibleRepairText,
} from './aiRepairOpenAiTransport';
import {
  AI_REPAIR_TIMEOUT_MESSAGE,
  AI_REPAIR_TIMEOUT_MS,
  runAiRepairProviderRequest,
} from './aiRepairProviderRequestRuntime';
import { normalizeAiProviderStatusError } from './aiRepairProviderStatusError';

export {
  AI_REPAIR_TIMEOUT_MESSAGE,
  AI_REPAIR_TIMEOUT_MS,
} from './aiRepairProviderRequestRuntime';

const AI_NETWORK_ERROR_MARKERS = [
  'fetch',
  'network',
  'networkerror',
  'load failed',
  'failed to load',
];

interface AiRepairProviderClientOptions {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export const requestAiRepairProviderText = async (
  brokenJson: string,
  config: AIConfig,
  options: AiRepairProviderClientOptions = {},
): Promise<string> => {
  const timeoutMs = options.timeoutMs ?? AI_REPAIR_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  let aiRequestUrl = '';

  try {
    if (config.provider === AIProvider.GEMINI) {
      return await runAiRepairProviderRequest(
        { signal: options.signal, timeoutMs },
        signal => requestGeminiRepairText(config, brokenJson, signal)
      );
    }

    const response = await runAiRepairProviderRequest(
      { signal: options.signal, timeoutMs },
      signal => {
        const { requestUrl, requestInit } = buildOpenAICompatibleRepairRequest(
          config,
          brokenJson,
          signal
        );
        aiRequestUrl = requestUrl;
        return fetchImpl(requestUrl, requestInit);
      }
    );
    return await readOpenAICompatibleRepairText(response);
  } catch (error: unknown) {
    const rawErrorMessage = formatUnknownError(error);
    const errorSummary = formatAiErrorDetailSummary(rawErrorMessage);
    const normalizedError = normalizeAiRepairProviderError(error, aiRequestUrl, rawErrorMessage, errorSummary);
    if (shouldLogAiProviderError(error, normalizedError, rawErrorMessage)) {
      console.error('Error calling AI API:', errorSummary);
    }
    throw normalizedError;
  }
};

const normalizeAiRepairProviderError = (
  error: unknown,
  aiRequestUrl: string,
  rawErrorMessage: string,
  errorSummary: string
): unknown => {
  if (isAiRepairError(error)) return error;

  if (isAbortError(error)) {
    return createAiRepairError(AiRepairErrorCode.Timeout, AI_REPAIR_TIMEOUT_MESSAGE);
  }

  // 网络错误
  if (isAiNetworkErrorMessage(rawErrorMessage)) {
    return createAiRepairError(
      AiRepairErrorCode.Network,
      formatAiNetworkErrorMessage(aiRequestUrl, rawErrorMessage)
    );
  }

  const providerStatusError = normalizeAiProviderStatusError(error, rawErrorMessage, errorSummary);
  if (providerStatusError) return providerStatusError;

  // 其他未知错误
  return createAiRepairError(AiRepairErrorCode.Unknown, 'AI 修复失败: ' + errorSummary);
};

const isAiNetworkErrorMessage = (errorMessage: string): boolean => {
  const normalizedMessage = errorMessage.toLowerCase();
  return AI_NETWORK_ERROR_MARKERS.some(marker => normalizedMessage.includes(marker));
};

const shouldLogAiProviderError = (error: unknown, normalizedError: unknown, errorMessage: string): boolean => (
  !isAiRepairError(error)
    && getNormalizedAiProviderErrorCode(normalizedError) === AiRepairErrorCode.Unknown
    && !isAbortError(error)
    && !isAiNetworkErrorMessage(errorMessage)
);

const getNormalizedAiProviderErrorCode = (error: unknown): AiRepairErrorCode | null => (
  isAiRepairError(error) ? error.code : null
);
