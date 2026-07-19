import { describe, expect, it } from 'vitest';
import { DeferredCodeEditor } from './DeferredCodeEditor';
import { PreviewEditorHeaderActions } from './EditorHeaderActions';
import { AppPreviewCodeEditor } from './AppPreviewCodeEditor';
import { buildAppPreviewCodeEditorTestProps } from './AppPreviewCodeEditorTestFixture';
import { assertElementLike } from './componentElementTestHelpers';

describe('AppPreviewCodeEditor', () => {
  it('装配 PREVIEW CodeEditor 的校验、提示、高亮和头部动作参数', () => {
    const props = buildAppPreviewCodeEditorTestProps();
    const tree = assertElementLike(
      AppPreviewCodeEditor(props),
      'AppPreviewCodeEditor 应返回 React 元素'
    );

    expect(tree.type).toBe(DeferredCodeEditor);
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

    const headerActions = assertElementLike(
      tree.props.headerActions,
      'PREVIEW 头部动作应为 React 元素'
    );
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
    const validTree = assertElementLike(
      AppPreviewCodeEditor(buildAppPreviewCodeEditorTestProps({
        isOutputTransforming: true,
        previewValidation: { isValid: true },
        deepFormatInfo: undefined,
      })),
      'AppPreviewCodeEditor 应返回 React 元素'
    );

    expect(validTree.props.error).toBeUndefined();
    expect(validTree.props.canToggleReadOnly).toBe(false);

    const headerActions = assertElementLike(
      validTree.props.headerActions,
      'PREVIEW 头部动作应为 React 元素'
    );
    expect(headerActions.props.isOutputTransforming).toBe(true);
    expect(headerActions.props.showTransformReportButton).toBe(false);
  });
});
