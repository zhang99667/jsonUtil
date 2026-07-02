import { describe, expect, it, vi } from 'vitest';
import { AppEditorSplitPanes } from './AppEditorSplitPanes';
import { AppEditorWorkspace } from './AppEditorWorkspace';
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

type AppEditorWorkspaceInput = Parameters<typeof AppEditorWorkspace>[0];

const buildProps = (overrides: Partial<AppEditorWorkspaceInput> = {}): AppEditorWorkspaceInput => ({
  input: '{"a":1}',
  output: '{\n  "a": 1\n}',
  activeFile: null,
  activeFileId: null,
  files: [],
  activeEditor: 'SOURCE',
  leftPaneWidthPercent: 50,
  isPaneResizing: false,
  isProcessing: false,
  isOutputTransforming: false,
  aiRepairSummary: null,
  sourceValidation: { isValid: true },
  previewValidation: { isValid: true },
  sourceErrorLocation: null,
  previewErrorLocation: null,
  sourceErrorLocateSignal: 0,
  jsonSchemaWarning: '',
  jsonSchemaDiagnosticHighlights: [],
  deepFormatWarning: undefined,
  deepFormatInfo: undefined,
  hasTransformReportContext: false,
  highlightRange: null,
  editorUiState,
  onInputChange: vi.fn(),
  onOutputChange: vi.fn(),
  onSourceFocus: vi.fn(),
  onPreviewFocus: vi.fn(),
  onCursorPositionChange: vi.fn(),
  onTabClick: vi.fn(),
  onCloseFile: vi.fn(),
  onNewTab: vi.fn(),
  onSaveViewState: vi.fn(),
  onSourceAiFix: vi.fn(),
  onPasteSource: vi.fn(),
  onCopySource: vi.fn(),
  onClearSource: vi.fn(),
  onToggleAutoSave: vi.fn(),
  onOpenTransformReport: vi.fn(),
  onApplyPreviewToSource: vi.fn(),
  onCopyPreview: vi.fn(),
  onSchemeEdit: vi.fn(),
  onPaneResizeMouseDown: vi.fn(),
  onPaneResizeKeyDown: vi.fn(),
  onCloseAiRepairSummary: vi.fn(),
  onCopyAiRepairSummarySuccess: vi.fn(),
  onCopyAiRepairSummaryError: vi.fn(),
  ...overrides,
});

const getSplitPanesProps = (props: AppEditorWorkspaceInput) => {
  const tree = AppEditorWorkspace(props);
  if (!isElementLike(tree)) throw new Error('AppEditorWorkspace 应返回 React 元素');

  const children = Array.isArray(tree.props.children) ? tree.props.children : [tree.props.children];
  const splitPanes = children.find(child => isElementLike(child) && child.type === AppEditorSplitPanes);
  if (!isElementLike(splitPanes)) throw new Error('AppEditorWorkspace 应装配 AppEditorSplitPanes');

  return splitPanes.props;
};

describe('AppEditorWorkspace', () => {
  it('SOURCE 活跃时忽略 PREVIEW 刷新触发的光标事件', () => {
    const onCursorPositionChange = vi.fn();
    const splitPanesProps = getSplitPanesProps(buildProps({
      activeEditor: 'SOURCE',
      onCursorPositionChange,
    }));

    const sourcePane = splitPanesProps.sourcePane;
    const previewPane = splitPanesProps.previewPane;
    if (!isElementLike(sourcePane) || !isElementLike(previewPane)) {
      throw new Error('编辑区应装配 SOURCE 和 PREVIEW Pane');
    }

    (previewPane.props.onCursorPositionChange as (line: number, column: number) => void)(99, 1);
    expect(onCursorPositionChange).not.toHaveBeenCalled();

    (sourcePane.props.onCursorPositionChange as (line: number, column: number) => void)(12, 4);
    expect(onCursorPositionChange).toHaveBeenCalledWith(12, 4);
  });
});
