import { describe, expect, it } from 'vitest';
import { AppResizeCaptureOverlay } from './AppResizeCaptureOverlay';

interface ElementLike {
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

describe('AppResizeCaptureOverlay', () => {
  it('渲染覆盖工作区的 resize 捕获层', () => {
    const tree = AppResizeCaptureOverlay({});

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('AppResizeCaptureOverlay 应返回 React 元素');
    expect(tree.props['data-tour']).toBe('resize-capture-overlay');
    expect(tree.props.className).toBe('absolute inset-0 z-50 cursor-col-resize');
  });
});
