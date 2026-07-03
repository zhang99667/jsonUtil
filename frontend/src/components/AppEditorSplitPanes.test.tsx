import { describe, expect, it, vi } from 'vitest';
import { AppEditorSplitPanes } from './AppEditorSplitPanes';
import { AppPaneResizeHandle } from './AppResizeHandles';
import { LEFT_PANE_MAX_PERCENT, LEFT_PANE_MIN_PERCENT } from '../hooks/layoutResize';

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

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

describe('AppEditorSplitPanes', () => {
  it('装配 SOURCE/PREVIEW 分栏和中间 resize handle', () => {
    const onMouseDown = vi.fn();
    const onKeyDown = vi.fn();

    const tree = AppEditorSplitPanes({
      sourcePane: <section data-testid="source-pane">SOURCE</section>,
      previewPane: <section data-testid="preview-pane">PREVIEW</section>,
      leftPaneWidthPercent: 42,
      isPaneResizing: true,
      onPaneResizeMouseDown: onMouseDown,
      onPaneResizeKeyDown: onKeyDown,
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('AppEditorSplitPanes 应返回 React 元素');
    expect(tree.props.className).toBe('flex-1 flex min-h-0');

    const children = tree.props.children;
    expect(Array.isArray(children)).toBe(true);
    if (!Array.isArray(children)) throw new Error('AppEditorSplitPanes 应渲染三段子节点');
    expect(children).toHaveLength(3);
    expect(isElementLike(children[0]) && children[0].props['data-testid']).toBe('source-pane');
    expect(isElementLike(children[2]) && children[2].props['data-testid']).toBe('preview-pane');

    const handles = findByType(tree, AppPaneResizeHandle);
    expect(handles).toHaveLength(1);
    expect(handles[0].props.isResizing).toBe(true);
    expect(handles[0].props.leftPaneWidthPercent).toBe(42);
    expect(handles[0].props.minPercent).toBe(LEFT_PANE_MIN_PERCENT);
    expect(handles[0].props.maxPercent).toBe(LEFT_PANE_MAX_PERCENT);
    expect(handles[0].props.onMouseDown).toBe(onMouseDown);
    expect(handles[0].props.onKeyDown).toBe(onKeyDown);
  });
});
