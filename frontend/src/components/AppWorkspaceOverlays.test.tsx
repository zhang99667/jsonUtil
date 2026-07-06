import { describe, expect, it } from 'vitest';
import { AppInteractionOverlays } from './AppInteractionOverlays';
import { AppToastHost } from './AppToastHost';
import { AppWorkspaceOverlays } from './AppWorkspaceOverlays';
import { findByType } from './componentElementTestHelpers';

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
