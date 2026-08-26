import { useCallback, useEffect, useReducer, useRef, type Dispatch } from 'react';
import type { HighlightRange } from '../types';
import { formatUnknownError } from '../utils/errors';
import { buildJsonPathPanelQueryRunDecision } from '../utils/jsonPathPanelQueryRunDecision';
import { trackJsonPathQueryEvent } from '../utils/jsonPathPanelQueryTelemetry';
import {
  buildJsonPathQuerySuccessPayload,
  buildJsonPathWorkerRequest,
  createJsonPathQueryWorker,
  type JsonPathQueryWorker,
} from '../utils/jsonPathPanelQueryWorker';
import {
  initialJsonPathPanelQueryState,
  jsonPathPanelQueryStateReducer,
  type JsonPathPanelQueryAction,
  type JsonPathPanelQueryState,
} from '../utils/jsonPathPanelQueryState';
import { showSuccess } from '../utils/toast';
import { useJsonPathPanelQueryContextSync } from './useJsonPathPanelQueryContextSync';

export interface JsonPathPanelExternalQueryRequest {
  id: number;
  query: string;
  workspaceId?: string | null;
}

interface UseJsonPathPanelQueryRunnerInput {
  query: string;
  jsonData: string;
  deepFormat: boolean;
  autoExpandScheme: boolean;
  isDataPreparing: boolean;
  externalQueryRequest: JsonPathPanelExternalQueryRequest | null;
  workspaceId?: string | null;
  isOpen: boolean;
  queryState?: JsonPathPanelQueryState;
  onQueryStateAction?: Dispatch<JsonPathPanelQueryAction>;
  onSetQuery: (query: string) => void;
  onAddHistoryItem: (query: string) => void;
  onHighlightRange: (range: HighlightRange | null) => void;
  createWorker?: () => JsonPathQueryWorker;
}

