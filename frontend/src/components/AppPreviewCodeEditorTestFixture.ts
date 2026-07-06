import { vi } from 'vitest';
import type { AppPreviewCodeEditorProps } from './AppPreviewCodeEditor';
import type { AppEditorUiState } from '../utils/appEditorUiState';

export const appPreviewEditorUiState: AppEditorUiState = {
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

export const buildAppPreviewCodeEditorTestProps = (
  overrides: Partial<AppPreviewCodeEditorProps> = {}
): AppPreviewCodeEditorProps => ({
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
  editorUiState: appPreviewEditorUiState,
  onOutputChange: vi.fn(),
  onPreviewFocus: vi.fn(),
  onCursorPositionChange: vi.fn(),
  onOpenTransformReport: vi.fn(),
  onApplyPreviewToSource: vi.fn(),
  onCopyPreview: vi.fn(),
  onSchemeEdit: vi.fn(),
  ...overrides,
});
