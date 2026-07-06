import { describe, expect, it } from 'vitest';
import { AppFileDropOverlay } from './AppFileDropOverlay';
import { AppInteractionOverlays } from './AppInteractionOverlays';
import { AppResizeCaptureOverlay } from './AppResizeCaptureOverlay';
import { findByType } from './componentElementTestHelpers';

describe('AppInteractionOverlays', () => {
  it('仅在拖拽文件时装配文件释放浮层', () => {
    const draggingTree = AppInteractionOverlays({
      isResizing: false,
      isDraggingFile: true,
    });
    const idleTree = AppInteractionOverlays({
      isResizing: false,
      isDraggingFile: false,
    });

    expect(findByType(draggingTree, AppFileDropOverlay)).toHaveLength(1);
    expect(findByType(idleTree, AppFileDropOverlay)).toHaveLength(0);
  });

  it('仅在调整布局时装配 resize 捕获层', () => {
    const resizingTree = AppInteractionOverlays({
      isResizing: true,
      isDraggingFile: false,
    });
    const idleTree = AppInteractionOverlays({
      isResizing: false,
      isDraggingFile: false,
    });

    expect(findByType(resizingTree, AppResizeCaptureOverlay)).toHaveLength(1);
    expect(findByType(idleTree, AppResizeCaptureOverlay)).toHaveLength(0);
  });
});
