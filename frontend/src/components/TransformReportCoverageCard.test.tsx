import { describe, expect, it } from 'vitest';
import type { TransformReportCoverage } from '../utils/transformSummary';
import { TransformReportCoverageCard } from './TransformReportCoverageCard';
import { TransformReportCoverageItems } from './TransformReportCoverageItems';
import {
  collectText,
  findByTour,
  findByType,
  isElementLike,
  type ElementLike,
} from './componentElementTestHelpers';

const findByClassFragment = (node: unknown, classFragment: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByClassFragment(item, classFragment));
  if (!isElementLike(node)) return [];

  const className = typeof node.props.className === 'string' ? node.props.className : '';
  const matches = className.includes(classFragment) ? [node] : [];
  return matches.concat(findByClassFragment(node.props.children, classFragment));
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
    const card = findByTour(tree, 'transform-report-coverage')[0];

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
    const card = findByTour(tree, 'transform-report-coverage')[0];

    expect(card.props.className).toContain('border-emerald-700/50');
    expect(collectText(tree)).toContain('覆盖完整');
    expect(findByClassFragment(tree, 'bg-editor-bg/70')).toHaveLength(0);
    expect(findByType(tree, TransformReportCoverageItems)[0].props.items).toEqual([]);
  });
});
