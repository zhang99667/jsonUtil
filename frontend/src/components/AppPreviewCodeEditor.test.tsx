import { describe, expect, it, vi } from 'vitest';
import { CodeEditor } from './Editor';
import { PreviewEditorHeaderActions } from './EditorHeaderActions';
import { AppPreviewCodeEditor, type AppPreviewCodeEditorProps } from './AppPreviewCodeEditor';
import type { AppEditorUiState } from '../utils/appEditorUiState';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const editorUiState: AppEditorUiState = {
  hasSourceContent: true,
  hasPreviewContent: true,
  isPreviewSameAsSource: false,
  isSourceJsonCandidate: true,
  sourceStandaloneDeepFormatKind: null,
  canUseAutoSave: true,
  isAutoSaveActive: false,
  autoSaveTitle: '自动保存',
  autoSaveAriaLabel: '自动保存',
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
};

const buildProps = (overrides: Partial<AppPreviewCodeEditorProps> = {}): AppPreviewCodeEditorProps => ({
  output: '{"a":1}',
  isOutputTransforming: false,
  previewValidation: { isValid: false, error: 'Preview error' },
  previewErrorLocation: { line: 1, column: 6 },
  deepFormatWarning: 'deep warning',
  deepFormatInfo: 'deep info',
  hasTransformReportContext: true,
  highlightRange: {
    startLine: 1,
    startColumn: 1,
    endLine: 1,
    endColumn: 8,
  },
  editorUiState,
  onOutputChange: vi.fn(),
  onPreviewFocus: vi.fn(),
  onCursorPositionChange: vi.fn(),
  onOpenTransformReport: vi.fn(),
  onApplyPreviewToSource: vi.fn(),
  onCopyPreview: vi.fn(),
  onSchemeEdit: vi.fn(),
  ...overrides,
});

describe('AppPreviewCodeEditor', () => {
  it('装配 PREVIEW CodeEditor 的校验、提示、高亮和头部动作参数', () => {
    const props = buildProps();
    const tree = AppPreviewCodeEditor(props);

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('AppPreviewCodeEditor 应返回 React 元素');
    expect(tree.type).toBe(CodeEditor);
    expect(tree.props.label).toBe('PREVIEW');
    expect(tree.props.value).toBe('{"a":1}');
    expect(tree.props.onChange).toBe(props.onOutputChange);
    expect(tree.props.onFocus).toBe(props.onPreviewFocus);
    expect(tree.props.onCursorPositionChange).toBe(props.onCursorPositionChange);
    expect(tree.props.readOnly).toBe(true);
    expect(tree.props.canToggleReadOnly).toBe(true);
    expect(tree.props.placeholder).toBe('// 结果显示区...');
    expect(tree.props.error).toBe('Preview error');
    expect(tree.props.errorLocation).toEqual({ line: 1, column: 6 });
    expect(tree.props.warning).toBe('deep warning');
    expect(tree.props.info).toBe('deep info');
    expect(tree.props.highlightRange).toEqual(props.highlightRange);
    expect(tree.props.onSchemeEdit).toBe(props.onSchemeEdit);

    const headerActions = tree.props.headerActions;
    expect(isElementLike(headerActions)).toBe(true);
    if (!isElementLike(headerActions)) throw new Error('PREVIEW 头部动作应为 React 元素');
    expect(headerActions.type).toBe(PreviewEditorHeaderActions);
    expect(headerActions.props.editorUiState).toBe(props.editorUiState);
    expect(headerActions.props.isOutputTransforming).toBe(false);
    expect(headerActions.props.showTransformReportButton).toBe(true);
    expect(headerActions.props.hasTransformReportContext).toBe(true);
    expect(headerActions.props.onOpenTransformReport).toBe(props.onOpenTransformReport);
    expect(headerActions.props.onApplyPreviewToSource).toBe(props.onApplyPreviewToSource);
    expect(headerActions.props.onCopyPreview).toBe(props.onCopyPreview);
  });

  it('在预览有效或转换中时同步只读切换和错误状态', () => {
    const validTree = AppPreviewCodeEditor(buildProps({
      isOutputTransforming: true,
      previewValidation: { isValid: true },
      deepFormatInfo: undefined,
    }));

    expect(isElementLike(validTree)).toBe(true);
    if (!isElementLike(validTree)) throw new Error('AppPreviewCodeEditor 应返回 React 元素');
    expect(validTree.props.error).toBeUndefined();
    expect(validTree.props.canToggleReadOnly).toBe(false);

    const headerActions = validTree.props.headerActions;
    expect(isElementLike(headerActions)).toBe(true);
    if (!isElementLike(headerActions)) throw new Error('PREVIEW 头部动作应为 React 元素');
    expect(headerActions.props.isOutputTransforming).toBe(true);
    expect(headerActions.props.showTransformReportButton).toBe(false);
  });
});
