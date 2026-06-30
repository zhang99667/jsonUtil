import { describe, expect, it } from 'vitest';
import { AppInteractionOverlays } from './AppInteractionOverlays';
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
  it('装配交互遮罩组和主应用 toast 宿主', () => {
    const tree = AppWorkspaceOverlays({
      isResizing: true,
      isDraggingFile: true,
    });
    const interactionOverlays = findByType(tree, AppInteractionOverlays);

    expect(interactionOverlays).toHaveLength(1);
    expect(interactionOverlays[0].props).toMatchObject({
      isResizing: true,
      isDraggingFile: true,
    });
    expect(findByType(tree, AppToastHost)).toHaveLength(1);
  });
});
