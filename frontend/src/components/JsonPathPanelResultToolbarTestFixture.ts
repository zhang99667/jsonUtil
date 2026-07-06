import { vi } from 'vitest';
import { JsonPathPanelResultToolbar } from './JsonPathPanelResultToolbar';
import {
  JsonPathPanelResultToolbarActionList,
  type JsonPathPanelResultToolbarActionListProps,
} from './JsonPathPanelResultToolbarActionList';

export const buildJsonPathPanelResultToolbarCallbacks = () => ({
  onCopyValues: vi.fn(),
  onCopyPathValues: vi.fn(),
  onPrevious: vi.fn(),
  onNext: vi.fn(),
});

export const buildJsonPathPanelResultToolbarActionListProps = (
  overrides: Partial<JsonPathPanelResultToolbarActionListProps> = {}
): JsonPathPanelResultToolbarActionListProps => ({
  isQuerying: false,
  canCopyValues: true,
  canCopyPathValues: true,
  copyButtonLabel: '复制值',
  copyPathValueButtonLabel: '复制路径和值',
  ...buildJsonPathPanelResultToolbarCallbacks(),
  ...overrides,
});

export const renderJsonPathPanelResultToolbarActionList = (
  overrides: Partial<JsonPathPanelResultToolbarActionListProps> = {}
) => JsonPathPanelResultToolbarActionList(buildJsonPathPanelResultToolbarActionListProps(overrides));

type JsonPathPanelResultToolbarProps = Parameters<typeof JsonPathPanelResultToolbar>[0];

export const buildJsonPathPanelResultToolbarProps = (
  overrides: Partial<JsonPathPanelResultToolbarProps> = {}
): JsonPathPanelResultToolbarProps => ({
  currentResultIndex: 1,
  resultCount: 3,
  isResultLimited: false,
  resultLimit: 500,
  resultStatusId: 'jsonpath-result-status',
  ...buildJsonPathPanelResultToolbarActionListProps(),
  ...overrides,
});

export const renderJsonPathPanelResultToolbar = (
  overrides: Partial<JsonPathPanelResultToolbarProps> = {}
) => JsonPathPanelResultToolbar(buildJsonPathPanelResultToolbarProps(overrides));
