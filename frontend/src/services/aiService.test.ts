import { describe, expect, it } from 'vitest';
import { normalizeAiJsonResponse } from './aiService';

describe('normalizeAiJsonResponse', () => {
  it('直接返回压缩后的有效 JSON', () => {
    expect(normalizeAiJsonResponse('{ "name": "json", "ok": true }')).toBe('{"name":"json","ok":true}');
  });

  it('支持提取 Markdown 代码块中的 JSON', () => {
    const response = '修复结果如下：\n```json\n{ "items": [1, 2] }\n```';
    expect(normalizeAiJsonResponse(response)).toBe('{"items":[1,2]}');
  });

  it('支持从解释文本中提取第一个完整 JSON 片段', () => {
    const response = '已修复：{"nested":{"value":"ok"}}，请确认。';
    expect(normalizeAiJsonResponse(response)).toBe('{"nested":{"value":"ok"}}');
  });

  it('空返回回退为空对象', () => {
    expect(normalizeAiJsonResponse('   ')).toBe('{}');
  });

  it('无有效 JSON 时抛出可读错误', () => {
    expect(() => normalizeAiJsonResponse('无法修复这段内容')).toThrow('AI 返回内容不是有效 JSON');
  });
});
