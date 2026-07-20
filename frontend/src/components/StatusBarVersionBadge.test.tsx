import { describe, expect, it, vi } from 'vitest';
import { APP_VERSION_LABEL } from '../utils/appVersion';
import { assertElementLike, clickElement } from './componentElementTestHelpers';
import { StatusBarVersionBadge } from './StatusBarVersionBadge';

describe('StatusBarVersionBadge', () => {
  it('有更新日志入口时渲染按钮并触发回调', () => {
    const onOpenChangelog = vi.fn();
    const tree = assertElementLike(
      StatusBarVersionBadge({ onOpenChangelog }),
      'StatusBarVersionBadge 应返回 React 元素'
    );

    expect(tree.props['data-tour']).toBe('statusbar-version');
    expect(tree.props['aria-label']).toBe(`查看版本更新，当前版本 ${APP_VERSION_LABEL}`);
    expect(tree.props.className).toContain('bg-white/15');
    expect(tree.props.className).not.toContain('bg-sky-950');

    clickElement(tree);
    expect(onOpenChangelog).toHaveBeenCalledTimes(1);
  });

  it('无更新日志入口时渲染静态版本标识', () => {
    const tree = assertElementLike(
      StatusBarVersionBadge({}),
      'StatusBarVersionBadge 应返回 React 元素'
    );

    expect(tree.props.title).toBe('当前版本');
    expect(tree.props.onClick).toBeUndefined();
  });
});
