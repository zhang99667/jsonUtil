import { describe, expect, it, vi } from 'vitest';
import { AppEditorSplitPanes } from './AppEditorSplitPanes';
import { AppEditorWorkspace } from './AppEditorWorkspace';
import {
  buildAppEditorWorkspaceProps,
} from './AppEditorWorkspaceTestFixture';
import type { AppEditorWorkspaceProps } from './AppEditorWorkspaceTypes';

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

const getSplitPanesProps = (props: AppEditorWorkspaceProps) => {
  const tree = AppEditorWorkspace(props);
  if (!isElementLike(tree)) throw new Error('AppEditorWorkspace 应返回 React 元素');

  const children = Array.isArray(tree.props.children) ? tree.props.children : [tree.props.children];
  const splitPanes = children.find(child => isElementLike(child) && child.type === AppEditorSplitPanes);
  if (!isElementLike(splitPanes)) throw new Error('AppEditorWorkspace 应装配 AppEditorSplitPanes');

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
    if (!isElementLike(sourcePane) || !isElementLike(previewPane)) {
      throw new Error('编辑区应装配 SOURCE 和 PREVIEW Pane');
    }

    (previewPane.props.onCursorPositionChange as (line: number, column: number) => void)(99, 1);
    expect(onCursorPositionChange).not.toHaveBeenCalled();

    (sourcePane.props.onCursorPositionChange as (line: number, column: number) => void)(12, 4);
    expect(onCursorPositionChange).toHaveBeenCalledWith(12, 4);
  });
});
