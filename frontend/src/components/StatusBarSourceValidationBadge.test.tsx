import { describe, expect, it, vi } from 'vitest';
import { StatusBarSourceValidationBadge } from './StatusBarSourceValidationBadge';
import type { StatusBarBadgeState } from '../utils/statusBarState';

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

const status: StatusBarBadgeState = {
  label: 'JSON 无效 L1:C2',
  className: 'bg-red-100 text-red-800',
  title: 'SOURCE JSON 无效: 缺少逗号',
};

describe('StatusBarSourceValidationBadge', () => {
  it('没有动作时渲染普通 SOURCE 校验状态', () => {
    const tree = StatusBarSourceValidationBadge({ status, action: null });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('StatusBarSourceValidationBadge 应返回 React 元素');
    expect(tree.type).toBe('span');
    expect(tree.props['data-tour']).toBe('source-validation-status');
    expect(tree.props.title).toBe(status.title);
    expect(tree.props.className).toContain('bg-red-100');
    expect(tree.props.children).toBe(status.label);
  });

  it('定位动作渲染可点击按钮并保留定位提示', () => {
    const onClick = vi.fn();
    const tree = StatusBarSourceValidationBadge({
      status,
      action: { type: 'locate', onClick },
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('StatusBarSourceValidationBadge 应返回 React 元素');
    expect(tree.type).toBe('button');
    expect(tree.props.title).toBe(`${status.title}，点击定位`);

    const handleClick = tree.props.onClick;
    expect(typeof handleClick).toBe('function');
    if (typeof handleClick !== 'function') throw new Error('校验状态按钮应透传 onClick');
    handleClick();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Scheme 动作渲染可点击按钮并保留打开面板提示', () => {
    const onClick = vi.fn();
    const tree = StatusBarSourceValidationBadge({
      status: {
        label: 'SOURCE Scheme',
        className: 'bg-blue-100 text-blue-800',
        title: '当前 SOURCE 是可直接解析的 CMD/Scheme，已按深度解析处理',
      },
      action: { type: 'openScheme', onClick },
    });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('StatusBarSourceValidationBadge 应返回 React 元素');
    expect(tree.type).toBe('button');
    expect(tree.props.title).toBe('当前 SOURCE 是可直接解析的 CMD/Scheme，已按深度解析处理，点击打开 Scheme 面板');
    expect(tree.props.className).toContain('bg-blue-100');
  });
});
