import { describe, expect, it, vi } from 'vitest';
import type { TransformReportUnresolvedCandidate } from '../utils/transformSummary';
import { TransformReportUnresolvedSection } from './TransformReportUnresolvedSection';

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

const candidate: TransformReportUnresolvedCandidate = {
  path: '$.maybeCmd',
  sourceLabel: 'scheme',
  originalValue: 'baiduboxapp://v1/open?cmd=1',
  message: '疑似可展开字段',
  length: 64,
  preview: 'baiduboxapp://v1/open?...',
  detectedType: 'url',
  reasonLabel: '待检查',
  reasonLevel: 'info',
  nextAction: '确认字段语义后加入规则',
};

describe('TransformReportUnresolvedSection', () => {
  it('渲染未展开线索并转发复制、定位和 Scheme 打开动作', () => {
    const onCopyPath = vi.fn();
    const onCopyOriginalValue = vi.fn();
    const onLocatePath = vi.fn();
    const onOpenSchemeValue = vi.fn();

    const tree = TransformReportUnresolvedSection({
      unresolvedCandidates: [candidate],
      filteredUnresolvedCount: 3,
      isUnresolvedTruncated: true,
      onCopyPath,
      onCopyOriginalValue,
      onLocatePath,
      onOpenSchemeValue,
    });

    const text = collectText(tree);
    expect(text).toContain('未展开线索 · 3');
    expect(text).toContain('仅显示前 1 条');
    expect(text).toContain('待检查');

    (findByDataTour(tree, 'transform-report-unresolved-copy-path')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-copy-unresolved-value')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-locate-unresolved-path')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-open-unresolved-scheme')[0].props.onClick as () => void)();

    expect(onCopyPath).toHaveBeenCalledWith('$.maybeCmd');
    expect(onCopyOriginalValue).toHaveBeenCalledWith('baiduboxapp://v1/open?cmd=1');
    expect(onLocatePath).toHaveBeenCalledWith('$.maybeCmd');
    expect(onOpenSchemeValue).toHaveBeenCalledWith('baiduboxapp://v1/open?cmd=1');
  });
});
