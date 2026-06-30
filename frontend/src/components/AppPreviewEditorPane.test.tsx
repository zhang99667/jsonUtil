import { describe, expect, it, vi } from 'vitest';
import { AppPreviewCodeEditor } from './AppPreviewCodeEditor';
import { AppPreviewEditorPane, type AppPreviewEditorPaneProps } from './AppPreviewEditorPane';
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

const buildProps = (): AppPreviewEditorPaneProps => ({
  output: '{"a":1}',
  isOutputTransforming: false,
  previewValidation: { isValid: true },
  previewErrorLocation: null,
  deepFormatWarning: undefined,
  deepFormatInfo: undefined,
  hasTransformReportContext: false,
  highlightRange: null,
  editorUiState,
  onOutputChange: vi.fn(),
  onPreviewFocus: vi.fn(),
  onCursorPositionChange: vi.fn(),
  onOpenTransformReport: vi.fn(),
  onApplyPreviewToSource: vi.fn(),
  onCopyPreview: vi.fn(),
  onSchemeEdit: vi.fn(),
});

describe('AppPreviewEditorPane', () => {
  it('只负责 PREVIEW Pane 容器并透传编辑器参数', () => {
    const props = buildProps();
    const tree = AppPreviewEditorPane(props);

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('AppPreviewEditorPane 应返回 React 元素');
    expect(tree.type).toBe('div');
    expect(tree.props['data-tour']).toBe('preview-editor');
    expect(tree.props.className).toContain('flex-1');

    const child = tree.props.children;
    expect(isElementLike(child)).toBe(true);
    if (!isElementLike(child)) throw new Error('PREVIEW Pane 应装配 AppPreviewCodeEditor');
    expect(child.type).toBe(AppPreviewCodeEditor);
    for (const [key, value] of Object.entries(props)) {
      expect(child.props[key]).toBe(value);
    }
  });
});
