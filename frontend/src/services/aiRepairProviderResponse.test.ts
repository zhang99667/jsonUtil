import { describe, expect, it } from 'vitest';
import {
  AI_EMPTY_RESPONSE_MESSAGE,
  assertNonEmptyAiResponseText,
} from './aiRepairProviderResponse';
import { AiRepairErrorCode, getAiRepairErrorCode } from '../utils/aiRepairErrors';

describe('aiRepairProviderResponse', () => {
  it('读取非空文本响应', () => {
    expect(assertNonEmptyAiResponseText('{}')).toBe('{}');
  });

  it('空文本或缺字段响应抛出可读错误', () => {
    expect(() => assertNonEmptyAiResponseText('   ')).toThrow(AI_EMPTY_RESPONSE_MESSAGE);
    expect(() => assertNonEmptyAiResponseText(undefined)).toThrow(AI_EMPTY_RESPONSE_MESSAGE);
  });

  it('空响应错误携带结构化错误码', () => {
    let error: unknown;
    try {
      assertNonEmptyAiResponseText(undefined);
    } catch (caughtError) {
      error = caughtError;
    }

    expect(getAiRepairErrorCode(error)).toBe(AiRepairErrorCode.EmptyResponse);
  });
});
