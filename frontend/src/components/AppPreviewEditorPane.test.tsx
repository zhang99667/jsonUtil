import { describe, expect, it } from 'vitest';
import { AppPreviewCodeEditor } from './AppPreviewCodeEditor';
import { AppPreviewEditorPane } from './AppPreviewEditorPane';
import { buildAppPreviewCodeEditorTestProps } from './AppPreviewCodeEditorTestFixture';
import { assertElementLike } from './componentElementTestHelpers';

describe('AppPreviewEditorPane', () => {
  it('只负责 PREVIEW Pane 容器并透传编辑器参数', () => {
    const props = buildAppPreviewCodeEditorTestProps({
      previewValidation: { isValid: true },
      previewErrorLocation: null,
      deepFormatWarning: undefined,
      deepFormatInfo: undefined,
      hasTransformReportContext: false,
      highlightRange: null,
    });
    const tree = assertElementLike(
      AppPreviewEditorPane(props),
      'AppPreviewEditorPane 应返回 React 元素'
    );

    expect(tree.type).toBe('div');
    expect(tree.props['data-tour']).toBe('preview-editor');
    expect(tree.props.className).toContain('flex-1');

    const child = assertElementLike(
      tree.props.children,
      'PREVIEW Pane 应装配 AppPreviewCodeEditor'
    );
    expect(child.type).toBe(AppPreviewCodeEditor);
    for (const [key, value] of Object.entries(props)) {
      expect(child.props[key]).toBe(value);
    }
  });
});
