import { describe, expect, it } from 'vitest';
import { AppFileDropOverlay } from './AppFileDropOverlay';
import { AppResizeCaptureOverlay } from './AppResizeCaptureOverlay';
import { AppToastHost } from './AppToastHost';
import { AppWorkspaceOverlays } from './AppWorkspaceOverlays';

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

describe('AppWorkspaceOverlays', () => {
  it('仅在拖拽文件时装配文件释放浮层', () => {
    const draggingTree = AppWorkspaceOverlays({
      isResizing: false,
      isDraggingFile: true,
    });
    const idleTree = AppWorkspaceOverlays({
      isResizing: false,
      isDraggingFile: false,
    });

    expect(findByType(draggingTree, AppFileDropOverlay)).toHaveLength(1);
    expect(findByType(idleTree, AppFileDropOverlay)).toHaveLength(0);
  });

  it('仅在调整布局时装配 resize 捕获层', () => {
    const resizingTree = AppWorkspaceOverlays({
      isResizing: true,
      isDraggingFile: false,
    });
    const idleTree = AppWorkspaceOverlays({
      isResizing: false,
      isDraggingFile: false,
    });

    expect(findByType(resizingTree, AppResizeCaptureOverlay)).toHaveLength(1);
    expect(findByType(idleTree, AppResizeCaptureOverlay)).toHaveLength(0);
  });

  it('始终装配主应用 toast 宿主', () => {
    const tree = AppWorkspaceOverlays({
      isResizing: false,
      isDraggingFile: false,
    });

    expect(findByType(tree, AppToastHost)).toHaveLength(1);
  });
});
