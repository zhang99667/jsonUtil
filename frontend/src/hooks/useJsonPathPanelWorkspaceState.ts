import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JsonPathPanelQueryAction } from '../utils/jsonPathPanelQueryState';
import {
  createJsonPathPanelWorkspaceState,
  getJsonPathPanelWorkspaceState,
  reconcileJsonPathPanelWorkspaceStates,
  reduceJsonPathPanelWorkspaceQueryState,
  setJsonPathPanelWorkspaceQuery,
  type JsonPathPanelWorkspaceId,
  type JsonPathPanelWorkspaceStateMap,
} from '../utils/jsonPathPanelWorkspaceState';

interface UseJsonPathPanelWorkspaceStateInput {
  workspaceId: JsonPathPanelWorkspaceId;
  retainedWorkspaceIds: readonly string[];
  jsonData: string;
  deepFormat: boolean;
  autoExpandScheme: boolean;
  isOpen: boolean;
}

export const useJsonPathPanelWorkspaceState = ({
  workspaceId,
  retainedWorkspaceIds,
  jsonData,
  deepFormat,
  autoExpandScheme,
  isOpen,
}: UseJsonPathPanelWorkspaceStateInput) => {
  const activeContext = useMemo(() => ({
    jsonData,
    deepFormat,
    autoExpandScheme,
    isOpen,
  }), [autoExpandScheme, deepFormat, isOpen, jsonData]);
  const [workspaceStates, setWorkspaceStates] = useState<JsonPathPanelWorkspaceStateMap>(() => (
    new Map([[workspaceId, createJsonPathPanelWorkspaceState(activeContext)]])
  ));
  const workspaceState = useMemo(
    () => getJsonPathPanelWorkspaceState(workspaceStates, workspaceId, activeContext),
    [activeContext, workspaceId, workspaceStates],
  );

  useEffect(() => {
    setWorkspaceStates(current => reconcileJsonPathPanelWorkspaceStates({
      states: current,
      activeWorkspaceId: workspaceId,
      retainedWorkspaceIds,
      activeContext,
    }));
  }, [activeContext, retainedWorkspaceIds, workspaceId]);

  const setQuery = useCallback((query: string) => {
    setWorkspaceStates(current => setJsonPathPanelWorkspaceQuery(
      current,
      workspaceId,
      activeContext,
      query,
    ));
  }, [activeContext, workspaceId]);

  const dispatchQueryState = useCallback((action: JsonPathPanelQueryAction) => {
    setWorkspaceStates(current => reduceJsonPathPanelWorkspaceQueryState(
      current,
      workspaceId,
      activeContext,
      action,
    ));
  }, [activeContext, workspaceId]);

  return {
    query: workspaceState.query,
    queryState: workspaceState.queryState,
    setQuery,
    dispatchQueryState,
  };
};
