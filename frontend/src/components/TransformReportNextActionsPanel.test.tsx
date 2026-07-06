import { describe, expect, it, vi } from 'vitest';
import type { TransformReportNextActionItem } from '../utils/transformReportActionItems';
import { collectText, findByTour } from './componentElementTestHelpers';
import { TransformReportNextActionsPanel } from './TransformReportNextActionsPanel';

const nextActions: TransformReportNextActionItem[] = [{
  key: 'archive',
  label: '归档',
  description: '复制归档包',
  title: '复制归档包',
  tone: 'cyan',
  action: 'copy-archive',
}, {
  key: 'placeholder',
  label: '占位符',
  description: '打开模板',
  title: '打开回填模板',
  tone: 'purple',
  action: 'open-placeholder-fill',
  disabled: true,
}];

describe('TransformReportNextActionsPanel', () => {
  it('展示下一步行动并转发点击动作', () => {
    const onRunNextAction = vi.fn();
    const tree = TransformReportNextActionsPanel({ nextActions, onRunNextAction });
    const text = collectText(tree);

    expect(text).toContain('真实 response 下一步');
    expect(text).toContain('推荐 2 项');
    expect(text).toContain('归档');
    expect(text).toContain('占位符');
    expect(findByTour(tree, 'transform-report-next-action-placeholder')[0].props.disabled).toBe(true);

    (findByTour(tree, 'transform-report-next-action-archive')[0].props.onClick as () => void)();

    expect(onRunNextAction).toHaveBeenCalledWith('copy-archive');
  });
});
