import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { HighlightRange } from '../types';
import { buildJsonPathPanelQueryRunDecision } from '../utils/jsonPathPanelQueryRunDecision';
import { trackJsonPathQueryEvent } from '../utils/jsonPathPanelQueryTelemetry';
import {
  buildJsonPathQuerySuccessPayload,
  buildJsonPathWorkerRequest,
  createJsonPathQueryWorker,
  isStaleJsonPathWorkerMessage,
  type JsonPathQueryWorker,
} from '../utils/jsonPathPanelQueryWorker';
import {
  initialJsonPathPanelQueryState,
  jsonPathPanelQueryStateReducer,
} from '../utils/jsonPathPanelQueryState';
import { showSuccess } from '../utils/toast';

export interface JsonPathPanelExternalQueryRequest {
  id: number;
  query: string;
}

interface UseJsonPathPanelQueryRunnerInput {
  query: string;
  jsonData: string;
  deepFormat: boolean;
  autoExpandScheme: boolean;
  isDataPreparing: boolean;
  externalQueryRequest: JsonPathPanelExternalQueryRequest | null;
  isOpen: boolean;
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
  isOpen,
  onSetQuery,
  onAddHistoryItem,
  onHighlightRange,
  createWorker = createJsonPathQueryWorker,
}: UseJsonPathPanelQueryRunnerInput) => {
  const [queryState, dispatchQueryState] = useReducer(
    jsonPathPanelQueryStateReducer,
    initialJsonPathPanelQueryState
  );
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
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const finishWorkerRequest = useCallback((worker: JsonPathQueryWorker, startedAt: number) => {
    worker.terminate();
    if (workerRef.current === worker) {
      workerRef.current = null;
    }
    activeQueryRef.current = '';
    const queryStartedAt = activeQueryStartedAtRef.current ?? startedAt;
    activeQueryStartedAtRef.current = null;
    return queryStartedAt;
  }, []);

  const trackQueryEvent = useCallback((status: Parameters<typeof trackJsonPathQueryEvent>[0]['status'], startedAt: number) => {
    trackJsonPathQueryEvent({ jsonData, status, startedAt });
  }, [jsonData]);

  useEffect(() => () => {
    terminateActiveWorker();
    clearActiveQuery();
  }, [clearActiveQuery, terminateActiveWorker]);

  const resetQueryState = useCallback(() => {
    terminateActiveWorker();
    requestIdRef.current++;
    clearActiveQuery();
    dispatchQueryState({ type: 'reset' });
    onHighlightRange(null);
  }, [clearActiveQuery, onHighlightRange, terminateActiveWorker]);

  useEffect(() => {
    resetQueryState();
  }, [jsonData, deepFormat, autoExpandScheme, isOpen, resetQueryState]);

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

    terminateActiveWorker();
    const requestId = ++requestIdRef.current;
    const worker = createWorker();
    workerRef.current = worker;
    activeQueryRef.current = queryPath;
    activeQueryStartedAtRef.current = startedAt;
    dispatchQueryState({ type: 'start' });
    onHighlightRange(null);

    worker.onmessage = (event) => {
      if (isStaleJsonPathWorkerMessage(event.data.id, requestId, requestIdRef.current)) return;
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
      if (requestIdRef.current !== requestId) return;
      const queryStartedAt = finishWorkerRequest(worker, startedAt);
      dispatchQueryState({ type: 'failed', error: `JSONPath 查询错误: ${event.message}` });
      onHighlightRange(null);
      trackQueryEvent('error', queryStartedAt);
    };

    worker.postMessage(buildJsonPathWorkerRequest({
      id: requestId,
      jsonData,
      queryPath,
      deepFormat,
      autoExpandScheme,
    }));
  }, [
    autoExpandScheme,
    createWorker,
    deepFormat,
    finishWorkerRequest,
    isDataPreparing,
    jsonData,
    onAddHistoryItem,
    onHighlightRange,
    onSetQuery,
    query,
    terminateActiveWorker,
    trackQueryEvent,
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
    onHighlightRange,
    query,
    queryState.isQuerying,
    terminateActiveWorker,
    trackQueryEvent,
  ]);

  useEffect(() => {
    if (!externalQueryRequest || !isOpen || isDataPreparing) return;
    if (externalQueryIdRef.current === externalQueryRequest.id) return;

    externalQueryIdRef.current = externalQueryRequest.id;
    onSetQuery(externalQueryRequest.query);
    handleQuery(externalQueryRequest.query);
  }, [externalQueryRequest, handleQuery, isDataPreparing, isOpen, onSetQuery]);

  const clearCancelledQuery = useCallback(() => {
    dispatchQueryState({ type: 'clearCancelled' });
  }, []);

  const focusResult = useCallback((index: number) => {
    dispatchQueryState({ type: 'focus', index });
    onHighlightRange(queryState.queryRanges[index] || null);
  }, [onHighlightRange, queryState.queryRanges]);

  return {
    queryState,
    clearCancelledQuery,
    focusResult,
    handleCancelQuery,
    handleQuery,
    resetQueryState,
  };
};
