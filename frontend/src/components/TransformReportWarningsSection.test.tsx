import { describe, expect, it, vi } from 'vitest';
import type { TransformReportWarning } from '../utils/transformSummary';
import { TransformReportWarningsSection } from './TransformReportWarningsSection';
import { clickElement, collectText, findByTour } from './componentElementTestHelpers';

const warning: TransformReportWarning = {
  type: 'string_decode_skipped',
  path: '$.large',
  sourceLabel: 'scheme',
  message: '内容过长，已跳过',
  reasonLabel: '性能保护',
  nextAction: '缩小样本后重试',
  originalValue: 'sampleapp://v1/open?cmd=1',
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

    clickElement(findByTour(tree, 'transform-report-warning-copy-path')[0]);
    clickElement(findByTour(tree, 'transform-report-warning-copy-value')[0]);
    clickElement(findByTour(tree, 'transform-report-locate-warning-path')[0]);
    clickElement(findByTour(tree, 'transform-report-open-warning-scheme')[0]);

    expect(onCopyPath).toHaveBeenCalledWith('$.large');
    expect(onCopyOriginalValue).toHaveBeenCalledWith('sampleapp://v1/open?cmd=1');
    expect(onLocatePath).toHaveBeenCalledWith('$.large');
    expect(onOpenSchemeValue).toHaveBeenCalledWith('sampleapp://v1/open?cmd=1');
  });
});
