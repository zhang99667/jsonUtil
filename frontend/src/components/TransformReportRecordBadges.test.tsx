import { describe, expect, it } from 'vitest';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportRecordBadges } from './TransformReportRecordBadges';

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

const findByDataTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByDataTour(item, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByDataTour(node.props.children, dataTour));
};

const record = {
  path: '$.cmd',
  labels: ['JSON 字符串'],
  insights: ['cmdSchema=baiduboxapp://v1/open'],
  nestedCommandFieldCount: 2,
  nestedResourceFieldCount: 3,
  cmdStructureFocusPaths: ['$.cmd.uid'],
  cmdStructureFocusLabel: '内部路径',
} as TransformReportRecord;

describe('TransformReportRecordBadges', () => {
  it('展示记录标签、嵌套字段计数、聚焦复制和洞察', () => {
    const tree = TransformReportRecordBadges({ record });
    const text = collectText(tree);

    expect(text).toContain('JSON 字符串');
    expect(text).toContain('内部CMD字段 2');
    expect(text).toContain('资源URL 3');
    expect(text).toContain('聚焦复制');
    expect(text).toContain('cmdSchema=baiduboxapp://v1/open');
    expect(findByDataTour(tree, 'transform-report-record-badges')).toHaveLength(1);
    expect(findByDataTour(tree, 'transform-report-record-insights')).toHaveLength(1);
    expect(findByDataTour(tree, 'transform-report-record-badges')[0].props.children)
      .toBeDefined();
  });

  it('没有洞察和聚焦路径时只保留标签行', () => {
    const tree = TransformReportRecordBadges({
      record: {
        ...record,
        insights: [],
        nestedCommandFieldCount: 0,
        nestedResourceFieldCount: 0,
        cmdStructureFocusPaths: [],
      },
    });

    expect(collectText(tree)).toBe('JSON 字符串');
    expect(findByDataTour(tree, 'transform-report-record-badges')).toHaveLength(1);
    expect(findByDataTour(tree, 'transform-report-record-insights')).toHaveLength(0);
  });
});
