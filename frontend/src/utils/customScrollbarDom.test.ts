import { describe, expect, it } from 'vitest';
import {
  getCustomScrollbarPointerPos,
  readCustomScrollbarMetrics,
  setCustomScrollbarScrollPos,
} from './customScrollbarDom';

const createContainer = () => ({
  scrollTop: 12,
  scrollLeft: 34,
  scrollHeight: 120,
  scrollWidth: 340,
  clientHeight: 60,
  clientWidth: 170,
});

describe('customScrollbarDom', () => {
  it('按垂直方向读取滚动指标和指针位置', () => {
    const container = createContainer();

    expect(readCustomScrollbarMetrics(container as HTMLDivElement, 'vertical')).toEqual({
      scrollPos: 12,
      scrollSize: 120,
      clientSize: 60,
    });
    expect(getCustomScrollbarPointerPos({ pageX: 10, pageY: 20 } as MouseEvent, 'vertical')).toBe(20);
  });

  it('按水平方向读取滚动指标和指针位置', () => {
    const container = createContainer();

    expect(readCustomScrollbarMetrics(container as HTMLDivElement, 'horizontal')).toEqual({
      scrollPos: 34,
      scrollSize: 340,
      clientSize: 170,
    });
    expect(getCustomScrollbarPointerPos({ pageX: 10, pageY: 20 } as MouseEvent, 'horizontal')).toBe(10);
  });

  it('按方向写回滚动位置', () => {
    const verticalContainer = createContainer();
    const horizontalContainer = createContainer();

    setCustomScrollbarScrollPos(verticalContainer as HTMLDivElement, 'vertical', 88);
    setCustomScrollbarScrollPos(horizontalContainer as HTMLDivElement, 'horizontal', 99);

    expect(verticalContainer.scrollTop).toBe(88);
    expect(verticalContainer.scrollLeft).toBe(34);
    expect(horizontalContainer.scrollTop).toBe(12);
    expect(horizontalContainer.scrollLeft).toBe(99);
  });
});
