import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppAiRepairSummarySlot } from './AppAiRepairSummarySlot';
import { LazyAiRepairSummaryBanner } from './appLazyPanels';
import type { AiRepairSummary } from '../utils/aiRepairSummary';

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

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const buildSummary = (): AiRepairSummary => ({
  changed: true,
  repairMethod: 'local',
  localRuleLabels: ['补全尾逗号'],
  beforeLength: 10,
  afterLength: 12,
  beforeLines: 1,
  afterLines: 1,
  addedChars: 2,
  removedChars: 0,
  changedChunks: 1,
  rootDescription: '对象 1 个键',
  previewItems: [],
  isPreviewTruncated: false,
  isDiffSkipped: false,
});

describe('AppAiRepairSummarySlot', () => {
  it('没有修复摘要时不渲染懒加载区域', () => {
    const tree = AppAiRepairSummarySlot({
      summary: null,
      onClose: vi.fn(),
      onCopySuccess: vi.fn(),
      onCopyError: vi.fn(),
    });

    expect(tree).toBeNull();
  });

  it('有修复摘要时装配懒加载摘要条并透传事件', () => {
    const summary = buildSummary();
    const onClose = vi.fn();
    const onCopySuccess = vi.fn();
    const onCopyError = vi.fn();

    const tree = AppAiRepairSummarySlot({
      summary,
      onClose,
      onCopySuccess,
      onCopyError,
    });
    const suspenseNodes = findByType(tree, Suspense);
    const banners = findByType(tree, LazyAiRepairSummaryBanner);

    expect(suspenseNodes).toHaveLength(1);
    expect(banners).toHaveLength(1);
    expect(banners[0].props.summary).toBe(summary);
    expect(banners[0].props.onClose).toBe(onClose);
    expect(banners[0].props.onCopySuccess).toBe(onCopySuccess);
    expect(banners[0].props.onCopyError).toBe(onCopyError);
  });
});
