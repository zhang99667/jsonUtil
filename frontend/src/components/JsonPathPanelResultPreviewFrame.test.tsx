import { describe, expect, it, vi } from 'vitest';
import { collectText, findByTour } from './componentElementTestHelpers';
import { JsonPathPanelResultPreviewFrame } from './JsonPathPanelResultPreviewFrame';

describe('JsonPathPanelResultPreviewFrame', () => {
  it('渲染滚动容器并透传滚轮事件和子内容', () => {
    const onWheel = vi.fn();
    const tree = JsonPathPanelResultPreviewFrame({
      onWheel,
      children: <span>结果内容</span>,
    });
    const frame = findByTour(tree, 'jsonpath-results')[0];

    expect(frame.props.onWheel).toBe(onWheel);
    expect(String(frame.props.className)).toContain('overscroll-contain');
    expect(collectText(frame)).toContain('结果内容');
  });
});
