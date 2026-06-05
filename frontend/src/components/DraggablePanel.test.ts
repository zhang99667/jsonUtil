import { describe, expect, it } from 'vitest';
import { normalizePanelPosition, normalizePanelSize } from './DraggablePanel';

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
