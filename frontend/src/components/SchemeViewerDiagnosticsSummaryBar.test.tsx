import { describe, expect, it, vi } from 'vitest';
import type { SchemeQualitySummary } from '../utils/schemeQualitySummary';
import { SchemeViewerDiagnosticsSummaryBar } from './SchemeViewerDiagnosticsSummaryBar';
import { collectText, findByTypeAndText, type ElementLike } from './schemeViewerElementTestHelpers';

const clickElement = (node: ElementLike) => {
  const onClick = node.props.onClick;
  if (typeof onClick !== 'function') throw new Error('expected clickable element');
  onClick();
};

const qualitySummary: SchemeQualitySummary = {
  level: 'success',
  label: '解析完成',
  description: '已识别 CMD、参数和可复制结构',
  items: [{ label: 'CMD', value: 1, tone: 'cyan' }],
};

describe('SchemeViewerDiagnosticsSummaryBar', () => {
  it('折叠态用一行展示质量和摘要 chips', () => {
    const onToggleExpanded = vi.fn();
    const tree = SchemeViewerDiagnosticsSummaryBar({
      isExpanded: false,
      onToggleExpanded,
      schemeQualitySummary: qualitySummary,
      diagnosticSummaryItems: [
        { key: 'cmd', label: 'CMD · 1', title: '已识别 CMD 结构' },
        { key: 'layers', label: '解码层 · 2', title: '已识别整体解码链路' },
      ],
    });
    const text = collectText(tree);

    expect(text).toContain('解析完成');
    expect(text).toContain('CMD · 1');
    expect(text).toContain('解码层 · 2');
    expect(text).toContain('展开详情');

    clickElement(findByTypeAndText(tree, 'button', '展开详情')[0]);
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it('缺少质量摘要时仍保留解析信息入口', () => {
    const tree = SchemeViewerDiagnosticsSummaryBar({
      isExpanded: true,
      onToggleExpanded: vi.fn(),
      schemeQualitySummary: null,
      diagnosticSummaryItems: [],
    });

    expect(collectText(tree)).toContain('解析信息');
    expect(collectText(tree)).toContain('收起详情');
  });
});