export const useJsonPathPanelQueryRunner = ({
  query,
  jsonData,
  deepFormat,
  autoExpandScheme,
  isDataPreparing,
  externalQueryRequest,
  workspaceId = null,
  isOpen,
  queryState: controlledQueryState,
  onQueryStateAction,
  onSetQuery,
  onAddHistoryItem,
  onHighlightRange,
  createWorker = createJsonPathQueryWorker,
}: UseJsonPathPanelQueryRunnerInput) => {
  const [internalQueryState, dispatchInternalQueryState] = useReducer(
    jsonPathPanelQueryStateReducer,
    initialJsonPathPanelQueryState
  );
  const isQueryStateControlled = controlledQueryState !== undefined && onQueryStateAction !== undefined;
  const queryState = controlledQueryState ?? internalQueryState;
  const dispatchQueryState = onQueryStateAction ?? dispatchInternalQueryState;
  const workerRef = useRef<JsonPathQueryWorker | null>(null);
  const requestIdRef = useRef(0);
  const activeQueryRef = useRef('');
  const activeQueryStartedAtRef = useRef<number | null>(null);
  const externalQueryIdRef = useRef<number | null>(null);
  const clearActiveQuery = useCallback(() => {
    activeQueryRef.current = '';
    activeQueryStartedAtRef.current = null;
  }, []);
  const terminateActiveWorker = useCallback(() => {
    const worker = workerRef.current;
    workerRef.current = null;
    worker?.terminate();
  }, []);
  const finishWorkerRequest = useCallback((worker: JsonPathQueryWorker, startedAt: number) => {
    const queryStartedAt = activeQueryStartedAtRef.current ?? startedAt;
    if (workerRef.current === worker) {
      workerRef.current = null;
    }
    activeQueryRef.current = '';
    activeQueryStartedAtRef.current = null;
    worker.terminate();
    return queryStartedAt;
  }, []);
  const trackQueryEvent = useCallback((status: Parameters<typeof trackJsonPathQueryEvent>[0]['status'], startedAt: number) => {
    trackJsonPathQueryEvent({ jsonData, status, startedAt });
  }, [jsonData]);

  useEffect(() => () => {
    terminateActiveWorker();
    clearActiveQuery();
  }, [clearActiveQuery, terminateActiveWorker]);
  const resetRequestContext = useCallback(() => {
    terminateActiveWorker();
    requestIdRef.current++;
    clearActiveQuery();
  }, [clearActiveQuery, terminateActiveWorker]);

  const activeWorkspaceIdRef = useJsonPathPanelQueryContextSync({
    workspaceId,
    jsonData,
    deepFormat,
    autoExpandScheme,
    isOpen,
    queryState,
    isQueryStateControlled,
    onQueryStateAction: dispatchQueryState,
    onHighlightRange,
    onResetRequestContext: resetRequestContext,
  });

  const resetQueryState = useCallback(() => {
    terminateActiveWorker();
    requestIdRef.current++;
    clearActiveQuery();
    dispatchQueryState({ type: 'reset' });
    onHighlightRange(null);
  }, [clearActiveQuery, dispatchQueryState, onHighlightRange, terminateActiveWorker]);

  const handleQuery = useCallback((overrideQuery?: string) => {
    const startedAt = performance.now();
    dispatchQueryState({ type: 'prepare' });
    const queryDecision = buildJsonPathPanelQueryRunDecision({
      queryInput: overrideQuery ?? query,
      jsonData,
      isDataPreparing,
    });
    const queryPath = queryDecision.queryPath;

    if (queryDecision.syncQueryPath) {
      onSetQuery(queryDecision.syncQueryPath);
    }

    if (queryDecision.skip) {
      const { clearHighlight, ...skipAction } = queryDecision.skip;
      dispatchQueryState({ type: 'skipped', ...skipAction });
      if (clearHighlight) onHighlightRange(null);
      trackQueryEvent('skipped', startedAt);
      return;
    }

    const failQuery = (error: unknown, queryStartedAt: number) => {
      dispatchQueryState({
        type: 'failed',
        error: `JSONPath 查询错误: ${formatUnknownError(error)}`,
      });
      onHighlightRange(null);
      trackQueryEvent('error', queryStartedAt);
    };

    terminateActiveWorker();
    const requestId = ++requestIdRef.current;
    let worker: JsonPathQueryWorker;
    try {
      worker = createWorker();
    } catch (error) {
      clearActiveQuery();
      failQuery(error, startedAt);
      return;
    }
    workerRef.current = worker;
    activeQueryRef.current = queryPath;
    activeQueryStartedAtRef.current = startedAt;
    dispatchQueryState({ type: 'start' });
    onHighlightRange(null);

    const ownsWorkerRequest = () => (
      workerRef.current === worker
      && requestIdRef.current === requestId
      && activeWorkspaceIdRef.current === workspaceId
    );

    worker.onmessage = (event) => {
      if (!ownsWorkerRequest()) return;
      if (event.data.id !== requestId) {
        const queryStartedAt = finishWorkerRequest(worker, startedAt);
        failQuery('Worker 响应标识不匹配', queryStartedAt);
        return;
      }
      const queryStartedAt = finishWorkerRequest(worker, startedAt);

      if (event.data.error) {
        dispatchQueryState({ type: 'failed', error: event.data.error });
        onHighlightRange(null);
        trackQueryEvent('error', queryStartedAt);
        return;
      }

      if (event.data.totalResults === 0) {
        dispatchQueryState({ type: 'empty', query: queryPath });
        onHighlightRange(null);
        trackQueryEvent('success', queryStartedAt);
        return;
      }

      dispatchQueryState({
        type: 'success',
        payload: buildJsonPathQuerySuccessPayload(event.data),
      });
      onHighlightRange(event.data.ranges[0] || null);
      onAddHistoryItem(queryPath);
      trackQueryEvent('success', queryStartedAt);
    };

    worker.onerror = (event) => {
      if (!ownsWorkerRequest()) return;
      const queryStartedAt = finishWorkerRequest(worker, startedAt);
      failQuery(event.message, queryStartedAt);
    };

    try {
      worker.postMessage(buildJsonPathWorkerRequest({
        id: requestId,
        jsonData,
        queryPath,
        deepFormat,
        autoExpandScheme,
      }));
    } catch (error) {
      if (!ownsWorkerRequest()) return;
      const queryStartedAt = finishWorkerRequest(worker, startedAt);
      failQuery(error, queryStartedAt);
    }
  }, [
    autoExpandScheme,
    clearActiveQuery,
    createWorker,
    deepFormat,
    dispatchQueryState,
    finishWorkerRequest,
    isDataPreparing,
    jsonData,
    onAddHistoryItem,
    onHighlightRange,
    onSetQuery,
    query,
    terminateActiveWorker,
    trackQueryEvent,
    workspaceId,
  ]);

  const handleCancelQuery = useCallback(() => {
    if (!queryState.isQuerying || !workerRef.current) return;

    const cancelledQueryPath = activeQueryRef.current || query.trim();
    const queryStartedAt = activeQueryStartedAtRef.current ?? performance.now();
    terminateActiveWorker();
    requestIdRef.current++;
    clearActiveQuery();
    dispatchQueryState({ type: 'cancelled', query: cancelledQueryPath });
    onHighlightRange(null);
    trackQueryEvent('cancelled', queryStartedAt);
    showSuccess('已取消查询', 1600);
  }, [
    clearActiveQuery,
    dispatchQueryState,
    onHighlightRange,
    query,
    queryState.isQuerying,
    terminateActiveWorker,
    trackQueryEvent,
  ]);

  useEffect(() => {
    if (!externalQueryRequest || !isOpen || isDataPreparing) return;
    if (
      externalQueryRequest.workspaceId !== undefined
      && externalQueryRequest.workspaceId !== workspaceId
    ) return;
    if (externalQueryIdRef.current === externalQueryRequest.id) return;

    externalQueryIdRef.current = externalQueryRequest.id;
    onSetQuery(externalQueryRequest.query);
    handleQuery(externalQueryRequest.query);
  }, [externalQueryRequest, handleQuery, isDataPreparing, isOpen, onSetQuery, workspaceId]);

  const clearCancelledQuery = useCallback(() => {
    dispatchQueryState({ type: 'clearCancelled' });
  }, [dispatchQueryState]);

  const focusResult = useCallback((index: number) => {
    dispatchQueryState({ type: 'focus', index });
    onHighlightRange(queryState.queryRanges[index] || null);
  }, [dispatchQueryState, onHighlightRange, queryState.queryRanges]);

  return {
    queryState,
    clearCancelledQuery,
    focusResult,
    handleCancelQuery,
    handleQuery,
    resetQueryState,
  };
};
