import { describe, expect, it } from 'vitest';
import type { ValidationResult } from '../types';
import { getAppTemplateFillTargetError } from './appTemplateFillTargetError';

const validValidation: ValidationResult = { isValid: true };

const getTargetError = (
  overrides: Partial<Parameters<typeof getAppTemplateFillTargetError>[0]> = {}
) => getAppTemplateFillTargetError({
  isTemplatePanelOpen: true,
  sourceText: '{"a":1}',
  validation: validValidation,
  ...overrides,
});

describe('appTemplateFillTargetError', () => {
  it('面板未打开时不提示目标错误', () => {
    expect(getTargetError({ isTemplatePanelOpen: false })).toBe('');
  });

  it('SOURCE 为空时提示先输入合法 JSON', () => {
    expect(getTargetError({ sourceText: '   ' })).toBe('请先在 SOURCE 输入合法 JSON');
  });

  it('SOURCE 不是 JSON 时提示无法应用模板', () => {
    expect(getTargetError({ sourceText: 'plain text' })).toBe('当前 SOURCE 不是合法 JSON，无法应用模板');
  });

  it('SOURCE 校验失败时保留具体错误文案', () => {
    expect(getTargetError({
      validation: { isValid: false, error: 'bad json' },
    })).toBe('当前 SOURCE JSON 无效: bad json');
  });

  it('SOURCE 校验失败但无详情时返回兜底文案', () => {
    expect(getTargetError({
      validation: { isValid: false },
    })).toBe('当前 SOURCE JSON 无效');
  });

  it('SOURCE 合法且校验通过时无错误', () => {
    expect(getTargetError()).toBe('');
  });
});
