import { describe, expect, it } from 'vitest';
import { buildAppSourceCodeEditorProps } from './appSourceCodeEditorProps';
import { buildAppSourceCodeEditorTestProps } from './AppSourceCodeEditorTestFixture';

describe('buildAppSourceCodeEditorProps', () => {
  it('映射 SOURCE CodeEditor 的文件、路径和校验状态', () => {
    const props = buildAppSourceCodeEditorTestProps();
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
    const editorProps = buildAppSourceCodeEditorProps(buildAppSourceCodeEditorTestProps({
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
