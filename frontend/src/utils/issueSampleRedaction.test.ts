import { describe, expect, it } from 'vitest';
import {
  collectIssueSampleSensitiveHints,
  collectIssueSampleSensitiveKeywords,
  formatIssueSampleSensitiveHint,
  redactSensitiveIssueSamples,
} from './issueSampleRedaction';

describe('issueSampleRedaction', () => {
  it('从路径、原始值和 URL 编码内容中识别敏感关键字', () => {
    const originalValue = `task_params=${encodeURIComponent(JSON.stringify({
      token: 'real-token',
      sign: 'real-sign',
      task_id: '602',
    }))}`;

    expect(collectIssueSampleSensitiveKeywords({
      path: '$.reward',
      sourceLabel: 'rewardParam',
      originalValue,
    })).toEqual(['token', 'sign']);
  });

  it('按单词边界识别敏感词，避免普通字符串误报', () => {
    expect(collectIssueSampleSensitiveKeywords({
      path: '$.procession',
      originalValue: 'designation=designer&sessionize=true',
    })).toEqual([]);

    expect(collectIssueSampleSensitiveKeywords({
      path: '$.session',
      originalValue: 'value=abc',
    })).toEqual(['session']);
  });

  it('脱敏 originalValue 并保留样本其他字段', () => {
    expect(redactSensitiveIssueSamples([{
      path: '$.auth',
      reasonLabel: '待检查',
      originalValue: 'access_token=abc&foo=bar',
    }])).toEqual([{
      path: '$.auth',
      reasonLabel: '待检查',
      originalValue: '[REDACTED: access_token/token]',
      redactionHint: '原始值已脱敏，命中: access_token/token',
    }]);
  });

  it('生成回归模板中的敏感提示文本', () => {
    const hints = collectIssueSampleSensitiveHints([
      {
        path: '$.auth',
        sourcePath: '$.headers.authorization',
        originalValue: 'Bearer abc',
      },
    ]);

    expect(hints).toEqual([
      { path: '$.auth', keywords: ['authorization'] },
    ]);
    expect(formatIssueSampleSensitiveHint(hints[0])).toBe('$.auth(authorization)');
  });
});
