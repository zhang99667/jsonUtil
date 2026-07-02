import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AppEditorUiState } from '../utils/appEditorUiState';
import { PreviewEditorHeaderActions, SourceEditorHeaderActions } from './EditorHeaderActions';
import { isElementLike, type ElementLike } from './schemeViewerElementTestHelpers';

const buildEditorUiState = (overrides: Partial<AppEditorUiState> = {}): AppEditorUiState => ({
  hasSourceContent: true,
  hasPreviewContent: true,
  isPreviewSameAsSource: false,
  isSourceJsonCandidate: true,
  sourceStandaloneDeepFormatKind: null,
  canUseAutoSave: true,
  isAutoSaveActive: false,
  autoSaveTitle: '自动保存',
  autoSaveAriaLabel: '自动保存当前文件',
  copySourceTitle: '复制 SOURCE',
  clearSourceTitle: '清空 SOURCE',
  sourceAiRepairTitle: '使用 AI 修复 SOURCE JSON',
  transformReportTitle: '深度解析报告',
  applyPreviewTitle: '应用 PREVIEW',
  copyPreviewTitle: '复制 PREVIEW',
  clearSourceConfirmMessage: '',
  pasteSourceConfirmMessage: '',
  applyPreviewConfirmMessage: '',
  applySchemaExampleConfirmMessage: '',
  schemeInspectConfirmMessage: '',
  ...overrides,
});

const findByActionTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findByActionTour(child, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props.dataTour === dataTour ? [node] : [];
  return matches.concat(findByActionTour(node.props.children, dataTour));
};

const getByActionTour = (tree: unknown, dataTour: string): ElementLike => {
  const node = findByActionTour(tree, dataTour)[0];
  if (!node) throw new Error(`缺少 data-tour=${dataTour} 的节点`);
  return node;
};

describe('EditorHeaderActions', () => {
  it('SOURCE 动作保留按钮语义和自动保存状态', () => {
    const onToggleAutoSave = vi.fn();
    const tree = SourceEditorHeaderActions({
      editorUiState: buildEditorUiState({
        hasSourceContent: false,
        isAutoSaveActive: true,
        canUseAutoSave: false,
      }),
      hasActiveFile: true,
      onPasteSource: vi.fn(),
      onCopySource: vi.fn(),
      onClearSource: vi.fn(),
      onToggleAutoSave,
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain('data-tour="paste-source"');
    expect(html).toContain('title="从剪贴板粘贴到 SOURCE"');
    expect(html).toContain('粘贴');
    expect(getByActionTour(tree, 'copy-source').props.disabled).toBe(true);
    expect(getByActionTour(tree, 'clear-source').props.disabled).toBe(true);

    const autoSaveButton = getByActionTour(tree, 'auto-save');
    expect(html).toContain('aria-label="自动保存当前文件"');
    expect(html).toContain('aria-pressed="true"');
    expect(autoSaveButton.props.className).toContain('bg-status-success-bg');
    expect(autoSaveButton.props.onClick).toBe(onToggleAutoSave);
  });

  it('PREVIEW 动作保留报告按钮开关和转换中禁用态', () => {
    const tree = PreviewEditorHeaderActions({
      editorUiState: buildEditorUiState({
        isPreviewSameAsSource: true,
      }),
      isOutputTransforming: true,
      showTransformReportButton: true,
      hasTransformReportContext: true,
      onOpenTransformReport: vi.fn(),
      onApplyPreviewToSource: vi.fn(),
      onCopyPreview: vi.fn(),
    });

    expect(getByActionTour(tree, 'transform-report-button').props.disabled).toBe(true);
    expect(getByActionTour(tree, 'apply-preview-to-source').props.disabled).toBe(true);
    expect(getByActionTour(tree, 'copy-preview').props.disabled).toBe(true);
  });

  it('PREVIEW 可按上层配置隐藏报告入口', () => {
    const tree = PreviewEditorHeaderActions({
      editorUiState: buildEditorUiState(),
      isOutputTransforming: false,
      showTransformReportButton: false,
      hasTransformReportContext: true,
      onOpenTransformReport: vi.fn(),
      onApplyPreviewToSource: vi.fn(),
      onCopyPreview: vi.fn(),
    });
    const html = renderToStaticMarkup(tree);

    expect(findByActionTour(tree, 'transform-report-button')).toHaveLength(0);
    expect(html).not.toContain('data-tour="transform-report-button"');
    expect(html).toContain('title="复制 PREVIEW"');
  });
});
