import { describe, expect, it, vi } from 'vitest';
import { AppUpdateToastContent } from './AppUpdateToastContent';
import { assertElementLike, clickElement, collectText, findByType } from './componentElementTestHelpers';

const manifest = {
  name: 'JSONUtils' as const,
  version: '1.8.255',
  versionLabel: 'v1.8.255',
  changelogMarkdown: '- 更新内容',
};

describe('AppUpdateToastContent', () => {
  it('展示新版本信息并透传查看、刷新和关闭动作', () => {
    const onOpenChangelog = vi.fn();
    const onReload = vi.fn();
    const onDismiss = vi.fn();
    const tree = AppUpdateToastContent({
      manifest,
      toastId: 'toast-1',
      onOpenChangelog,
      onReload,
      onDismiss,
    });

    assertElementLike(tree, 'AppUpdateToastContent 应返回 React 元素');
    expect(tree.props['data-tour']).toBe('app-update-toast');
    expect(tree.props.className).toBe('app-release-toast');
    expect(collectText(tree)).toContain('发现新版本 v1.8.255');

    const buttons = findByType(tree, 'button');
    expect(buttons.map(button => collectText(button))).toEqual(['查看更新', '刷新', '稍后']);

    clickElement(buttons[0]);
    clickElement(buttons[1]);
    clickElement(buttons[2]);

    expect(onOpenChangelog).toHaveBeenCalledWith(manifest);
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('toast-1');
  });
});
