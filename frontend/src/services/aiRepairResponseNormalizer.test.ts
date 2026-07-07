import { describe, expect, it } from 'vitest';
import {
  normalizeAiJsonResponse,
  tryNormalizeJson,
} from './aiRepairResponseNormalizer';

describe('aiRepairResponseNormalizer', () => {
  it('直接返回压缩后的有效 JSON', () => {
    expect(normalizeAiJsonResponse('{ "name": "json", "ok": true }')).toBe('{"name":"json","ok":true}');
  });

  it('支持提取 Markdown 代码块中的 JSON', () => {
    const response = '修复结果如下：\n```json\n{ "items": [1, 2] }\n```';
    expect(normalizeAiJsonResponse(response)).toBe('{"items":[1,2]}');
  });

  it('多个 Markdown 代码块时跳过非法候选', () => {
    const response = '原始片段：\n```json\n{bad}\n```\n修复结果：\n```json\n{ "ok": true }\n```';
    expect(normalizeAiJsonResponse(response)).toBe('{"ok":true}');
  });

  it('超长解释前缀不会影响 Markdown JSON 提取', () => {
    const response = `${'{'.repeat(50_000)}\n修复结果：\n\`\`\`json\n{ "ok": true }\n\`\`\``;
    expect(normalizeAiJsonResponse(response)).toBe('{"ok":true}');
  });

  it('支持从解释文本中提取完整 JSON 片段', () => {
    const response = '已修复：{"nested":{"value":"ok"}}，请确认。';
    expect(normalizeAiJsonResponse(response)).toBe('{"nested":{"value":"ok"}}');
  });

  it('解释文本中多个有效 JSON 片段时优先使用最后一个修复结果', () => {
    const response = '原始示例 {"bad":true}，修复结果 {"ok":true}';
    expect(normalizeAiJsonResponse(response)).toBe('{"ok":true}');
  });

  it('解释文本中先出现非法片段时继续查找有效 JSON', () => {
    const response = '模型先复述坏输入 {bad}，再给修复结果 {"ok":true}';
    expect(normalizeAiJsonResponse(response)).toBe('{"ok":true}');
  });

  it('提取片段时保留字符串里的括号文本', () => {
    const response = '修复：{"text":"literal {keep} [ok]","items":[1]} done';
    expect(normalizeAiJsonResponse(response)).toBe('{"text":"literal {keep} [ok]","items":[1]}');
  });

  it('模型明确返回空对象时保留为合法 JSON', () => {
    expect(normalizeAiJsonResponse('  {}  ')).toBe('{}');
  });

  it('空白响应不再回退为空对象', () => {
    expect(() => normalizeAiJsonResponse('   ')).toThrow('AI 返回内容不是有效 JSON');
  });

  it('无有效 JSON 时抛出可读错误', () => {
    expect(() => normalizeAiJsonResponse('无法修复这段内容')).toThrow('AI 返回内容不是有效 JSON');
  });

  it('大量未闭合括号会按扫描预算失败', () => {
    const response = `模型输出异常：${'{'.repeat(50_000)}`;
    expect(() => normalizeAiJsonResponse(response)).toThrow('AI 返回内容不是有效 JSON');
  });

  it('tryNormalizeJson 对非法 JSON 返回 null', () => {
    expect(tryNormalizeJson('{bad')).toBeNull();
  });
});
