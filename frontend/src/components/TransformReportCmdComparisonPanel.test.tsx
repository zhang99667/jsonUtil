import { describe, expect, it, vi } from 'vitest';
import type { JsonValue } from '../types';
import type { CmdComparisonDiffSummary } from '../utils/transformReportCmdComparison';
import type { TransformReportRecord } from '../utils/transformSummary';
import {
  TransformReportCmdComparisonPanel,
  formatCmdComparisonDiffSummaryLabel,
} from './TransformReportCmdComparisonPanel';

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

const createCmdRecord = (
  path: string,
  cmdParams: JsonValue,
  overrides: Partial<TransformReportRecord> = {}
): TransformReportRecord => ({
  path,
  sourceLabel: 'scheme',
  commandSchema: 'baiduboxapp://v1/open',
  hasCmdStructure: true,
  cmdStructureCopyText: JSON.stringify({
    result: {
      cmdSchema: 'baiduboxapp://v1/open',
      source: 'baiduboxapp://v1/open',
      cmdParams,
    },
  }),
  ...overrides,
} as TransformReportRecord);

const expectedText = JSON.stringify({
  result: {
    cmdSchema: 'baiduboxapp://v1/open',
    source: 'baiduboxapp://v1/open',
    cmdParams: {
      id: 2,
      nested: {
        ok: true,
      },
    },
  },
});

describe('TransformReportCmdComparisonPanel', () => {
  it('渲染差异摘要并转发复制与候选切换动作', () => {
    const currentRecord = createCmdRecord('$.current', { id: 1 });
    const betterRecord = createCmdRecord('$.better', {
      id: 2,
      nested: {
        ok: true,
      },
    });
    const onCopyDiff = vi.fn();
    const onSwitchCandidate = vi.fn();

    const tree = TransformReportCmdComparisonPanel({
      record: currentRecord,
      candidateRecords: [currentRecord, betterRecord],
      expectedText,
      ignoreExtraPaths: false,
      activeCandidate: null,
      onExpectedTextChange: vi.fn(),
      onIgnoreExtraPathsChange: vi.fn(),
      onCopyDiff,
      onToggle: vi.fn(),
      onSwitchCandidate,
    });

    const text = collectText(tree);
    expect(text).toContain('存在差异');
    expect(text).toContain('可能拿错 actual');

    const copyButton = findByDataTour(tree, 'transform-report-copy-cmd-comparison-diff')[0];
    expect(copyButton.props.disabled).toBe(false);
    (copyButton.props.onClick as () => void)();
    expect(onCopyDiff).toHaveBeenCalledWith(currentRecord);

    const betterCandidateButton = findByDataTour(tree, 'transform-report-cmd-candidate')
      .find(button => button.props.disabled !== true);
    expect(betterCandidateButton).toBeTruthy();
    (betterCandidateButton?.props.onClick as () => void)();
    expect(onSwitchCandidate.mock.calls[0][0]).toMatchObject({
      id: '$.better',
      recordPath: '$.better',
    });
  });

  it('无 expected 时展示引导并禁用复制差异', () => {
    const record = createCmdRecord('$.current', { id: 1 });
    const tree = TransformReportCmdComparisonPanel({
      record,
      candidateRecords: [record],
      expectedText: '',
      ignoreExtraPaths: false,
      activeCandidate: null,
      onExpectedTextChange: vi.fn(),
      onIgnoreExtraPathsChange: vi.fn(),
      onCopyDiff: vi.fn(),
      onToggle: vi.fn(),
      onSwitchCandidate: vi.fn(),
    });

    expect(collectText(tree)).toContain('把内部 cmdHandler 的解析结果');
    expect(findByDataTour(tree, 'transform-report-copy-cmd-comparison-diff')[0].props.disabled).toBe(true);
    expect(findByDataTour(tree, 'transform-report-cmd-candidate')).toEqual([]);
  });

  it('格式化一致但忽略额外路径的摘要文案', () => {
    const diffSummary: CmdComparisonDiffSummary = {
      hasDifferences: false,
      missingLabel: '缺失 0 个',
      extraLabel: '额外 0 个',
      ignoredExtraLabel: '已忽略 2 个',
      valueDiffCount: 0,
      hasSchemaDiff: false,
      hasSourceDiff: false,
      previewLines: [],
    };

    expect(formatCmdComparisonDiffSummaryLabel(diffSummary)).toBe('结构一致，已忽略额外 2 个');
  });
});
