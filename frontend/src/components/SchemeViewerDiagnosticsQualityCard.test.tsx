import { describe, expect, it, vi } from 'vitest';
import type { SchemeQualitySummary } from '../utils/schemeQualitySummary';
import { SchemeViewerDiagnosticsQualityCard } from './SchemeViewerDiagnosticsQualityCard';

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

const findByTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findByTour(child, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByTour(node.props.children, dataTour));
};

const clickElement = (node: ElementLike) => {
  const onClick = node.props.onClick;
  if (typeof onClick !== 'function') throw new Error('expected clickable element');
  onClick();
};

const qualitySummary: SchemeQualitySummary = {
  level: 'warning',
  label: '部分可回写',
  description: '有少量参数不可逆',
  items: [
    { label: 'CMD', value: 1, tone: 'cyan' },
    { label: '不可逆', value: 2, tone: 'warning' },
  ],
};

describe('SchemeViewerDiagnosticsQualityCard', () => {
  it('没有质量摘要时不渲染', () => {
    expect(SchemeViewerDiagnosticsQualityCard({
      schemeQualitySummary: null,
      canInspectOriginal: false,
      onInspectOriginal: vi.fn(),
      onCopyQualitySummary: vi.fn(),
      onCopyQualitySnapshot: vi.fn(),
      copyQualitySnapshotTitle: '复制快照',
    })).toBeNull();
  });

  it('渲染质量详情并透传操作回调', () => {
    const onInspectOriginal = vi.fn();
    const onCopyQualitySummary = vi.fn();
    const onCopyQualitySnapshot = vi.fn();
    const tree = SchemeViewerDiagnosticsQualityCard({
      schemeQualitySummary: qualitySummary,
      canInspectOriginal: true,
      onInspectOriginal,
      onCopyQualitySummary,
      onCopyQualitySnapshot,
      copyQualitySnapshotTitle: '复制当前质量快照',
    });
    const text = collectText(tree);

    expect(text).toContain('部分可回写');
    expect(text).toContain('有少量参数不可逆');
    expect(text).toContain('CMD · 1');
    expect(text).toContain('不可逆 · 2');

    clickElement(findByTour(tree, 'scheme-inspect-original')[0]);
    clickElement(findByTour(tree, 'scheme-copy-quality-summary')[0]);
    clickElement(findByTour(tree, 'scheme-copy-quality-snapshot')[0]);

    expect(onInspectOriginal).toHaveBeenCalledTimes(1);
    expect(onCopyQualitySummary).toHaveBeenCalledTimes(1);
    expect(onCopyQualitySnapshot).toHaveBeenCalledTimes(1);
  });
});
