import { AiRepairErrorCode, createAiRepairError } from '../utils/aiRepairErrors';
import { isRecord } from '../utils/storage';

export const AI_CONNECTION_TEST_INPUT = '{connection:true}';
export const AI_CONNECTION_TEST_INVALID_MESSAGE = 'AI 连接测试返回内容不符合预期，请检查模型配置';

export const assertAiConnectionTestResult = (fixedJson: string): void => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(fixedJson);
  } catch {
    throw createAiRepairError(AiRepairErrorCode.ConnectionTestInvalid, AI_CONNECTION_TEST_INVALID_MESSAGE);
  }

  if (!isRecord(parsed) || parsed.connection !== true) {
    throw createAiRepairError(AiRepairErrorCode.ConnectionTestInvalid, AI_CONNECTION_TEST_INVALID_MESSAGE);
  }
};
