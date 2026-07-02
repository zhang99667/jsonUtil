import { describe, expect, it, vi } from 'vitest';
import type { SmartInputSuggestion, SmartSuggestionAction } from '../utils/smartInputSuggestion';
import { ActionPanelSmartSuggestion } from './ActionPanelSmartSuggestion';
import { ActionPanelSmartSuggestionActionButton } from './ActionPanelSmartSuggestionActionButton';
import { ActionPanelSmartSuggestionIcon } from './ActionPanelSmartSuggestionIcon';
import { findByTour, findByTypeOrNull, isElementLike, type ElementLike } from './schemeViewerElementTestHelpers';
import { ActionPanelSmartSuggestionHeader } from './ActionPanelSmartSuggestionHeader';

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findByType(child, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const suggestion: SmartInputSuggestion = {
  id: 'json-with-cmd',
  title: '检测到 JSON 内含 CMD / Scheme',
  description: '建议先做嵌套解析和结构浏览。',
  tone: 'cyan',
  actions: [
    { id: 'deep-format-report', label: '嵌套解析' },
    { id: 'structure-nav', label: '结构导航' },
    { id: 'response-inspection', label: '高级排查' },
    { id: 'schema-panel', label: 'Schema' },
  ],
};

interface SmartSuggestionActionButtonProps {
  action: SmartSuggestionAction;
  onAction: (actionId: SmartSuggestionAction['id']) => void;
  isWide: boolean;
}

const getButtonClick = (button: ElementLike): (() => void) => {
  const onClick = button.props.onClick;
  if (typeof onClick !== 'function') throw new Error('智能建议按钮应透传点击回调');
  return onClick as () => void;
};

const getActionButtonProps = (button: ElementLike): SmartSuggestionActionButtonProps => (
  button.props as unknown as SmartSuggestionActionButtonProps
);

describe('ActionPanelSmartSuggestion', () => {
  it('没有建议或没有动作时不渲染', () => {
    expect(ActionPanelSmartSuggestion({
      smartSuggestion: null,
      isCollapsed: false,
      onSmartSuggestionAction: vi.fn(),
    })).toBeNull();
    expect(ActionPanelSmartSuggestion({
      smartSuggestion: { ...suggestion, actions: [] },
      isCollapsed: false,
      onSmartSuggestionAction: vi.fn(),
    })).toBeNull();
  });

  it('折叠态只渲染主按钮并触发第一动作', () => {
    const onAction = vi.fn();
    const tree = ActionPanelSmartSuggestion({
      smartSuggestion: suggestion,
      smartSuggestionOrigin: 'clipboard',
      isCollapsed: true,
      onSmartSuggestionAction: onAction,
    });
    const button = findByTour(tree, 'smart-action-suggestion')[0];

    expect(button.props['aria-label']).toContain('剪贴板识别');
    expect(button.props.title).toContain('嵌套解析');
    expect(findByTypeOrNull(tree, ActionPanelSmartSuggestionIcon)?.props.className).toContain('h-5');
    getButtonClick(button)();
    expect(onAction).toHaveBeenCalledWith('deep-format-report');
  });

  it('展开态展示来源、说明和最多三个动作按钮', () => {
    const onAction = vi.fn();
    const tree = ActionPanelSmartSuggestion({
      smartSuggestion: suggestion,
      smartSuggestionOrigin: 'clipboard',
      isCollapsed: false,
      onSmartSuggestionAction: onAction,
    });
    const actionButtons = findByType(tree, ActionPanelSmartSuggestionActionButton);

    expect(findByTypeOrNull(tree, ActionPanelSmartSuggestionHeader)?.props).toMatchObject({
      smartSuggestion: suggestion,
      originLabel: '剪贴板识别',
    });
    expect(actionButtons.map(button => getActionButtonProps(button).action.id)).toEqual([
      'deep-format-report',
      'structure-nav',
      'response-inspection',
    ]);
    expect(getActionButtonProps(actionButtons[2]).isWide).toBe(true);
    getActionButtonProps(actionButtons[1]).onAction('structure-nav');
    expect(onAction).toHaveBeenCalledWith('structure-nav');
  });
});
