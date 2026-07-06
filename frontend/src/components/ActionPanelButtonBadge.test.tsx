import { describe, expect, it } from 'vitest';
import { ActionPanelButtonBadge } from './ActionPanelButtonBadge';
import { assertElementLike } from './componentElementTestHelpers';

describe('ActionPanelButtonBadge', () => {
  it('渲染工具栏按钮右侧状态 badge', () => {
    const tree = ActionPanelButtonBadge({
      label: '打开',
      dataTour: 'panel-open-badge',
      ariaHidden: true,
    });

    const badge = assertElementLike(tree, 'ActionPanelButtonBadge 应返回 React 元素');
    expect(badge.props['data-tour']).toBe('panel-open-badge');
    expect(badge.props['aria-hidden']).toBe(true);
    expect(badge.props.className).toContain('bg-brand-primary/20');
    expect(badge.props.children).toBe('打开');
  });
});
