import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRecord } from '../utils/transformSummary';
import { SourceLabelBadge } from './TransformReportPanelAtoms';
import { TransformReportRecordHeader } from './TransformReportRecordHeader';
import { TransformReportRecordHeaderActions } from './TransformReportRecordHeaderActions';

interface ElementLike {
  type?: unknown;
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

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const renderHeaderActions = (tree: unknown): unknown => {
  const actionNode = findByType(tree, TransformReportRecordHeaderActions)[0];
  if (!actionNode) throw new Error('记录头部应装配动作区');
  return TransformReportRecordHeaderActions(actionNode.props as Parameters<typeof TransformReportRecordHeaderActions>[0]);
};

const record = {
  path: '$.cmd',
  sourceLabel: 'scheme',
  originalValue: 'baiduboxapp://v1/open?uid=1',
  hasNonReversibleScheme: true,
  hasCmdStructure: true,
  cmdStructureFocusPaths: ['$.cmd.uid'],
  cmdStructureFocusLabel: '内部路径',
} as TransformReportRecord;

describe('TransformReportRecordHeader', () => {
  it('展示记录头部状态并转发复制、定位、Scheme 和 cmdHandler 动作', () => {
    const props = {
      record,
      onCopyPath: vi.fn(),
      onCopyOriginalValue: vi.fn(),
      onCopyCmdStructure: vi.fn(),
      onCopyCmdComparisonPackage: vi.fn(),
      onToggleCmdComparison: vi.fn(),
      onLocatePath: vi.fn(),
      onOpenSchemeValue: vi.fn(),
    };
    const tree = TransformReportRecordHeader(props);
    const actions = renderHeaderActions(tree);
    const text = `${collectText(tree)}${collectText(actions)}`;

    expect(text).toContain('$.cmd');
    expect(text).toContain('不可逆');
    expect(text).toContain('复制聚焦 CMD');
    expect(findByType(tree, SourceLabelBadge)[0].props.label).toBe('scheme');
    expect(findByDataTour(actions, 'transform-report-copy-cmd-structure')[0].props.title)
      .toBe('复制按当前筛选命中的内部路径裁剪后的 cmdParams');

    (findByDataTour(actions, 'transform-report-copy-path')[0].props.onClick as () => void)();
    (findByDataTour(actions, 'transform-report-copy-original-value')[0].props.onClick as () => void)();
    (findByDataTour(actions, 'transform-report-copy-cmd-structure')[0].props.onClick as () => void)();
    (findByDataTour(actions, 'transform-report-copy-cmd-comparison-package')[0].props.onClick as () => void)();
    (findByDataTour(actions, 'transform-report-open-cmd-comparison')[0].props.onClick as () => void)();
    (findByDataTour(actions, 'transform-report-locate-path')[0].props.onClick as () => void)();
    (findByDataTour(actions, 'transform-report-open-scheme')[0].props.onClick as () => void)();

    expect(props.onCopyPath).toHaveBeenCalledWith('$.cmd');
    expect(props.onCopyOriginalValue).toHaveBeenCalledWith('baiduboxapp://v1/open?uid=1');
    expect(props.onCopyCmdStructure).toHaveBeenCalledWith(record);
    expect(props.onCopyCmdComparisonPackage).toHaveBeenCalledWith(record);
    expect(props.onToggleCmdComparison).toHaveBeenCalledWith(record);
    expect(props.onLocatePath).toHaveBeenCalledWith('$.cmd');
    expect(props.onOpenSchemeValue).toHaveBeenCalledWith('baiduboxapp://v1/open?uid=1');
  });

  it('没有 cmdHandler 结构时隐藏 cmdHandler 操作', () => {
    const tree = TransformReportRecordHeader({
      record: { ...record, hasCmdStructure: false, cmdStructureFocusPaths: [] },
      onCopyPath: vi.fn(),
      onCopyOriginalValue: vi.fn(),
      onCopyCmdStructure: vi.fn(),
      onCopyCmdComparisonPackage: vi.fn(),
      onToggleCmdComparison: vi.fn(),
    });
    const actions = renderHeaderActions(tree);

    expect(findByDataTour(actions, 'transform-report-copy-cmd-structure')).toHaveLength(0);
    expect(findByDataTour(actions, 'transform-report-copy-cmd-comparison-package')).toHaveLength(0);
    expect(findByDataTour(actions, 'transform-report-open-cmd-comparison')).toHaveLength(0);
    expect(findByDataTour(actions, 'transform-report-locate-path')).toHaveLength(0);
    expect(findByDataTour(actions, 'transform-report-open-scheme')).toHaveLength(0);
  });
});
