import { describe, expect, it, vi } from 'vitest';
import type { TransformReportFooterActionId } from '../utils/transformReportFooterActions';
import { DraggablePanel } from './DraggablePanel';
import { TransformReportPanelFooter } from './TransformReportPanelFooter';
import { TransformReportPanelFrame } from './TransformReportPanelFrame';

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

describe('TransformReportPanelFrame', () => {
  it('固定深度解析面板 shell 配置并装配 footer', () => {
    const onClose = vi.fn();
    const child = <div data-testid="content" />;
    const tree = TransformReportPanelFrame({
      isOpen: true,
      onClose,
      summary: '2 项可复制',
      actions: [],
      actionHandlers,
      children: child,
    });
    const footer = tree.props.footer;

    expect(tree.type).toBe(DraggablePanel);
    expect(tree.props).toMatchObject({
      isOpen: true,
      onClose,
      title: '深度解析报告',
      storageKey: 'transform-report-panel',
      defaultPosition: { x: 220, y: 120 },
      defaultSize: { width: 680, height: 520 },
      minSize: { width: 480, height: 320 },
      dataTour: 'transform-report-panel',
      children: child,
    });
    expect(footer.type).toBe(TransformReportPanelFooter);
    expect(footer.props).toMatchObject({
      summary: '2 项可复制',
      actions: [],
      actionHandlers,
    });
  });
});
