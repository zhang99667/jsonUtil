import { describe, expect, it, vi } from 'vitest';
import { ActionPanelSettingsButton } from './ActionPanelSettingsButton';

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

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

const assertElementLike = (node: unknown): ElementLike => {
  if (!isElementLike(node)) {
    throw new Error('expected React element-like node');
  }
  return node;
};

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

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

    const onClick = button.props.onClick;
    if (typeof onClick !== 'function') throw new Error('expected clickable settings button');
    onClick();

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
