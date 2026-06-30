import { describe, expect, it, vi } from 'vitest';
import { AppSourceCodeEditor } from './AppSourceCodeEditor';
import { AppSourceEditorPane, type AppSourceEditorPaneProps } from './AppSourceEditorPane';
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
  hasPreviewContent: false,
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

const buildProps = (): AppSourceEditorPaneProps => ({
  input: '{"a":1}',
  activeFile: null,
  activeFileId: null,
  files: [],
  leftPaneWidthPercent: 42,
  isProcessing: false,
  sourceValidation: { isValid: true },
  sourceErrorLocation: null,
  sourceErrorLocateSignal: 0,
  jsonSchemaWarning: '',
  jsonSchemaDiagnosticHighlights: [],
  editorUiState,
  onInputChange: vi.fn(),
  onSourceFocus: vi.fn(),
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
});

describe('AppSourceEditorPane', () => {
  it('只负责 SOURCE Pane 宽度容器并透传编辑器参数', () => {
    const props = buildProps();
    const tree = AppSourceEditorPane(props);

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('AppSourceEditorPane 应返回 React 元素');
    expect(tree.type).toBe('div');
    expect(tree.props['data-tour']).toBe('source-editor');
    expect(tree.props.style).toEqual({ width: '42%' });

    const child = tree.props.children;
    expect(isElementLike(child)).toBe(true);
    if (!isElementLike(child)) throw new Error('SOURCE Pane 应装配 AppSourceCodeEditor');
    expect(child.type).toBe(AppSourceCodeEditor);
    expect(child.props.input).toBe(props.input);
    expect(child.props.onSourceAiFix).toBe(props.onSourceAiFix);
    expect(child.props.leftPaneWidthPercent).toBeUndefined();
  });
});
