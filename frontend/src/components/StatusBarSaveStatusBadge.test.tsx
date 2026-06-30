import { describe, expect, it } from 'vitest';
import type { StatusBarBadgeState } from '../utils/statusBarState';
import { StatusBarSaveStatusBadge } from './StatusBarSaveStatusBadge';

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

const status: StatusBarBadgeState = {
  label: '未保存',
  className: 'bg-yellow-100 text-yellow-800',
  title: '当前文件有未保存修改',
};

describe('StatusBarSaveStatusBadge', () => {
  it('展示保存状态文案、样式和提示', () => {
    const tree = StatusBarSaveStatusBadge({ status });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('StatusBarSaveStatusBadge 应返回 React 元素');
    expect(tree.props['data-tour']).toBe('save-status');
    expect(tree.props.className).toContain('bg-yellow-100');
    expect(tree.props.title).toBe(status.title);
    expect(tree.props.children).toBe(status.label);
  });
});
