import { createElement } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DraggablePanel,
  PanelIcons,
  normalizePanelPosition,
  normalizePanelSize,
  type DraggablePanelProps,
} from './DraggablePanel';
import { MemoryStorage } from '../utils/memoryStorageTestHelper';

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('normalizePanelSize', () => {
  it('缓存尺寸过小时回到最小尺寸', () => {
    expect(normalizePanelSize(
      { width: 10, height: 20 },
      { width: 400, height: 300 },
      { width: 1280, height: 800 }
    )).toEqual({ width: 400, height: 300 });
  });

  it('缓存尺寸过大时限制在视口范围内', () => {
    expect(normalizePanelSize(
      { width: 5000, height: 4000 },
      { width: 400, height: 300 },
      { width: 1280, height: 800 }
    )).toEqual({ width: 1256, height: 776 });
  });
});

describe('normalizePanelPosition', () => {
  it('缓存位置过远时保留可见边缘', () => {
    expect(normalizePanelPosition(
      { x: 5000, y: 4000 },
      { width: 600, height: 400 },
      { width: 1280, height: 800 }
    )).toEqual({ x: 1200, y: 720 });
  });

  it('缓存位置过左时保留 80px 可见区域', () => {
    expect(normalizePanelPosition(
      { x: -1000, y: -100 },
      { width: 600, height: 400 },
      { width: 1280, height: 800 }
    )).toEqual({ x: -520, y: 0 });
  });
});

describe('DraggablePanel', () => {
  const renderPanel = (
    onClose = vi.fn(),
    resizeDirections?: DraggablePanelProps['resizeDirections']
  ) => render(createElement(DraggablePanel, {
    isOpen: true,
    onClose,
    title: '测试面板',
    icon: PanelIcons.Search,
    storageKey: 'test-panel',
    resizeDirections,
  }, '面板内容'));

  it('打开后聚焦关闭按钮并由面板内退出键关闭', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    renderPanel(onClose);
    act(() => vi.runAllTimers());

    const closeButton = screen.getByRole('button', { name: '关闭 测试面板' });
    expect(screen.getByRole('dialog', { name: '测试面板' })).toBeTruthy();
    expect(document.activeElement).toBe(closeButton);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('拖动结束后保存成熟组件返回的位置', () => {
    const { container } = renderPanel();
    const dragHandle = screen.getByText('测试面板').parentElement?.parentElement;
    expect(dragHandle).toBeTruthy();

    fireEvent.mouseDown(dragHandle!, { button: 0, clientX: 110, clientY: 110 });
    fireEvent.mouseMove(document, { clientX: 210, clientY: 180 });
    fireEvent.mouseUp(document, { clientX: 210, clientY: 180 });

    expect(container.querySelector('.react-draggable')).toBeTruthy();
    expect(JSON.parse(storage.getItem('test-panel-position') || 'null')).toEqual({
      x: 200,
      y: 170,
    });
  });

  it('按配置只启用指定方向的缩放手柄', () => {
    const { container } = renderPanel(vi.fn(), ['width']);

    expect(container.querySelector('[style*="col-resize"]')).toBeTruthy();
    expect(container.querySelector('[style*="row-resize"]')).toBeNull();
    expect(container.querySelector('[style*="se-resize"]')).toBeNull();
  });
});
