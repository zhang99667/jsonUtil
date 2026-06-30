import { describe, expect, it } from 'vitest';
import { TransformReportCoverageItems } from './TransformReportCoverageItems';

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

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

describe('TransformReportCoverageItems', () => {
  it('渲染覆盖率条目 chips', () => {
    const tree = TransformReportCoverageItems({ items: ['跳过 1', '待检查 2'] });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('TransformReportCoverageItems 应返回 React 元素');
    expect(tree.props['data-tour']).toBe('transform-report-coverage-items');
    expect(collectText(tree)).toContain('跳过 1');
    expect(collectText(tree)).toContain('待检查 2');
  });

  it('无覆盖率条目时不渲染列表', () => {
    expect(TransformReportCoverageItems({ items: [] })).toBeNull();
  });
});
