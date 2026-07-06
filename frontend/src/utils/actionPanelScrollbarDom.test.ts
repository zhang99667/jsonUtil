import { describe, expect, it } from 'vitest';
import { readActionPanelScrollState } from './actionPanelScrollbarDom';

describe('actionPanelScrollbarDom', () => {
  it('从滚动容器读取工具栏滚动状态', () => {
    expect(readActionPanelScrollState({
      scrollTop: 120,
      scrollHeight: 800,
      clientHeight: 240,
    } as HTMLDivElement)).toEqual({
      scrollTop: 120,
      scrollHeight: 800,
      clientHeight: 240,
    });
  });
});
