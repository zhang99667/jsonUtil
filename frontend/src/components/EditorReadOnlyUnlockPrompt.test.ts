import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearReadOnlyUnlockPromptTasks,
  createReadOnlyUnlockPromptTasks,
  scheduleReadOnlyUnlockPrompt,
} from './editorReadOnlyUnlockPromptTasks';

describe('只读解锁提示异步任务', () => {
  let frameCallbacks: Map<number, FrameRequestCallback>;
  let nextFrameId: number;

  beforeEach(() => {
    vi.useFakeTimers();
    frameCallbacks = new Map();
    nextFrameId = 1;
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      const frameId = nextFrameId++;
      frameCallbacks.set(frameId, callback);
      return frameId;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn(frameId => {
      frameCallbacks.delete(frameId);
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('调度后卸载只取消句柄且不更新提示', () => {
    const tasks = createReadOnlyUnlockPromptTasks();
    const show = vi.fn();
    const hide = vi.fn();

    scheduleReadOnlyUnlockPrompt(tasks, () => true, show, hide);
    clearReadOnlyUnlockPromptTasks(tasks);
    vi.runAllTimers();

    expect(show).not.toHaveBeenCalled();
    expect(hide).not.toHaveBeenCalled();
  });

  it('重复触发时只有最新定位回调可以显示提示', () => {
    const tasks = createReadOnlyUnlockPromptTasks();
    const firstShow = vi.fn();
    const latestShow = vi.fn();

    scheduleReadOnlyUnlockPrompt(tasks, () => true, firstShow, vi.fn());
    vi.runOnlyPendingTimers();
    const firstFrame = frameCallbacks.get(1);
    scheduleReadOnlyUnlockPrompt(tasks, () => true, latestShow, vi.fn());
    vi.runOnlyPendingTimers();

    firstFrame?.(0);
    frameCallbacks.get(2)?.(0);

    expect(firstShow).not.toHaveBeenCalled();
    expect(latestShow).toHaveBeenCalledTimes(1);
  });

  it('解锁失效后晚到定位回调不会重新显示提示', () => {
    const tasks = createReadOnlyUnlockPromptTasks();
    const show = vi.fn();

    scheduleReadOnlyUnlockPrompt(tasks, () => true, show, vi.fn());
    vi.runOnlyPendingTimers();
    const lateFrame = frameCallbacks.get(1);
    clearReadOnlyUnlockPromptTasks(tasks);
    lateFrame?.(0);

    expect(show).not.toHaveBeenCalled();
  });

  it('资格失效后晚到定位回调不会更新提示', () => {
    const tasks = createReadOnlyUnlockPromptTasks();
    const show = vi.fn();
    let eligible = true;

    scheduleReadOnlyUnlockPrompt(tasks, () => eligible, show, vi.fn());
    vi.runOnlyPendingTimers();
    eligible = false;
    frameCallbacks.get(1)?.(0);

    expect(show).not.toHaveBeenCalled();
  });

  it('显示后按约定延迟自动隐藏', () => {
    const tasks = createReadOnlyUnlockPromptTasks();
    const show = vi.fn();
    const hide = vi.fn();

    scheduleReadOnlyUnlockPrompt(tasks, () => true, show, hide);
    vi.runOnlyPendingTimers();
    frameCallbacks.get(1)?.(0);

    expect(show).toHaveBeenCalledTimes(1);
    expect(hide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5_000);
    expect(hide).toHaveBeenCalledTimes(1);
  });
});
