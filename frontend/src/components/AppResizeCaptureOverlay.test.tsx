import { describe, expect, it } from 'vitest';
import { AppResizeCaptureOverlay } from './AppResizeCaptureOverlay';
import { assertElementLike } from './componentElementTestHelpers';

describe('AppResizeCaptureOverlay', () => {
  it('渲染覆盖工作区的 resize 捕获层', () => {
    const tree = AppResizeCaptureOverlay({});

    const overlay = assertElementLike(tree, 'AppResizeCaptureOverlay 应返回 React 元素');
    expect(overlay.props['data-tour']).toBe('resize-capture-overlay');
    expect(overlay.props.className).toBe('absolute inset-0 z-50 cursor-col-resize');
  });
});
