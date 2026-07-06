import { describe, expect, it } from 'vitest';
import {
  buildPlaceholderTemplateSummary,
  formatTemplateSizeLabel,
  parsePlaceholderTemplateDraft,
  PLACEHOLDER_FILL_TEMPLATE_KIND,
  updatePlaceholderReplacement,
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

  it('更新 replacement 时同步 placeholders 和详情行', () => {
    const updated = JSON.parse(updatePlaceholderReplacement(createTemplateText(), '__UID__', '10086'));

    expect(updated.placeholders.__UID__).toBe('10086');
    expect(updated.placeholders.__TOKEN__).toBe('old-token');
    expect(updated.placeholderDetails.find((detail: { value: string }) => detail.value === '__UID__')).toMatchObject({
      value: '__UID__',
      replacement: '10086',
      description: '用户 ID',
    });
  });

  it('非回填模板 replacement 更新保持原文不变', () => {
    const templateText = JSON.stringify({ hello: 'world' });

    expect(updatePlaceholderReplacement(templateText, '__UID__', '10086')).toBe(templateText);
  });

  it('格式化模板大小文案', () => {
    expect(formatTemplateSizeLabel('中文ab')).toBe('4 字符 / 8 B');
  });
});
