import { describe, expect, it, vi } from 'vitest';
import { ActionPanel } from './ActionPanel';
import { AppSidebarActionPanel, type AppSidebarActionPanelProps } from './AppSidebarActionPanel';
import { ActionType, TransformMode } from '../types';
import { assertElementLike, findByType } from './componentElementTestHelpers';

const buildProps = (overrides: Partial<AppSidebarActionPanelProps> = {}): AppSidebarActionPanelProps => ({
  activeMode: TransformMode.FORMAT,
  onModeChange: vi.fn(),
  onAction: vi.fn(),
  isProcessing: false,
  onOpenSettings: vi.fn(),
  isCollapsed: false,
  onToggleCollapse: vi.fn(),
  sidebarWidth: 312,
  isJsonPathOpen: true,
  isJsonTreeOpen: false,
  isJsonCompareOpen: false,
  isSchemeDecodeOpen: true,
  isTemplateFillOpen: false,
  isJsonSchemaOpen: false,
  onToggleJsonPath: vi.fn(),
  onToggleJsonTree: vi.fn(),
  onToggleJsonCompare: vi.fn(),
  onToggleJsonSchema: vi.fn(),
  onToggleSchemeDecode: vi.fn(),
  onToggleTemplateFill: vi.fn(),
  smartSuggestion: null,
  smartSuggestionOrigin: null,
  onSmartSuggestionAction: vi.fn(),
  ...overrides,
});

describe('AppSidebarActionPanel', () => {
  it('按侧栏宽度装配 ActionPanel 并透传工具状态', () => {
    const props = buildProps();
    const tree = assertElementLike(AppSidebarActionPanel(props), 'AppSidebarActionPanel 应返回 React 元素');

    expect(tree.props['data-tour']).toBe('toolbar');
    expect(tree.props.style).toEqual({ width: 312 });

    const panels = findByType(tree, ActionPanel);
    expect(panels).toHaveLength(1);
    expect(panels[0].props.activeMode).toBe(TransformMode.FORMAT);
    expect(panels[0].props.onAction).toBe(props.onAction);
    expect(panels[0].props.isJsonPathOpen).toBe(true);
    expect(panels[0].props.isSchemeDecodeOpen).toBe(true);
  });

  it('折叠时使用固定窄宽度', () => {
    const tree = assertElementLike(
      AppSidebarActionPanel(buildProps({ isCollapsed: true, sidebarWidth: 420 })),
      'AppSidebarActionPanel 应返回 React 元素'
    );

    expect(tree.props.style).toEqual({ width: 64 });
  });

  it('保留 ActionType 类型约束', () => {
    const onAction = vi.fn();
    const tree = AppSidebarActionPanel(buildProps({ onAction }));
    const panels = findByType(tree, ActionPanel);

    (panels[0].props.onAction as (action: ActionType) => void)(ActionType.SAVE);
    expect(onAction).toHaveBeenCalledWith(ActionType.SAVE);
  });
});
