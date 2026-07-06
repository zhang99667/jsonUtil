import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRecord } from '../utils/transformSummary';
import { clickElement, collectText, findByTour } from './componentElementTestHelpers';
import { TransformReportCmdHandlerSummary } from './TransformReportCmdHandlerSummary';

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

    clickElement(findByTour(tree, 'transform-report-filter-command-schema')[0]);
    clickElement(findByTour(tree, 'transform-report-filter-command-param')[0]);

    expect(onFilter).toHaveBeenCalledWith('baiduboxapp://v1/open');
    expect(onFilter).toHaveBeenCalledWith('uid');
  });
});
