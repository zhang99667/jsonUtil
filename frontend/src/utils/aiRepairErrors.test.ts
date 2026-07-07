import { describe, expect, it } from 'vitest';
import {
  AiRepairError,
  AiRepairErrorCode,
  createAiRepairError,
  getAiRepairErrorCode,
  isAiRepairError,
} from './aiRepairErrors';

describe('aiRepairErrors', () => {
  it('创建带错误码且兼容 Error 的 AI 修复错误', () => {
    const error = createAiRepairError(AiRepairErrorCode.ApiKeyRequired, 'API Key 未配置');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AiRepairError);
    expect(error.message).toBe('API Key 未配置');
    expect(error.code).toBe(AiRepairErrorCode.ApiKeyRequired);
    expect(isAiRepairError(error)).toBe(true);
    expect(getAiRepairErrorCode(error)).toBe(AiRepairErrorCode.ApiKeyRequired);
  });

  it('普通错误不被识别为 AI 修复错误', () => {
    expect(isAiRepairError(new Error('普通错误'))).toBe(false);
    expect(getAiRepairErrorCode(new Error('普通错误'))).toBeNull();
  });
});
