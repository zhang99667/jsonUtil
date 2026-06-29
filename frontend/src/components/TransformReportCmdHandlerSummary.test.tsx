import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportCmdHandlerSummary } from './TransformReportCmdHandlerSummary';

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
  commandSchema: 'baiduboxapp://v1/open',
  commandParamCount: 3,
  commandParamKeys: ['uid', 'source'],
} as TransformReportRecord;

describe('TransformReportCmdHandlerSummary', () => {
  it('展示 cmdHandler 摘要并转发 schema 和参数筛选', () => {
    const onFilter = vi.fn();
    const tree = TransformReportCmdHandlerSummary({ record, onFilter });

    expect(collectText(tree)).toContain('cmdHandler');
    expect(collectText(tree)).toContain('cmdParams · 3');
    expect(collectText(tree)).toContain('+1');

    (findByDataTour(tree, 'transform-report-filter-command-schema')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-filter-command-param')[0].props.onClick as () => void)();

    expect(onFilter).toHaveBeenCalledWith('baiduboxapp://v1/open');
    expect(onFilter).toHaveBeenCalledWith('uid');
  });
});
