import { describe, expect, it } from 'vitest';
import { AppFileDropOverlay } from './AppFileDropOverlay';
import { assertElementLike, collectText } from './componentElementTestHelpers';

describe('AppFileDropOverlay', () => {
  it('展示文件拖拽释放提示', () => {
    const tree = assertElementLike(AppFileDropOverlay({}), 'AppFileDropOverlay 应返回 React 元素');

    expect(tree.props['data-tour']).toBe('file-drop-overlay');

    const text = collectText(tree);
    expect(text).toContain('释放以打开文件');
    expect(text).toContain('支持 JSON、TXT、JS、TS 等文本文件');
  });
});
