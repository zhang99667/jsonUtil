import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TransformMode } from '../types';
import { ActionPanel, type ActionPanelProps } from './ActionPanel';
import { ActionPanelToolGroups } from './ActionPanelToolGroups';
import { findByType } from './componentElementTestHelpers';

const mocks = vi.hoisted(() => ({
  refreshTour: vi.fn(),
  triggerFeatureFirstUse: vi.fn(),
  handleScroll: vi.fn(),
  handleScrollbarMouseDown: vi.fn(),
}));

vi.mock('../hooks/useFeatureTour', () => ({
  FeatureId: {
    DEEP_FORMAT: 'deep-format',
    ESCAPE: 'escape',
    UNICODE_CONVERT: 'unicode-convert',
  },
  useFeatureTour: () => ({
    refreshTour: mocks.refreshTour,
    triggerFeatureFirstUse: mocks.triggerFeatureFirstUse,
  }),
}));

vi.mock('../hooks/useActionPanelScrollbar', () => ({
  useActionPanelScrollbar: () => ({
    containerRef: { current: null },
    handleScroll: mocks.handleScroll,
    handleScrollbarMouseDown: mocks.handleScrollbarMouseDown,
    showScrollbar: false,
    thumbHeight: 0,
    thumbTop: 0,
  }),
}));

const buildProps = (overrides: Partial<ActionPanelProps> = {}): ActionPanelProps => ({
  activeMode: TransformMode.FORMAT,
  onModeChange: vi.fn(),
  onAction: vi.fn(),
  isProcessing: false,
  onOpenSettings: vi.fn(),
  isCollapsed: false,
  onToggleCollapse: vi.fn(),
  isJsonPathOpen: false,
  isJsonTreeOpen: false,
  isJsonCompareOpen: false,
  isSchemeDecodeOpen: false,
  isTemplateFillOpen: false,
  isJsonSchemaOpen: false,
  onToggleJsonPath: vi.fn(),
  onToggleJsonTree: vi.fn(),
  onToggleJsonCompare: vi.fn(),
  onToggleSchemeDecode: vi.fn(),
  onToggleTemplateFill: vi.fn(),
  onToggleJsonSchema: vi.fn(),
  smartSuggestion: null,
  smartSuggestionOrigin: null,
  onSmartSuggestionAction: vi.fn(),
  ...overrides,
});

const getModeChangeHandler = (props: ActionPanelProps) => {
  const tree = ActionPanel(props);
  const toolGroups = findByType(tree, ActionPanelToolGroups);
  expect(toolGroups).toHaveLength(1);
  const handler = toolGroups[0].props.onModeChange;
  expect(typeof handler).toBe('function');
  if (typeof handler !== 'function') throw new Error('工具组应接收模式切换回调');
  return handler as (mode: TransformMode) => void;
};

describe('ActionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('切换需要引导的模式时先触发对应功能引导再透传模式', () => {
    const onModeChange = vi.fn();
    const handleModeChange = getModeChangeHandler(buildProps({ onModeChange }));

    handleModeChange(TransformMode.DEEP_FORMAT);

    expect(mocks.triggerFeatureFirstUse).toHaveBeenCalledWith('deep-format');
    expect(onModeChange).toHaveBeenCalledWith(TransformMode.DEEP_FORMAT);
    expect(mocks.triggerFeatureFirstUse.mock.invocationCallOrder[0]).toBeLessThan(
      onModeChange.mock.invocationCallOrder[0]
    );
  });

  it('切换普通格式化模式时不触发功能引导', () => {
    const onModeChange = vi.fn();
    const handleModeChange = getModeChangeHandler(buildProps({ onModeChange }));

    handleModeChange(TransformMode.FORMAT);

    expect(mocks.triggerFeatureFirstUse).not.toHaveBeenCalled();
    expect(onModeChange).toHaveBeenCalledWith(TransformMode.FORMAT);
  });
});
