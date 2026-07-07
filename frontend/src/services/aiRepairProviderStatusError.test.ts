import { describe, expect, it } from 'vitest';
import { AiRepairErrorCode } from '../utils/aiRepairErrors';
import { normalizeAiProviderStatusError } from './aiRepairProviderStatusError';

describe('aiRepairProviderStatusError', () => {
  it('从 SDK error.status 归一鉴权错误', () => {
    const error = normalizeAiProviderStatusError(
      Object.assign(new Error('unauthorized'), { status: 401 }),
      'unauthorized',
      'unauthorized'
    );

    expect(error).toMatchObject({
      code: AiRepairErrorCode.ProviderAuth,
      message: 'API Key 无效或无权限：unauthorized',
    });
  });

  it('从 SDK error.statusCode 归一限流错误', () => {
    const error = normalizeAiProviderStatusError(
      Object.assign(new Error('quota exceeded'), { statusCode: '429' }),
      'quota exceeded',
      'quota exceeded'
    );

    expect(error).toMatchObject({
      code: AiRepairErrorCode.ProviderRateLimit,
      message: 'API 调用频率超限，请稍后重试：quota exceeded',
    });
  });

  it('从 SDK error.code 归一服务不可用错误', () => {
    const error = normalizeAiProviderStatusError(
      Object.assign(new Error('bad gateway'), { code: 502 }),
      'bad gateway',
      'bad gateway'
    );

    expect(error).toMatchObject({
      code: AiRepairErrorCode.ProviderUnavailable,
      message: 'AI 服务暂时不可用，请稍后重试：bad gateway',
    });
  });

  it('从错误消息里的状态字段归一 provider 错误', () => {
    const error = normalizeAiProviderStatusError(
      new Error('upstream failed with code: 503'),
      'upstream failed with code: 503',
      'upstream failed with code: 503'
    );

    expect(error).toMatchObject({
      code: AiRepairErrorCode.ProviderUnavailable,
      message: 'AI 服务暂时不可用，请稍后重试：upstream failed with code: 503',
    });
  });

  it('没有状态线索时返回 null', () => {
    expect(normalizeAiProviderStatusError(
      new Error('Gemini SDK rejected'),
      'Gemini SDK rejected',
      'Gemini SDK rejected'
    )).toBeNull();
  });
});
