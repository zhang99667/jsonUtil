import { describe, expect, it } from 'vitest';
import type { TransformReportCoverage } from '../utils/transformSummary';
import { TransformReportCoverageCard } from './TransformReportCoverageCard';
import { TransformReportCoverageItems } from './TransformReportCoverageItems';

interface ElementLike {
  type?: unknown;
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

const findByTour = (node: unknown, dataTour: string): ElementLike => {
  if (Array.isArray(node)) {
    const match = node.map(item => findByTourOrNull(item, dataTour)).find(Boolean);
    expect(match, `node ${dataTour}`).toBeTruthy();
    return match as ElementLike;
  }

  const match = findByTourOrNull(node, dataTour);
  expect(match, `node ${dataTour}`).toBeTruthy();
  return match as ElementLike;
};

const findByTourOrNull = (node: unknown, dataTour: string): ElementLike | null => {
  if (!isElementLike(node)) return null;
  if (node.props['data-tour'] === dataTour) return node;
  const children = node.props.children;
  if (Array.isArray(children)) {
    return children.map(child => findByTourOrNull(child, dataTour)).find(Boolean) || null;
  }
  return findByTourOrNull(children, dataTour);
};

const findByClassFragment = (node: unknown, classFragment: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByClassFragment(item, classFragment));
  if (!isElementLike(node)) return [];

  const className = typeof node.props.className === 'string' ? node.props.className : '';
  const matches = className.includes(classFragment) ? [node] : [];
  return matches.concat(findByClassFragment(node.props.children, classFragment));
};

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const buildCoverage = (overrides: Partial<TransformReportCoverage> = {}): TransformReportCoverage => ({
  score: 0.62,
  level: 'warning',
  label: '覆盖不足',
  description: '存在跳过记录',
  items: ['跳过 1', '待检查 2'],
  ...overrides,
});

describe('TransformReportCoverageCard', () => {
  it('渲染覆盖率摘要、覆盖项和风险样式', () => {
    const tree = TransformReportCoverageCard({ coverage: buildCoverage() });
    const card = findByTour(tree, 'transform-report-coverage');

    expect(card.props.className).toContain('border-amber-700/50');
    expect(collectText(tree)).toContain('覆盖不足');
    expect(collectText(tree)).toContain('存在跳过记录');
    const items = findByType(tree, TransformReportCoverageItems);
    expect(items).toHaveLength(1);
    expect(items[0].props.items).toEqual(['跳过 1', '待检查 2']);
  });

  it('无覆盖项时只渲染摘要文本', () => {
    const tree = TransformReportCoverageCard({
      coverage: buildCoverage({
        level: 'success',
        label: '覆盖完整',
        description: '全部展开成功',
        items: [],
      }),
    });
    const card = findByTour(tree, 'transform-report-coverage');

    expect(card.props.className).toContain('border-emerald-700/50');
    expect(collectText(tree)).toContain('覆盖完整');
    expect(findByClassFragment(tree, 'bg-editor-bg/70')).toHaveLength(0);
    expect(findByType(tree, TransformReportCoverageItems)[0].props.items).toEqual([]);
  });
});
