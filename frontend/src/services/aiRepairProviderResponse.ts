import { AiRepairErrorCode, createAiRepairError } from '../utils/aiRepairErrors';

export const AI_EMPTY_RESPONSE_MESSAGE = 'AI 返回内容为空，请重试或调整模型配置';
export const AI_INCOMPLETE_RESPONSE_MESSAGE = 'AI 返回内容被模型截断或安全策略拦截，请减少输入长度或调整模型配置';

export const assertNonEmptyAiResponseText = (text: unknown): string => {
  if (typeof text !== 'string' || !text.trim()) {
    throw createAiRepairError(AiRepairErrorCode.EmptyResponse, AI_EMPTY_RESPONSE_MESSAGE);
  }

  return text;
};

export const createIncompleteAiResponseError = (reason: string): Error => (
  createAiRepairError(
    AiRepairErrorCode.InvalidResponse,
    `${AI_INCOMPLETE_RESPONSE_MESSAGE}（${reason}）`
  )
);
