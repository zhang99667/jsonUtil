import { describe, expect, it, vi } from 'vitest';
import { AppActionSidebar } from './AppActionSidebar';
import { AppSidebarResizeHandle } from './AppResizeHandles';
import { AppSidebarActionPanel, type AppSidebarActionPanelProps } from './AppSidebarActionPanel';
import { findByType } from './componentElementTestHelpers';
import { TransformMode } from '../types';

const buildPanelProps = (overrides: Partial<AppSidebarActionPanelProps> = {}): AppSidebarActionPanelProps => ({
  activeMode: TransformMode.FORMAT,
  onModeChange: vi.fn(),
  onAction: vi.fn(),
  isProcessing: false,
  onOpenSettings: vi.fn(),
  isCollapsed: false,
  onToggleCollapse: vi.fn(),
  sidebarWidth: 320,
  isJsonPathOpen: false,
  isJsonTreeOpen: false,
  isJsonCompareOpen: false,
  isSchemeDecodeOpen: false,
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

describe('AppActionSidebar', () => {
  it('装配工具面板和可见的 resize handle', () => {
    const onStartResize = vi.fn();
    const onResizeKeyDown = vi.fn();
    const props = {
      ...buildPanelProps({ sidebarWidth: 320 }),
      isResizing: true,
      onStartResize,
      onResizeKeyDown,
    };

    const tree = AppActionSidebar(props);
    const panels = findByType(tree, AppSidebarActionPanel);
    const handles = findByType(tree, AppSidebarResizeHandle);

    expect(panels).toHaveLength(1);
    expect(panels[0].props.sidebarWidth).toBe(320);
    expect(handles).toHaveLength(1);
    expect(handles[0].props.isVisible).toBe(true);
    expect(handles[0].props.isResizing).toBe(true);
    expect(handles[0].props.sidebarWidth).toBe(320);
    expect(handles[0].props.onMouseDown).toBe(onStartResize);
    expect(handles[0].props.onKeyDown).toBe(onResizeKeyDown);
  });

  it('侧栏折叠时隐藏 resize handle', () => {
    const tree = AppActionSidebar({
      ...buildPanelProps({ isCollapsed: true }),
      isResizing: false,
      onStartResize: vi.fn(),
      onResizeKeyDown: vi.fn(),
    });
    const handles = findByType(tree, AppSidebarResizeHandle);

    expect(handles).toHaveLength(1);
    expect(handles[0].props.isVisible).toBe(false);
  });
});
