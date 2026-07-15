import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRecord } from '../utils/transformSummary';
import { clickElement, collectText, findByTour, findByType } from './componentElementTestHelpers';
import { SourceLabelBadge } from './TransformReportPanelAtoms';
import { TransformReportRecordHeader } from './TransformReportRecordHeader';
import { TransformReportRecordHeaderActions } from './TransformReportRecordHeaderActions';

const renderHeaderActions = (tree: unknown): unknown => {
  const actionNode = findByType(tree, TransformReportRecordHeaderActions)[0];
  if (!actionNode) throw new Error('记录头部应装配动作区');
  return TransformReportRecordHeaderActions(actionNode.props as Parameters<typeof TransformReportRecordHeaderActions>[0]);
};

const record = {
  path: '$.cmd',
  sourceLabel: 'scheme',
  originalValue: 'sampleapp://v1/open?uid=1',
  hasNonReversibleScheme: true,
  hasCmdStructure: true,
  cmdStructureFocusPaths: ['$.cmd.uid'],
  cmdStructureFocusLabel: '内部路径',
} as TransformReportRecord;

describe('TransformReportRecordHeader', () => {
  it('展示记录头部状态并转发复制、定位、Scheme 和 cmdHandler 动作', () => {
    const actions = {
      onCopyPath: vi.fn(),
      onCopyOriginalValue: vi.fn(),
      onCopyDecodedPathValue: vi.fn(),
      onCopyCmdStructure: vi.fn(),
      onCopyCmdComparisonPackage: vi.fn(),
      onToggleCmdComparison: vi.fn(),
      onCopyCmdComparisonDiff: vi.fn(),
      onSwitchCmdComparisonCandidate: vi.fn(),
      onCmdComparisonExpectedTextChange: vi.fn(),
      onCmdComparisonIgnoreExtraPathsChange: vi.fn(),
      onLocatePath: vi.fn(),
      onOpenSchemeValue: vi.fn(),
    };
    const tree = TransformReportRecordHeader({ record, actions });
    const actionTree = renderHeaderActions(tree);
    const text = `${collectText(tree)}${collectText(actionTree)}`;

    expect(text).toContain('$.cmd');
    expect(text).toContain('不可逆');
    expect(text).toContain('复制聚焦 CMD');
    expect(findByType(tree, SourceLabelBadge)[0].props.label).toBe('scheme');
    expect(findByTour(actionTree, 'transform-report-copy-cmd-structure')[0].props.title)
      .toBe('复制按当前筛选命中的内部路径裁剪后的 cmdParams');

    clickElement(findByTour(actionTree, 'transform-report-copy-path')[0]);
    clickElement(findByTour(actionTree, 'transform-report-copy-original-value')[0]);
    clickElement(findByTour(actionTree, 'transform-report-copy-cmd-structure')[0]);
    clickElement(findByTour(actionTree, 'transform-report-copy-cmd-comparison-package')[0]);
    clickElement(findByTour(actionTree, 'transform-report-open-cmd-comparison')[0]);
    clickElement(findByTour(actionTree, 'transform-report-locate-path')[0]);
    clickElement(findByTour(actionTree, 'transform-report-open-scheme')[0]);

    expect(actions.onCopyPath).toHaveBeenCalledWith('$.cmd');
    expect(actions.onCopyOriginalValue).toHaveBeenCalledWith('sampleapp://v1/open?uid=1');
    expect(actions.onCopyCmdStructure).toHaveBeenCalledWith(record);
    expect(actions.onCopyCmdComparisonPackage).toHaveBeenCalledWith(record);
    expect(actions.onToggleCmdComparison).toHaveBeenCalledWith(record);
    expect(actions.onLocatePath).toHaveBeenCalledWith('$.cmd');
    expect(actions.onOpenSchemeValue).toHaveBeenCalledWith('sampleapp://v1/open?uid=1');
  });

  it('没有 cmdHandler 结构时隐藏 cmdHandler 操作', () => {
    const tree = TransformReportRecordHeader({
      record: { ...record, hasCmdStructure: false, cmdStructureFocusPaths: [] },
      actions: {
        onCopyPath: vi.fn(),
        onCopyOriginalValue: vi.fn(),
        onCopyDecodedPathValue: vi.fn(),
        onCopyCmdStructure: vi.fn(),
        onCopyCmdComparisonPackage: vi.fn(),
        onToggleCmdComparison: vi.fn(),
        onCopyCmdComparisonDiff: vi.fn(),
        onSwitchCmdComparisonCandidate: vi.fn(),
        onCmdComparisonExpectedTextChange: vi.fn(),
        onCmdComparisonIgnoreExtraPathsChange: vi.fn(),
      },
    });
    const actions = renderHeaderActions(tree);

    expect(findByTour(actions, 'transform-report-copy-cmd-structure')).toHaveLength(0);
    expect(findByTour(actions, 'transform-report-copy-cmd-comparison-package')).toHaveLength(0);
    expect(findByTour(actions, 'transform-report-open-cmd-comparison')).toHaveLength(0);
    expect(findByTour(actions, 'transform-report-locate-path')).toHaveLength(0);
    expect(findByTour(actions, 'transform-report-open-scheme')).toHaveLength(0);
  });
});
