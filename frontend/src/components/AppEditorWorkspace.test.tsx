import { describe, expect, it, vi } from 'vitest';
import { AppEditorSplitPanes } from './AppEditorSplitPanes';
import { AppEditorWorkspace } from './AppEditorWorkspace';
import {
  buildAppEditorWorkspaceProps,
} from './AppEditorWorkspaceTestFixture';
import { assertElementLike, findByType } from './componentElementTestHelpers';
import type { AppEditorWorkspaceProps } from './AppEditorWorkspaceTypes';

const getSplitPanesProps = (props: AppEditorWorkspaceProps) => {
  const tree = AppEditorWorkspace(props);
  const root = assertElementLike(tree, 'AppEditorWorkspace 应返回 React 元素');

  const splitPanes = findByType(root, AppEditorSplitPanes)[0];
  if (!splitPanes) throw new Error('AppEditorWorkspace 应装配 AppEditorSplitPanes');

  return splitPanes.props;
};

describe('AppEditorWorkspace', () => {
  it('SOURCE 活跃时忽略 PREVIEW 刷新触发的光标事件', () => {
    const onCursorPositionChange = vi.fn();
    const splitPanesProps = getSplitPanesProps(buildAppEditorWorkspaceProps({
      activeEditor: 'SOURCE',
      onCursorPositionChange,
    }));

    const sourcePane = splitPanesProps.sourcePane;
    const previewPane = splitPanesProps.previewPane;
    const sourceElement = assertElementLike(sourcePane, '编辑区应装配 SOURCE Pane');
    const previewElement = assertElementLike(previewPane, '编辑区应装配 PREVIEW Pane');

    (previewElement.props.onCursorPositionChange as (line: number, column: number) => void)(99, 1);
    expect(onCursorPositionChange).not.toHaveBeenCalled();

    (sourceElement.props.onCursorPositionChange as (line: number, column: number) => void)(12, 4);
    expect(onCursorPositionChange).toHaveBeenCalledWith(12, 4);
  });
});
