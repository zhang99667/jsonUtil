import type { AppChangelogOpenDetail } from './appEvents';
import type { JsonPathQueryItem } from './jsonPathQuery';
import { getStandaloneDeepFormatInputKind } from './transformations';

interface ToolPanelRequestPlan<TRequest> {
  nextId: number;
  request: TRequest;
}

export interface JsonPathQueryRequest {
  id: number;
  query: string;
}

export interface JsonTreeFocusRequest {
  id: number;
  path: string;
  pointer: string;
}

export interface SchemeInputRequest {
  id: number;
  value: string;
}

export interface TemplateFillRequest {
  id: number;
  template: string;
}

export const getPanelToggleEventName = (
  nextOpen: boolean,
  openEventName: string,
  closeEventName: string
): string => (nextOpen ? openEventName : closeEventName);

export const buildJsonPathQueryRequest = (
  currentId: number,
  query: string
): ToolPanelRequestPlan<JsonPathQueryRequest> | null => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return null;

  const nextId = currentId + 1;
  return {
    nextId,
    request: { id: nextId, query: normalizedQuery },
  };
};

export const buildJsonTreeFocusRequest = (
  currentId: number,
  item: JsonPathQueryItem
): ToolPanelRequestPlan<JsonTreeFocusRequest> => {
  const nextId = currentId + 1;
  return {
    nextId,
    request: {
      id: nextId,
      path: item.path,
      pointer: item.pointer,
    },
  };
};

export const buildSchemeInputRequest = (
  currentId: number,
  value: string
): ToolPanelRequestPlan<SchemeInputRequest> => {
  const nextId = currentId + 1;
  return {
    nextId,
    request: { id: nextId, value },
  };
};

export const getStandaloneSourceSchemeValue = (sourceText: string): string => {
  const value = sourceText.trim();
  return value && getStandaloneDeepFormatInputKind(value) ? value : '';
};

export const buildChangelogOpenState = (detail?: AppChangelogOpenDetail) => ({
  highlightedVersion: detail?.version || null,
  sourceMarkdown: detail?.changelogMarkdown?.trim() ? detail.changelogMarkdown : null,
});

export const buildTemplateFillRequest = (
  currentId: number,
  template: string
): ToolPanelRequestPlan<TemplateFillRequest> | null => {
  if (!template) return null;

  const nextId = currentId + 1;
  return {
    nextId,
    request: { id: nextId, template },
  };
};
