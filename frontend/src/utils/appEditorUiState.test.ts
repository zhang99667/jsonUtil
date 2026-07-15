import { describe, expect, it } from 'vitest';
import { buildAppEditorUiState } from './appEditorUiState';

describe('appEditorUiState', () => {
  it('生成 SOURCE/PREVIEW 基础派生状态和标题', () => {
    const state = buildAppEditorUiState({
      sourceText: '{"a":1}',
      previewText: '{\n  "a": 1\n}',
      isProcessing: false,
      isOutputTransforming: false,
      hasActiveFile: true,
      activeFileHasHandle: true,
      isAutoSaveEnabled: true,
      hasTransformReportContext: true,
      isClearSourceConfirmOpen: false,
      pendingPasteSourceText: null,
      pendingApplyPreviewText: null,
      pendingSchemaExampleText: null,
      pendingSchemeInspectSourceText: null,
    });

    expect(state.hasSourceContent).toBe(true);
    expect(state.hasPreviewContent).toBe(true);
    expect(state.isPreviewSameAsSource).toBe(false);
    expect(state.isSourceJsonCandidate).toBe(true);
    expect(state.canUseAutoSave).toBe(true);
    expect(state.isAutoSaveActive).toBe(true);
    expect(state.autoSaveAriaLabel).toBe('自动保存已开启，点击关闭');
    expect(state.transformReportTitle).toBe('查看深度解析报告');
    expect(state.applyPreviewTitle).toBe('用 PREVIEW 内容替换 SOURCE');
  });

  it('生成空内容、处理中和确认弹窗文案', () => {
    const state = buildAppEditorUiState({
      sourceText: '',
      previewText: '',
      isProcessing: true,
      isOutputTransforming: true,
      hasActiveFile: false,
      activeFileHasHandle: false,
      isAutoSaveEnabled: false,
      hasTransformReportContext: false,
      isClearSourceConfirmOpen: true,
      pendingPasteSourceText: '中文',
      pendingApplyPreviewText: '{}',
      pendingSchemaExampleText: '[]',
      pendingSchemeInspectSourceText: 'sampleapp://v1',
    });

    expect(state.hasSourceContent).toBe(false);
    expect(state.copySourceTitle).toBe('SOURCE 为空，暂无内容可复制');
    expect(state.sourceAiRepairTitle).toBe('智能修复中，请等待当前任务完成');
    expect(state.transformReportTitle).toBe('预览仍在处理，请稍后查看报告');
    expect(state.copyPreviewTitle).toBe('预览仍在处理，请稍后复制');
    expect(state.autoSaveTitle).toBe('请先打开文件以启用自动保存');
    expect(state.pasteSourceConfirmMessage).toContain('剪贴板文本: 2 字符 / 6 B');
    expect(state.applyPreviewConfirmMessage).toContain('PREVIEW: 2 字符 / 2 B');
    expect(state.applySchemaExampleConfirmMessage).toContain('Schema 示例: 2 字符 / 2 B');
    expect(state.schemeInspectConfirmMessage).toContain('Scheme 原始值: 14 字符 / 14 B');
  });

  it('识别可独立嵌套解析的 Scheme 输入', () => {
    const state = buildAppEditorUiState({
      sourceText: 'sampleapp://v1/open?params=%7B%7D',
      previewText: '',
      isProcessing: false,
      isOutputTransforming: false,
      hasActiveFile: true,
      activeFileHasHandle: false,
      isAutoSaveEnabled: false,
      hasTransformReportContext: false,
      isClearSourceConfirmOpen: false,
      pendingPasteSourceText: null,
      pendingApplyPreviewText: null,
      pendingSchemaExampleText: null,
      pendingSchemeInspectSourceText: null,
    });

    expect(state.isSourceJsonCandidate).toBe(false);
    expect(state.sourceStandaloneDeepFormatKind).toBe('scheme');
  });
});
