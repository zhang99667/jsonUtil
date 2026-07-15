import { describe, expect, it, vi } from 'vitest';
import type { TransformReportUnresolvedCandidate } from '../utils/transformSummary';
import { clickElement, collectText, findByTour } from './componentElementTestHelpers';
import { TransformReportUnresolvedSection } from './TransformReportUnresolvedSection';

const candidate: TransformReportUnresolvedCandidate = {
  path: '$.maybeCmd',
  sourceLabel: 'scheme',
  originalValue: 'sampleapp://v1/open?cmd=1',
  message: '疑似可展开字段',
  length: 64,
  preview: 'sampleapp://v1/open?...',
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

    clickElement(findByTour(tree, 'transform-report-unresolved-copy-path')[0]);
    clickElement(findByTour(tree, 'transform-report-copy-unresolved-value')[0]);
    clickElement(findByTour(tree, 'transform-report-locate-unresolved-path')[0]);
    clickElement(findByTour(tree, 'transform-report-open-unresolved-scheme')[0]);

    expect(onCopyPath).toHaveBeenCalledWith('$.maybeCmd');
    expect(onCopyOriginalValue).toHaveBeenCalledWith('sampleapp://v1/open?cmd=1');
    expect(onLocatePath).toHaveBeenCalledWith('$.maybeCmd');
    expect(onOpenSchemeValue).toHaveBeenCalledWith('sampleapp://v1/open?cmd=1');
  });
});
