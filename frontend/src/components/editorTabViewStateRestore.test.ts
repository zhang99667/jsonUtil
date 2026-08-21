import { describe, expect, it, vi } from 'vitest';
import { scheduleEditorTabViewStateRestore } from './editorTabViewStateRestore';

const viewState = {
  cursorState: [{ position: { lineNumber: 8, column: 3 } }],
  viewState: { scrollTop: 420, scrollLeft: 36 },
};

describe('scheduleEditorTabViewStateRestore', () => {
  it('取消过期帧，并在执行前拒绝恢复到其他 Tab', () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let nextFrameId = 0;
    let activeFileId = 'tab-2';
    const restoreViewState = vi.fn();
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      nextFrameId += 1;
      callbacks.set(nextFrameId, callback);
      return nextFrameId;
    });
    const cancelFrame = vi.fn((frameId: number) => callbacks.delete(frameId));

    const cancelRestore = scheduleEditorTabViewStateRestore({
      targetFileId: 'tab-2',
      viewState,
      getActiveFileId: () => activeFileId,
      restoreViewState,
      requestFrame,
      cancelFrame,
    });

    cancelRestore();
    expect(cancelFrame).toHaveBeenCalledWith(1);
    expect(callbacks.has(1)).toBe(false);

    scheduleEditorTabViewStateRestore({
      targetFileId: 'tab-2',
      viewState,
      getActiveFileId: () => activeFileId,
      restoreViewState,
      requestFrame,
      cancelFrame,
    });
    activeFileId = 'tab-1';
    callbacks.get(2)?.(0);
    expect(restoreViewState).not.toHaveBeenCalled();
  });

  it('目标 Tab 仍活动时恢复各自的滚动位置', () => {
    let callback: FrameRequestCallback | undefined;
    const restoreViewState = vi.fn();

    scheduleEditorTabViewStateRestore({
      targetFileId: 'tab-2',
      viewState,
      getActiveFileId: () => 'tab-2',
      restoreViewState,
      requestFrame: scheduledCallback => {
        callback = scheduledCallback;
        return 7;
      },
      cancelFrame: vi.fn(),
    });
    callback?.(0);
    expect(restoreViewState).toHaveBeenCalledWith(viewState);
  });
});
