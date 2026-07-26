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

  it('识别跨上下文的结构化 AI 修复错误', () => {
    const error = {
      name: 'AiRepairError',
      message: '请求超时',
      code: AiRepairErrorCode.Timeout,
    };

    expect(isAiRepairError(error)).toBe(true);
    expect(getAiRepairErrorCode(error)).toBe(AiRepairErrorCode.Timeout);
  });

  it('普通错误即使携带同名错误码也不会误判', () => {
    let reads = 0;
    const error = Object.defineProperty(new Error('普通错误'), 'code', {
      get: () => { reads += 1; return AiRepairErrorCode.Timeout; },
    });

    expect(isAiRepairError(error)).toBe(false);
    expect(getAiRepairErrorCode(error)).toBeNull();
    expect(reads).toBe(0);
  });

  it('敌意属性读取失败时返回稳定判定结果', () => {
    const error = new Proxy(new Error('读取失败'), {
      get: () => { throw new Error('属性不可读'); },
    });

    expect(isAiRepairError(error)).toBe(false);
    expect(getAiRepairErrorCode(error)).toBeNull();
  });

  it('错误码只读取一次，避免状态型 getter 改变判定结果', () => {
    let reads = 0;
    const error = {
      name: 'AiRepairError',
      message: '请求超时',
      get code() {
        reads += 1;
        if (reads > 1) throw new Error('重复读取');
        return AiRepairErrorCode.Timeout;
      },
    };

    expect(getAiRepairErrorCode(error)).toBe(AiRepairErrorCode.Timeout);
    expect(reads).toBe(1);
  });
});
