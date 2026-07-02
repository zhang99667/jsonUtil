import { describe, expect, it, vi } from 'vitest';
import { buildAppSourceCodeEditorProps } from './appSourceCodeEditorProps';
import type { AppSourceCodeEditorProps } from './AppSourceCodeEditorTypes';
import type { AppEditorUiState } from '../utils/appEditorUiState';
import type { FileTab } from '../types';

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

const activeFile: FileTab = {
  id: 'tab-1',
  name: 'demo.json',
  content: '{"a":1}',
  savedContent: '{"a":0}',
  viewState: { cursor: 1 },
};

const buildProps = (overrides: Partial<AppSourceCodeEditorProps> = {}): AppSourceCodeEditorProps => ({
  input: '{"a":1}',
  activeFile,
  activeFileId: 'tab-1',
  files: [activeFile],
  isProcessing: false,
  sourceValidation: { isValid: false, error: 'Unexpected token' },
  sourceErrorLocation: { line: 1, column: 4 },
  sourceErrorLocateSignal: 2,
  jsonSchemaWarning: 'schema warning',
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
  ...overrides,
});

describe('buildAppSourceCodeEditorProps', () => {
  it('映射 SOURCE CodeEditor 的文件、路径和校验状态', () => {
    const props = buildProps();
    const editorProps = buildAppSourceCodeEditorProps(props);

    expect(editorProps.value).toBe('{"a":1}');
    expect(editorProps.originalValue).toBe('{"a":0}');
    expect(editorProps.path).toBe('tab-1');
    expect(editorProps.restoreViewState).toEqual({ cursor: 1 });
    expect(editorProps.label).toBe('SOURCE');
    expect(editorProps.enableSchemeScan).toBe(true);
    expect(editorProps.error).toBe('Unexpected token');
    expect(editorProps.errorLocation).toEqual({ line: 1, column: 4 });
    expect(editorProps.warning).toBe('schema warning');
    expect(editorProps.locateErrorSignal).toBe(2);
  });

  it('无活动文件或校验通过时清理可选编辑器状态', () => {
    const editorProps = buildAppSourceCodeEditorProps(buildProps({
      activeFile: null,
      activeFileId: null,
      sourceValidation: { isValid: true },
    }));

    expect(editorProps.path).toBeUndefined();
    expect(editorProps.originalValue).toBeUndefined();
    expect(editorProps.restoreViewState).toBeUndefined();
    expect(editorProps.error).toBeUndefined();
  });
});
