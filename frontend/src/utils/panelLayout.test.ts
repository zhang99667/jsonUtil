import { describe, expect, it, vi } from 'vitest';
import {
  FLOATING_PANEL_STORAGE_KEYS,
  notifyFloatingPanelLayoutReset,
  PANEL_LAYOUT_RESET_EVENT,
  resetFloatingPanelLayoutStorage,
} from './panelLayout';

describe('resetFloatingPanelLayoutStorage', () => {
  it('默认覆盖新增浮动面板布局缓存', () => {
    expect(FLOATING_PANEL_STORAGE_KEYS).toContain('json-compare-panel');
    expect(FLOATING_PANEL_STORAGE_KEYS).toContain('structure-nav-panel');
  });

  it('清理浮动面板位置和尺寸缓存', () => {
    const storage = {
      removeItem: vi.fn(),
    } as unknown as Storage;

    resetFloatingPanelLayoutStorage(storage, ['jsonpath-panel', 'scheme-panel']);

    expect(storage.removeItem).toHaveBeenCalledWith('jsonpath-panel-position');
    expect(storage.removeItem).toHaveBeenCalledWith('jsonpath-panel-size');
    expect(storage.removeItem).toHaveBeenCalledWith('scheme-panel-position');
    expect(storage.removeItem).toHaveBeenCalledWith('scheme-panel-size');
  });
});

describe('notifyFloatingPanelLayoutReset', () => {
  it('派发浮动面板布局重置事件', () => {
    const target = new EventTarget();
    const handler = vi.fn();
    target.addEventListener(PANEL_LAYOUT_RESET_EVENT, handler);

    notifyFloatingPanelLayoutReset(target);

    expect(handler).toHaveBeenCalledTimes(1);
    target.removeEventListener(PANEL_LAYOUT_RESET_EVENT, handler);
  });
});
