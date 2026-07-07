import { describe, expect, it } from 'vitest';
import { base64Encode } from './schemeUtils';
import {
  AI_INPUT_TOO_LARGE_MESSAGE,
  AI_REMOTE_REPAIR_MAX_INPUT_LENGTH,
  AI_SENSITIVE_INPUT_MESSAGE,
  assertAiRepairInputCanUseExternalModel,
  buildAiRepairRequestPolicy,
  detectAiSensitiveInputLabels,
} from './aiRepairRequestPolicy';
import { AiRepairErrorCode, getAiRepairErrorCode } from './aiRepairErrors';

describe('aiRepairRequestPolicy', () => {
  it('无敏感字段时允许使用外部模型', () => {
    expect(buildAiRepairRequestPolicy('{ok:}')).toEqual({
      canUseExternalModel: true,
      isInputTooLarge: false,
      sensitiveLabels: [],
      rejectionMessage: null,
    });
  });

  it('命中敏感字段时返回统一拒绝信息', () => {
    expect(buildAiRepairRequestPolicy('{token:, password:}')).toEqual({
      canUseExternalModel: false,
      isInputTooLarge: false,
      sensitiveLabels: ['token', 'secret'],
      rejectionMessage: `${AI_SENSITIVE_INPUT_MESSAGE}（命中: token/secret）`,
    });
  });

  it('超过远程修复上限时拒绝外发原文', () => {
    const largeInput = '{bad:' + 'x'.repeat(AI_REMOTE_REPAIR_MAX_INPUT_LENGTH) + '}';

    expect(buildAiRepairRequestPolicy(largeInput)).toEqual({
      canUseExternalModel: false,
      isInputTooLarge: true,
      sensitiveLabels: [],
      rejectionMessage: AI_INPUT_TOO_LARGE_MESSAGE,
    });
    expect(() => assertAiRepairInputCanUseExternalModel(largeInput))
      .toThrow(AI_INPUT_TOO_LARGE_MESSAGE);
  });

  it('断言函数会阻止敏感原文进入外部模型', () => {
    expect(() => assertAiRepairInputCanUseExternalModel('{authorization:}'))
      .toThrow(`${AI_SENSITIVE_INPUT_MESSAGE}（命中: cookie）`);
  });

  it('敏感字段输入错误携带结构化错误码', () => {
    let error: unknown;
    try {
      assertAiRepairInputCanUseExternalModel('{authorization:}');
    } catch (caughtError) {
      error = caughtError;
    }

    expect(getAiRepairErrorCode(error)).toBe(AiRepairErrorCode.SensitiveInput);
  });

  it('识别多层 URL 编码后的敏感字段', () => {
    const payload = JSON.stringify({
      token: 'real-token',
      android_id: 'real-android-id',
    });
    const encoded = `task_params=${encodeURIComponent(encodeURIComponent(encodeURIComponent(payload)))}`;

    expect(detectAiSensitiveInputLabels(encoded)).toEqual(['token', 'device']);
  });

  it('识别嵌入 Base64 片段中的敏感字段', () => {
    const extraParam = `AFD8f${base64Encode(JSON.stringify({
      oaid_v: 'real-oaid',
      akey: 'real-secret',
    }))}UxM${base64Encode('&sign=real-sign')}`;

    expect(detectAiSensitiveInputLabels(extraParam)).toEqual(['sign', 'secret', 'device']);
  });
});
