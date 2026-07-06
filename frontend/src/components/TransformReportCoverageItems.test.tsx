import { describe, expect, it } from 'vitest';
import { assertElementLike, collectText } from './componentElementTestHelpers';
import { TransformReportCoverageItems } from './TransformReportCoverageItems';

describe('TransformReportCoverageItems', () => {
  it('渲染覆盖率条目 chips', () => {
    const tree = assertElementLike(
      TransformReportCoverageItems({ items: ['跳过 1', '待检查 2'] }),
      'TransformReportCoverageItems 应返回 React 元素'
    );

    expect(tree.props['data-tour']).toBe('transform-report-coverage-items');
    expect(collectText(tree)).toContain('跳过 1');
    expect(collectText(tree)).toContain('待检查 2');
  });

  it('无覆盖率条目时不渲染列表', () => {
    expect(TransformReportCoverageItems({ items: [] })).toBeNull();
  });
});
