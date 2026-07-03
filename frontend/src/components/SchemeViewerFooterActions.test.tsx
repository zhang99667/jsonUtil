import { describe, expect, it, vi } from 'vitest';
import {
  clickRenderedElement,
  renderSchemeFooterActions,
} from './SchemeViewerFooterActionTestFixture';
import { collectRenderedText, findRenderedByTour } from './schemeViewerRenderedElementTestHelpers';

describe('SchemeViewerFooterActions', () => {
  it('渲染解码状态、关闭入口和动作列表', () => {
    const tree = renderSchemeFooterActions();

    expect(collectRenderedText(tree)).toContain('2 层解码');
    expect(collectRenderedText(tree)).toContain('关闭');
    expect(findRenderedByTour(tree, 'scheme-footer-actions')).toHaveLength(1);
    expect(findRenderedByTour(tree, 'scheme-qrcode-button')).toHaveLength(1);
  });

  it('关闭按钮保留独立回调和可访问提示', () => {
    const onClose = vi.fn();
    const tree = renderSchemeFooterActions({ onClose });
    const closeButton = findRenderedByTour(tree, 'scheme-close-button')[0];

    expect(closeButton.props.title).toBe('关闭 Scheme 解析');
    expect(closeButton.props['aria-label']).toBe('关闭 Scheme 解析');
    clickRenderedElement(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
