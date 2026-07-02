import { vi } from 'vitest';
import type { AppSourceCodeEditorProps } from './AppSourceCodeEditorTypes';
import type { AppEditorUiState } from '../utils/appEditorUiState';
import type { FileTab } from '../types';

export const appSourceEditorUiState: AppEditorUiState = {
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

export const appSourceActiveFile: FileTab = {
  id: 'tab-1',
  name: 'demo.json',
  content: '{"a":1}',
  savedContent: '{"a":0}',
  viewState: { cursor: 1 },
};

export const buildAppSourceCodeEditorTestProps = (
  overrides: Partial<AppSourceCodeEditorProps> = {}
): AppSourceCodeEditorProps => ({
  input: '{"a":1}',
  activeFile: appSourceActiveFile,
  activeFileId: 'tab-1',
  files: [appSourceActiveFile],
  isProcessing: false,
  sourceValidation: { isValid: false, error: 'Unexpected token' },
  sourceErrorLocation: { line: 1, column: 4 },
  sourceErrorLocateSignal: 2,
  jsonSchemaWarning: 'schema warning',
  jsonSchemaDiagnosticHighlights: [],
  editorUiState: appSourceEditorUiState,
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
  ...overrides,
});
