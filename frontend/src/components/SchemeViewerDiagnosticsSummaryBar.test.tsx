import { describe, expect, it, vi } from 'vitest';
import type { SchemeQualitySummary } from '../utils/schemeQualitySummary';
import { SchemeViewerDiagnosticsSummaryBar } from './SchemeViewerDiagnosticsSummaryBar';

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

const findButtonsByText = (node: unknown, label: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findButtonsByText(child, label));
  if (!isElementLike(node)) return [];

  const matches = node.type === 'button' && collectText(node).includes(label) ? [node] : [];
  return matches.concat(findButtonsByText(node.props.children, label));
};

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

    clickElement(findButtonsByText(tree, '展开详情')[0]);
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
