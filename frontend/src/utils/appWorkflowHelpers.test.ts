import { describe, expect, it } from 'vitest';
import {
  getApplyPreviewConfirmMessage,
  getApplySchemaExampleConfirmMessage,
  getClearSourceConfirmMessage,
  getContentSizeSummary,
  getCopySuccessMessage,
  getPasteSourceConfirmMessage,
  getSchemeInspectConfirmMessage,
  getSourceUpdateSuccessMessage,
  isPlaceholderFillTemplateJson,
} from './appWorkflowHelpers';

describe('appWorkflowHelpers', () => {
  it('格式化内容大小与复制成功文案', () => {
    expect(getContentSizeSummary('abc')).toBe('3 字符 / 3 B');
    expect(getContentSizeSummary('中文')).toBe('2 字符 / 6 B');
    expect(getCopySuccessMessage('源内容', 'abc')).toBe('已复制源内容（3 字符 / 3 B）');
    expect(getSourceUpdateSuccessMessage('已打开文件', '中文')).toBe('已打开文件（2 字符 / 6 B）');
  });

  it('生成清空 SOURCE 确认文案', () => {
    expect(getClearSourceConfirmMessage('abc', false)).toBe('');
    expect(getClearSourceConfirmMessage('abc', true)).toBe(
      '这会清空当前 SOURCE 编辑区内容，并将当前标签标记为未保存。\n当前 SOURCE: 3 字符 / 3 B'
    );
  });

  it('生成替换 SOURCE 确认文案', () => {
    expect(getPasteSourceConfirmMessage('abc', null)).toBe('');
    expect(getPasteSourceConfirmMessage('abc', '中文')).toBe(
      '这会用剪贴板文本替换当前 SOURCE 编辑区内容，并将当前标签标记为未保存。\n当前 SOURCE: 3 字符 / 3 B\n剪贴板文本: 2 字符 / 6 B'
    );
  });

  it('生成应用 PREVIEW 与 Schema 示例确认文案', () => {
    expect(getApplyPreviewConfirmMessage('abc', null)).toBe('');
    expect(getApplyPreviewConfirmMessage('abc', '{}')).toBe(
      '这会用当前 PREVIEW 内容替换 SOURCE 编辑区，并将当前标签标记为未保存。\n当前 SOURCE: 3 字符 / 3 B\nPREVIEW: 2 字符 / 2 B'
    );
    expect(getApplySchemaExampleConfirmMessage('abc', '[]')).toBe(
      '这会用当前 Schema 生成的示例 JSON 替换 SOURCE 编辑区，并将当前标签标记为未保存。\n当前 SOURCE: 3 字符 / 3 B\nSchema 示例: 2 字符 / 2 B'
    );
  });

  it('生成 Scheme 原始值排查确认文案', () => {
    expect(getSchemeInspectConfirmMessage('abc', null)).toBe('');
    expect(getSchemeInspectConfirmMessage('abc', 'sampleapp://v1')).toBe(
      '这会用 Scheme 面板原始值替换 SOURCE，并切换到嵌套解析、打开深度解析报告。\n当前 SOURCE: 3 字符 / 3 B\nScheme 原始值: 14 字符 / 14 B'
    );
  });

  it('识别运行时占位符回填模板 JSON', () => {
    expect(isPlaceholderFillTemplateJson(JSON.stringify({
      kind: 'json-helper-runtime-placeholder-fill-template',
      replacements: [],
    }))).toBe(true);
    expect(isPlaceholderFillTemplateJson(JSON.stringify({ kind: 'other-template' }))).toBe(false);
    expect(isPlaceholderFillTemplateJson('not json')).toBe(false);
  });
});
