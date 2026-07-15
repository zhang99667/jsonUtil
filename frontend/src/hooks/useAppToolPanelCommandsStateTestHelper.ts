import { vi } from 'vitest';

export const TOOL_PANEL_COMMAND_STATE_KEYS = [
  'isJsonPathPanelOpen',
  'isJsonTreePanelOpen',
  'isJsonComparePanelOpen',
  'isJsonSchemaPanelOpen',
  'jsonPathQueryRequest',
  'jsonTreeFocusRequest',
  'schemeInputRequest',
  'templateFillRequest',
  'isSettingsModalOpen',
  'settingsInitialTab',
  'isChangelogModalOpen',
  'changelogSourceMarkdown',
  'changelogHighlightedVersion',
  'isSchemeDecodeOpen',
  'isTemplatePanelOpen',
  'templateApplyQualityDelta',
  'isTransformReportOpen',
] as const;

export type ToolPanelCommandStateKey = typeof TOOL_PANEL_COMMAND_STATE_KEYS[number];
export type ToolPanelCommandStateOverrides = Partial<Record<ToolPanelCommandStateKey, unknown>>;
export type ToolPanelCommandStateSetters = Partial<Record<
  ToolPanelCommandStateKey,
  ReturnType<typeof vi.fn>
>>;

export const hasToolPanelCommandStateOverride = (
  overrides: ToolPanelCommandStateOverrides,
  key: ToolPanelCommandStateKey,
): boolean => Object.hasOwn(overrides, key);

export const readToolPanelCommandInitialState = (initialState: unknown): unknown => (
  typeof initialState === 'function'
    ? (initialState as () => unknown)()
    : initialState
);
