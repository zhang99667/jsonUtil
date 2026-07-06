import { describe, expect, it, vi } from 'vitest';
import { AppSourceCodeEditor } from './AppSourceCodeEditor';
import { AppSourceEditorPane, type AppSourceEditorPaneProps } from './AppSourceEditorPane';
import { appSourceEditorUiState } from './AppSourceCodeEditorTestFixture';
import { assertElementLike } from './componentElementTestHelpers';

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
});

describe('AppSourceEditorPane', () => {
  it('只负责 SOURCE Pane 宽度容器并透传编辑器参数', () => {
    const props = buildProps();
    const tree = assertElementLike(
      AppSourceEditorPane(props),
      'AppSourceEditorPane 应返回 React 元素'
    );

    expect(tree.type).toBe('div');
    expect(tree.props['data-tour']).toBe('source-editor');
    expect(tree.props.style).toEqual({ width: '42%' });

    const child = assertElementLike(
      tree.props.children,
      'SOURCE Pane 应装配 AppSourceCodeEditor'
    );
    expect(child.type).toBe(AppSourceCodeEditor);
    expect(child.props.input).toBe(props.input);
    expect(child.props.onSourceAiFix).toBe(props.onSourceAiFix);
    expect(child.props.leftPaneWidthPercent).toBeUndefined();
  });
});
