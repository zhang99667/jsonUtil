import { useEffect, useRef, type Dispatch } from 'react';
import type { HighlightRange } from '../types';
import type {
  JsonPathPanelQueryAction,
  JsonPathPanelQueryState,
} from '../utils/jsonPathPanelQueryState';

interface UseJsonPathPanelQueryContextSyncInput {
  workspaceId: string | null;
  jsonData: string;
  deepFormat: boolean;
  autoExpandScheme: boolean;
  isOpen: boolean;
  queryState: JsonPathPanelQueryState;
  isQueryStateControlled: boolean;
  onQueryStateAction: Dispatch<JsonPathPanelQueryAction>;
  onHighlightRange: (range: HighlightRange | null) => void;
  onResetRequestContext: () => void;
}

export const useJsonPathPanelQueryContextSync = ({
  workspaceId,
  jsonData,
  deepFormat,
  autoExpandScheme,
  isOpen,
  queryState,
  isQueryStateControlled,
  onQueryStateAction,
  onHighlightRange,
  onResetRequestContext,
}: UseJsonPathPanelQueryContextSyncInput) => {
  const activeWorkspaceIdRef = useRef<string | null>(workspaceId);
  const queryStateRef = useRef(queryState);
  activeWorkspaceIdRef.current = workspaceId;
  queryStateRef.current = queryState;

  useEffect(() => {
    onResetRequestContext();

    if (!isQueryStateControlled) {
      onQueryStateAction({ type: 'reset' });
      onHighlightRange(null);
      return;
    }

    const currentQueryState = queryStateRef.current;
    if (currentQueryState.isQuerying) {
      onQueryStateAction({ type: 'reset' });
      onHighlightRange(null);
      return;
    }
    onHighlightRange(isOpen
      ? currentQueryState.queryRanges[currentQueryState.currentResultIndex] || null
      : null);
  }, [
    autoExpandScheme,
    deepFormat,
    isOpen,
    isQueryStateControlled,
    jsonData,
    onHighlightRange,
    onQueryStateAction,
    onResetRequestContext,
    workspaceId,
  ]);

  return activeWorkspaceIdRef;
};
