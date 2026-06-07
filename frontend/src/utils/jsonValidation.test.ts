import { describe, expect, it } from 'vitest';
import { cleanJsonInput, isJsonContainerCandidate, validateJsonForEditor } from './jsonValidation';

describe('jsonValidation', () => {
  it('清理零宽字符后再校验 JSON', () => {
    const result = validateJsonForEditor('\uFEFF{"name":"json"}\u200B');

    expect(cleanJsonInput('\uFEFF{"ok":true}\u200B')).toBe('{"ok":true}');
    expect(result).toEqual({ isValid: true });
  });

  it('实时编辑提示只将对象和数组视为 JSON 候选', () => {
    expect(isJsonContainerCandidate('  {"id":1}')).toBe(true);
    expect(isJsonContainerCandidate('\n[1,2,3]')).toBe(true);
    expect(isJsonContainerCandidate('"plain string"')).toBe(false);
  });

  it('非容器内容可跳过实时 JSON 错误提示', () => {
    expect(validateJsonForEditor('hello world', { requireContainer: true })).toEqual({ isValid: true });
  });

  it('预览回写校验仍会拦截非法文本', () => {
    const result = validateJsonForEditor('hello world');

    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
