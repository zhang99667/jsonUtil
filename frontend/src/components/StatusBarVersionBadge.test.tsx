import { describe, expect, it, vi } from 'vitest';
import { APP_VERSION_LABEL } from '../utils/appVersion';
import { StatusBarVersionBadge } from './StatusBarVersionBadge';

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

describe('StatusBarVersionBadge', () => {
  it('有更新日志入口时渲染按钮并触发回调', () => {
    const onOpenChangelog = vi.fn();
    const tree = StatusBarVersionBadge({ onOpenChangelog });

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('StatusBarVersionBadge 应返回 React 元素');
    expect(tree.props['data-tour']).toBe('statusbar-version');
    expect(tree.props['aria-label']).toBe(`查看版本更新，当前版本 ${APP_VERSION_LABEL}`);

    (tree.props.onClick as () => void)();
    expect(onOpenChangelog).toHaveBeenCalledTimes(1);
  });

  it('无更新日志入口时渲染静态版本标识', () => {
    const tree = StatusBarVersionBadge({});

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('StatusBarVersionBadge 应返回 React 元素');
    expect(tree.props.title).toBe('当前版本');
    expect(tree.props.onClick).toBeUndefined();
  });
});
