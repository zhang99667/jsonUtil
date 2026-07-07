import { GoogleGenAI } from '@google/genai';
import type { AIConfig } from '../types';
import { AIProvider } from '../types';
import { getAIProviderDefaultModel } from '../utils/aiProviderDefaults';
import { buildAiRepairPrompt } from './aiRepairPrompt';
import {
  assertNonEmptyAiResponseText,
  createIncompleteAiResponseError,
} from './aiRepairProviderResponse';

export const GEMINI_REPAIR_DEFAULT_MODEL = getAIProviderDefaultModel(AIProvider.GEMINI);

const GEMINI_INCOMPLETE_FINISH_REASONS = new Set([
  'MAX_TOKENS',
  'SAFETY',
  'RECITATION',
  'BLOCKLIST',
  'PROHIBITED_CONTENT',
  'SPII',
  'MALFORMED_FUNCTION_CALL',
]);

interface GeminiRepairResponseMetadata {
  candidates?: Array<{ finishReason?: unknown }>;
}

export const getGeminiRepairModel = (config: AIConfig): string => (
  config.model.trim() || GEMINI_REPAIR_DEFAULT_MODEL
);

export const buildGeminiRepairPrompt = buildAiRepairPrompt;

export const requestGeminiRepairText = async (
  config: AIConfig,
  brokenJson: string,
  signal?: AbortSignal,
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: config.apiKey.trim() });
  const response = await ai.models.generateContent({
    model: getGeminiRepairModel(config),
    contents: buildGeminiRepairPrompt(brokenJson),
    config: signal ? { abortSignal: signal } : undefined,
  });

  assertGeminiRepairResponseComplete(response);
  return assertNonEmptyAiResponseText(response.text);
};

const assertGeminiRepairResponseComplete = (response: GeminiRepairResponseMetadata): void => {
  const finishReason = readGeminiFinishReason(response);
  if (GEMINI_INCOMPLETE_FINISH_REASONS.has(finishReason)) {
    throw createIncompleteAiResponseError(`finishReason: ${finishReason}`);
  }
};

const readGeminiFinishReason = (response: GeminiRepairResponseMetadata): string => {
  const finishReason = response.candidates?.[0]?.finishReason;
  return typeof finishReason === 'string' ? finishReason.trim().toUpperCase() : '';
};
