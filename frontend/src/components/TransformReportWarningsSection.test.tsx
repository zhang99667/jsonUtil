import { describe, expect, it, vi } from 'vitest';
import type { TransformReportWarning } from '../utils/transformSummary';
import { TransformReportWarningsSection } from './TransformReportWarningsSection';

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

const warning: TransformReportWarning = {
  type: 'string_decode_skipped',
  path: '$.large',
  sourceLabel: 'scheme',
  message: '内容过长，已跳过',
  reasonLabel: '性能保护',
  nextAction: '缩小样本后重试',
  originalValue: 'baiduboxapp://v1/open?cmd=1',
  length: 120000,
  limit: 100000,
};

describe('TransformReportWarningsSection', () => {
  it('渲染跳过记录并转发复制、定位和 Scheme 打开动作', () => {
    const onCopyPath = vi.fn();
    const onCopyOriginalValue = vi.fn();
    const onLocatePath = vi.fn();
    const onOpenSchemeValue = vi.fn();

    const tree = TransformReportWarningsSection({
      warnings: [warning],
      filteredWarningCount: 2,
      isWarningTruncated: true,
      onCopyPath,
      onCopyOriginalValue,
      onLocatePath,
      onOpenSchemeValue,
    });

    const text = collectText(tree);
    expect(text).toContain('跳过记录 · 2');
    expect(text).toContain('仅显示前 1 条');
    expect(text).toContain('性能保护');

    (findByDataTour(tree, 'transform-report-warning-copy-path')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-warning-copy-value')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-locate-warning-path')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-open-warning-scheme')[0].props.onClick as () => void)();

    expect(onCopyPath).toHaveBeenCalledWith('$.large');
    expect(onCopyOriginalValue).toHaveBeenCalledWith('baiduboxapp://v1/open?cmd=1');
    expect(onLocatePath).toHaveBeenCalledWith('$.large');
    expect(onOpenSchemeValue).toHaveBeenCalledWith('baiduboxapp://v1/open?cmd=1');
  });
});
