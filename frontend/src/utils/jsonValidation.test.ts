import { describe, expect, it } from 'vitest';
import {
  cleanJsonInput,
  getJsonValidationErrorLocation,
  isJsonContainerCandidate,
  validateJsonForEditor,
} from './jsonValidation';

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

  it('从普通 JSON position 错误中提取行列', () => {
    const input = '{\n  "ok": true,\n  "bad":\n}';
    const location = getJsonValidationErrorLocation(
      input,
      'Expected value in JSON at position 25'
    );

    expect(location).toEqual({ line: 4, column: 1 });
  });

  it('优先使用普通 JSON line/column 错误定位', () => {
    const location = getJsonValidationErrorLocation(
      '{"bad":}',
      "Expected value in JSON at position 7 (line 1 column 8)"
    );

    expect(location).toEqual({ line: 1, column: 8 });
  });

  it('从 JSON Lines 错误中提取实际行号与缩进列号', () => {
    const input = '{"a":1}\n  {"b":}\n{"c":3}';
    const location = getJsonValidationErrorLocation(
      input,
      'JSON Lines 第 2 行解析错误: Expected value in JSON at position 5'
    );

    expect(location).toEqual({ line: 2, column: 8 });
  });
});
