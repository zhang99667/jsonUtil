import { describe, expect, it } from 'vitest';
import {
  buildApplyPreviewToSourcePlan,
  buildApplySchemaExampleToSourcePlan,
  buildSchemeInspectSourcePlan,
  buildPasteSourcePlan,
} from './appSourceReplacePlans';

describe('appSourceReplacePlans', () => {
  it('规划剪贴板粘贴到 SOURCE 的跳过、确认和应用状态', () => {
    expect(buildPasteSourcePlan('source', '')).toEqual({
      action: 'skip',
      feedback: 'error',
      message: '剪贴板为空，暂无可粘贴内容',
    });
    expect(buildPasteSourcePlan('source', 'source')).toEqual({
      action: 'skip',
      feedback: 'success',
      message: '剪贴板内容已在 SOURCE 中',
    });
    expect(buildPasteSourcePlan('source', 'next')).toEqual({
      action: 'confirm',
      pendingText: 'next',
    });
    expect(buildPasteSourcePlan('   ', 'next')).toEqual({
      action: 'apply',
      text: 'next',
      successMessage: '已从剪贴板粘贴到 SOURCE',
    });
  });

  it('规划应用 PREVIEW 到 SOURCE 的处理中、空态、相同、确认和应用状态', () => {
    expect(buildApplyPreviewToSourcePlan('source', 'preview', true)).toEqual({
      action: 'skip',
      feedback: 'error',
      message: '预览仍在处理，请稍后应用',
    });
    expect(buildApplyPreviewToSourcePlan('source', '   ', false)).toEqual({
      action: 'skip',
      feedback: 'error',
      message: '预览内容为空，暂无可应用内容',
    });
    expect(buildApplyPreviewToSourcePlan('same', 'same', false)).toEqual({
      action: 'skip',
      feedback: 'success',
      message: 'PREVIEW 内容已在 SOURCE 中',
    });
    expect(buildApplyPreviewToSourcePlan('source', 'preview', false)).toEqual({
      action: 'confirm',
      pendingText: 'preview',
    });
    expect(buildApplyPreviewToSourcePlan('', 'preview', false)).toEqual({
      action: 'apply',
      text: 'preview',
      successMessage: '已将 PREVIEW 应用到 SOURCE',
    });
  });

  it('规划应用 Schema 示例到 SOURCE 的空态、相同、确认和应用状态', () => {
    expect(buildApplySchemaExampleToSourcePlan('source', '')).toEqual({
      action: 'skip',
      feedback: 'error',
      message: 'Schema 示例为空，暂无可应用内容',
    });
    expect(buildApplySchemaExampleToSourcePlan('same', 'same')).toEqual({
      action: 'skip',
      feedback: 'success',
      message: 'Schema 示例已在 SOURCE 中',
    });
    expect(buildApplySchemaExampleToSourcePlan('source', '{}')).toEqual({
      action: 'confirm',
      pendingText: '{}',
    });
    expect(buildApplySchemaExampleToSourcePlan('   ', '{}')).toEqual({
      action: 'apply',
      text: '{}',
      successMessage: '已将 Schema 示例应用到 SOURCE',
    });
  });

  it('规划 Scheme 原始值排查 SOURCE 的空态、相同、确认和应用状态', () => {
    expect(buildSchemeInspectSourcePlan('source', '')).toEqual({
      action: 'skip',
      feedback: 'error',
      message: 'Scheme 原始值为空，暂无可排查内容',
    });
    expect(buildSchemeInspectSourcePlan('same', 'same')).toEqual({
      action: 'skip',
      feedback: 'success',
      message: 'Scheme 原始值已在 SOURCE 中，可手动查看深度解析报告',
    });
    expect(buildSchemeInspectSourcePlan('source', 'baiduboxapp://v1/open')).toEqual({
      action: 'confirm',
      pendingText: 'baiduboxapp://v1/open',
    });
    expect(buildSchemeInspectSourcePlan('   ', 'baiduboxapp://v1/open')).toEqual({
      action: 'apply',
      text: 'baiduboxapp://v1/open',
      successMessage: '已用 Scheme 原始值开始排查',
    });
  });
});
