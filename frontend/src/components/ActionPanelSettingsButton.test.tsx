import { describe, expect, it, vi } from 'vitest';
import { ActionPanelSettingsButton } from './ActionPanelSettingsButton';
import { assertElementLike, clickElement, collectText, findByType } from './componentElementTestHelpers';

describe('ActionPanelSettingsButton', () => {
  it('展开态展示设置文案并透传点击', () => {
    const onOpenSettings = vi.fn();
    const root = assertElementLike(ActionPanelSettingsButton({
      isCollapsed: false,
      onOpenSettings,
    }));
    const button = findByType(root, 'button')[0];

    expect(root.type).toBe('div');
    expect(root.props.className).toBe('pt-4 mt-auto');
    expect(button.props['data-tour']).toBe('settings');
    expect(button.props['aria-label']).toBe('设置');
    expect(button.props.title).toBe('设置');
    expect(collectText(button)).toContain('设置');

    clickElement(button);

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('折叠态保留可访问标题并隐藏可见文案', () => {
    const root = assertElementLike(ActionPanelSettingsButton({
      isCollapsed: true,
      onOpenSettings: vi.fn(),
    }));
    const button = findByType(root, 'button')[0];

    expect(button.props['aria-label']).toBe('设置');
    expect(button.props.title).toBe('设置');
    expect(collectText(button)).not.toContain('设置');
    expect(findByType(root, 'svg')).toHaveLength(1);
  });
});
