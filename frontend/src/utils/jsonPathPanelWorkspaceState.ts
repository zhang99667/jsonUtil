import {
  initialJsonPathPanelQueryState,
  jsonPathPanelQueryStateReducer,
  type JsonPathPanelQueryAction,
  type JsonPathPanelQueryState,
} from './jsonPathPanelQueryState';

export type JsonPathPanelWorkspaceId = string | null;

export interface JsonPathPanelWorkspaceContext {
  jsonData: string;
  deepFormat: boolean;
  autoExpandScheme: boolean;
  isOpen: boolean;
}

export interface JsonPathPanelWorkspaceState {
  query: string;
  queryState: JsonPathPanelQueryState;
  context: JsonPathPanelWorkspaceContext;
}

export type JsonPathPanelWorkspaceStateMap = ReadonlyMap<
  JsonPathPanelWorkspaceId,
  JsonPathPanelWorkspaceState
>;

const DEFAULT_JSON_PATH_QUERY = '$';

const createInitialQueryState = (): JsonPathPanelQueryState => ({
  ...initialJsonPathPanelQueryState,
  queryRanges: [],
  queryValues: [],
  queryItems: [],
});

const areWorkspaceContextsEqual = (
  first: JsonPathPanelWorkspaceContext,
  second: JsonPathPanelWorkspaceContext,
): boolean => (
  first.jsonData === second.jsonData
  && first.deepFormat === second.deepFormat
  && first.autoExpandScheme === second.autoExpandScheme
  && first.isOpen === second.isOpen
);

const normalizeRestoredQueryState = (
  queryState: JsonPathPanelQueryState,
): JsonPathPanelQueryState => (
  queryState.isQuerying ? createInitialQueryState() : queryState
);

export const createJsonPathPanelWorkspaceState = (
  context: JsonPathPanelWorkspaceContext,
  query = DEFAULT_JSON_PATH_QUERY,
): JsonPathPanelWorkspaceState => ({
  query,
  queryState: createInitialQueryState(),
  context,
});

export const getJsonPathPanelWorkspaceState = (
  states: JsonPathPanelWorkspaceStateMap,
  workspaceId: JsonPathPanelWorkspaceId,
  context: JsonPathPanelWorkspaceContext,
): JsonPathPanelWorkspaceState => {
  const storedState = states.get(workspaceId);
  if (!storedState) return createJsonPathPanelWorkspaceState(context);

  if (!areWorkspaceContextsEqual(storedState.context, context)) {
    return createJsonPathPanelWorkspaceState(context, storedState.query);
  }

  return storedState;
};

const setWorkspaceState = (
  states: JsonPathPanelWorkspaceStateMap,
  workspaceId: JsonPathPanelWorkspaceId,
  workspaceState: JsonPathPanelWorkspaceState,
): JsonPathPanelWorkspaceStateMap => {
  if (states.get(workspaceId) === workspaceState) return states;

  const nextStates = new Map(states);
  nextStates.set(workspaceId, workspaceState);
  return nextStates;
};

export const setJsonPathPanelWorkspaceQuery = (
  states: JsonPathPanelWorkspaceStateMap,
  workspaceId: JsonPathPanelWorkspaceId,
  context: JsonPathPanelWorkspaceContext,
  query: string,
): JsonPathPanelWorkspaceStateMap => {
  const workspaceState = getJsonPathPanelWorkspaceState(states, workspaceId, context);
  if (workspaceState.query === query) return states;

  return setWorkspaceState(states, workspaceId, { ...workspaceState, query });
};

export const reduceJsonPathPanelWorkspaceQueryState = (
  states: JsonPathPanelWorkspaceStateMap,
  workspaceId: JsonPathPanelWorkspaceId,
  context: JsonPathPanelWorkspaceContext,
  action: JsonPathPanelQueryAction,
): JsonPathPanelWorkspaceStateMap => {
  const workspaceState = getJsonPathPanelWorkspaceState(states, workspaceId, context);
  const queryState = jsonPathPanelQueryStateReducer(workspaceState.queryState, action);
  if (queryState === workspaceState.queryState) return states;

  return setWorkspaceState(states, workspaceId, { ...workspaceState, queryState });
};

interface ReconcileJsonPathPanelWorkspaceStatesInput {
  states: JsonPathPanelWorkspaceStateMap;
  activeWorkspaceId: JsonPathPanelWorkspaceId;
  retainedWorkspaceIds: readonly string[];
  activeContext: JsonPathPanelWorkspaceContext;
}

export const reconcileJsonPathPanelWorkspaceStates = ({
  states,
  activeWorkspaceId,
  retainedWorkspaceIds,
  activeContext,
}: ReconcileJsonPathPanelWorkspaceStatesInput): JsonPathPanelWorkspaceStateMap => {
  const retainedIds = new Set<JsonPathPanelWorkspaceId>([
    null,
    activeWorkspaceId,
    ...retainedWorkspaceIds,
  ]);
  let nextStates: JsonPathPanelWorkspaceStateMap = states;

  for (const [workspaceId, workspaceState] of states) {
    if (!retainedIds.has(workspaceId)) {
      if (nextStates === states) nextStates = new Map(states);
      (nextStates as Map<JsonPathPanelWorkspaceId, JsonPathPanelWorkspaceState>).delete(workspaceId);
      continue;
    }

    const normalizedQueryState = workspaceId === activeWorkspaceId
      ? workspaceState.queryState
      : normalizeRestoredQueryState(workspaceState.queryState);
    if (normalizedQueryState !== workspaceState.queryState) {
      nextStates = setWorkspaceState(nextStates, workspaceId, {
        ...workspaceState,
        queryState: normalizedQueryState,
      });
    }
  }

  const activeWorkspaceState = getJsonPathPanelWorkspaceState(
    nextStates,
    activeWorkspaceId,
    activeContext,
  );
  return setWorkspaceState(nextStates, activeWorkspaceId, activeWorkspaceState);
};
