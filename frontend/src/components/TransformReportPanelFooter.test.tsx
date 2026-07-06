import { describe, expect, it, vi } from 'vitest';
import { TransformReportPanelFooter } from './TransformReportPanelFooter';
import type {
  TransformReportFooterAction,
  TransformReportFooterActionId,
} from '../utils/transformReportFooterActions';
import { findByType } from './componentElementTestHelpers';

const actions: TransformReportFooterAction[] = [
  {
    id: 'copy-diagnostic-summary',
    dataTour: 'transform-report-copy-diagnostic-summary',
    label: '复制诊断摘要',
    title: '诊断标题',
    ariaLabel: '复制诊断摘要，诊断标题',
    disabled: false,
    tone: 'neutral',
  },
  {
    id: 'copy-full-report',
    dataTour: 'transform-report-copy-full-report',
    label: '复制报告',
    title: '完整报告标题',
    ariaLabel: '复制报告，完整报告标题',
    disabled: true,
    tone: 'neutral',
  },
];

describe('TransformReportPanelFooter', () => {
  it('渲染 summary、按钮属性并转发点击', () => {
    const actionHandlers: Record<TransformReportFooterActionId, () => void> = {
      'copy-filtered-report': vi.fn(),
      'copy-collaboration-report': vi.fn(),
      'copy-diagnostic-summary': vi.fn(),
      'copy-quality-snapshot': vi.fn(),
      'set-quality-baseline': vi.fn(),
      'copy-quality-baseline-delta': vi.fn(),
      'clear-quality-baseline': vi.fn(),
      'copy-archive-package': vi.fn(),
      'copy-troubleshooting-recipe': vi.fn(),
      'copy-path-values': vi.fn(),
      'copy-cmd-structures': vi.fn(),
      'copy-issue-samples': vi.fn(),
      'copy-issue-sample-json': vi.fn(),
      'copy-redacted-issue-sample-json': vi.fn(),
      'copy-issue-regression-template': vi.fn(),
      'copy-full-report': vi.fn(),
    };
    const tree = TransformReportPanelFooter({
      summary: '3 项可复制',
      actions,
      actionHandlers,
    });
    const buttons = findByType(tree, 'button');

    expect(tree).toMatchObject({
      props: {
        children: expect.arrayContaining([
          expect.objectContaining({ props: expect.objectContaining({ children: '3 项可复制' }) }),
        ]),
      },
    });
    expect(buttons).toHaveLength(2);
    expect(buttons[0].props).toMatchObject({
      'data-tour': 'transform-report-copy-diagnostic-summary',
      title: '诊断标题',
      'aria-label': '复制诊断摘要，诊断标题',
      disabled: false,
      children: '复制诊断摘要',
    });
    expect(buttons[1].props.disabled).toBe(true);

    const onClick = buttons[0].props.onClick as () => void;
    onClick();
    expect(actionHandlers['copy-diagnostic-summary']).toHaveBeenCalledTimes(1);
  });
});
