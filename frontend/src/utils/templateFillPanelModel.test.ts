import { describe, expect, it } from 'vitest';
import {
  buildPlaceholderTemplateSummary,
  formatTemplateSizeLabel,
  parsePlaceholderTemplateDraft,
  PLACEHOLDER_FILL_TEMPLATE_KIND,
  validateTemplateJson,
} from './templateFillPanelModel';

const createTemplateText = () => JSON.stringify({
  kind: PLACEHOLDER_FILL_TEMPLATE_KIND,
  placeholders: {
    __UID__: '',
    __TOKEN__: 'old-token',
    ignoredNumber: 12,
  },
  placeholderDetails: [
    {
      value: '__UID__',
      replacement: '',
      description: '用户 ID',
      suggestion: {
        replacement: '10086',
        sourcePath: '$.user.id',
        sourceLabel: 'user.id',
        reason: '字段名匹配',
      },
      sources: [
        {
          sourcePath: '$.user.id',
          sourceLabel: 'user.id',
          sourceOriginalPreview: '10086',
        },
        { sourceLabel: 'invalid source' },
      ],
    },
    {
      value: '__TOKEN__',
      suggestion: {
        replacement: 'missing-source',
      },
      sources: [],
    },
    { value: '', replacement: 'skip empty value' },
  ],
});

describe('templateFillPanelModel', () => {
  it('解析回填模板草稿并保留候选和来源信息', () => {
    const draft = parsePlaceholderTemplateDraft(createTemplateText());

    expect(draft?.placeholders).toEqual({
      __UID__: '',
      __TOKEN__: 'old-token',
    });
    expect(draft?.placeholderDetails).toEqual([
      {
        value: '__UID__',
        replacement: '',
        description: '用户 ID',
        suggestion: {
          replacement: '10086',
          sourcePath: '$.user.id',
          sourceLabel: 'user.id',
          reason: '字段名匹配',
        },
        sources: [{
          sourcePath: '$.user.id',
          sourceLabel: 'user.id',
          sourceOriginalPreview: '10086',
        }],
      },
      {
        value: '__TOKEN__',
        replacement: 'old-token',
        sources: [],
      },
    ]);
  });

  it('统计 replacement 完成度和候选数量', () => {
    expect(buildPlaceholderTemplateSummary(createTemplateText())).toEqual({
      total: 2,
      filled: 1,
      suggested: 1,
      pending: 1,
    });
  });

  it('缺少详情行时从 placeholders 回退生成草稿行', () => {
    const draft = parsePlaceholderTemplateDraft(JSON.stringify({
      kind: PLACEHOLDER_FILL_TEMPLATE_KIND,
      placeholders: {
        __A__: 'a',
        __B__: '',
      },
    }));

    expect(draft?.placeholderDetails).toEqual([
      { value: '__A__', replacement: 'a', sources: [] },
      { value: '__B__', replacement: '', sources: [] },
    ]);
  });

  it('忽略非回填模板、空模板和无有效占位符模板', () => {
    expect(parsePlaceholderTemplateDraft('')).toBeNull();
    expect(parsePlaceholderTemplateDraft('{bad json')).toBeNull();
    expect(parsePlaceholderTemplateDraft(JSON.stringify({ kind: 'other', placeholders: { a: '' } }))).toBeNull();
    expect(parsePlaceholderTemplateDraft(JSON.stringify({
      kind: PLACEHOLDER_FILL_TEMPLATE_KIND,
      placeholders: { count: 1 },
    }))).toBeNull();
  });

  it('格式化模板大小文案', () => {
    expect(formatTemplateSizeLabel('中文ab')).toBe('4 字符 / 8 B');
  });

  it('模板操作只接受单个标准 JSON 值', () => {
    expect(validateTemplateJson('')).toEqual({ isValid: true });
    expect(validateTemplateJson('{"ok":true}')).toEqual({ isValid: true });

    for (const input of [
      '{"a":1}\n{"b":2}',
      'const response = {"code":0};',
      'callback({"code":0});',
      '```json\n{"code":0}\n```',
      '{\n  // 标准 JSON 不允许注释\n  "code": 0\n}',
      "{name:'JSONUtils',}",
    ]) {
      const result = validateTemplateJson(input);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    }
  });
});
