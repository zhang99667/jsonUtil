import { describe, expect, it } from 'vitest';
import {
  formatJsonPathItemsForCopy,
  formatJsonPathValuesForCopy,
  getJsonPathCopyCountLabel,
} from './jsonPathPanelCopy';

describe('jsonPathPanelCopy', () => {
  it('单个字符串结果复制原文，避免额外 JSON 引号', () => {
    expect(formatJsonPathValuesForCopy(['hello'])).toBe('hello');
  });

  it('单个结构化结果复制格式化 JSON', () => {
    expect(formatJsonPathValuesForCopy([{ id: 1, ok: true }])).toBe(`{
  "id": 1,
  "ok": true
}`);
  });

  it('多个结果复制为格式化数组', () => {
    expect(formatJsonPathValuesForCopy(['Ada', 42])).toBe(`[
  "Ada",
  42
]`);
  });

  it('路径和值复制时字符串带 JSON 引号，基础类型保持 JSON 表示', () => {
    expect(formatJsonPathItemsForCopy([
      { path: '$.name', value: 'Ada', range: null, pointer: '/name' },
      { path: '$.age', value: 42, range: null, pointer: '/age' },
      { path: '$.missing', value: undefined, range: null, pointer: '/missing' },
    ])).toBe('$.name = "Ada"\n$.age = 42\n$.missing = undefined');
  });

  it('复制数量文案区分完整结果和性能截断结果', () => {
    expect(getJsonPathCopyCountLabel(3, false)).toBe('3 项');
    expect(getJsonPathCopyCountLabel(100, true)).toBe('已返回 100 项');
  });
});
