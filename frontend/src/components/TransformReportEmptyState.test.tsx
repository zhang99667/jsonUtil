import { describe, expect, it, vi } from 'vitest';
import { TransformReportEmptyState } from './TransformReportEmptyState';

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

const findButton = (node: unknown): ElementLike | null => {
  if (Array.isArray(node)) return node.map(findButton).find(Boolean) || null;
  if (!isElementLike(node)) return null;
  if (node.props.type === 'button') return node;
  return findButton(node.props.children);
};

describe('TransformReportEmptyState', () => {
  it('无筛选时展示默认空态且不展示清空按钮', () => {
    const tree = TransformReportEmptyState({
      query: '',
      onClearFilter: vi.fn(),
    });

    expect(collectText(tree)).toContain('本次深度格式化没有展开嵌套字符串');
    expect(findButton(tree)).toBeNull();
  });

  it('有筛选时展示匹配空态并转发清空动作', () => {
    const onClearFilter = vi.fn();
    const tree = TransformReportEmptyState({
      query: 'CMD',
      onClearFilter,
    });
    const button = findButton(tree);

    expect(collectText(tree)).toContain('没有匹配的解析记录');
    expect(button).toBeTruthy();
    (button?.props.onClick as () => void)();
    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });
});
