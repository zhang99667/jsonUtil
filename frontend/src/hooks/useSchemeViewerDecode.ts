import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { deepDecodeScheme } from '../utils/schemeUtils';
import {
  buildSchemeViewerDecodeMetadata,
  createEmptySchemeDecodeResult,
  type SchemeViewerDecodeMetadata,
} from '../utils/schemeViewerDecodeMetadata';
import {
  createSchemeDecodeWorker,
  type SchemeDecodeWorker,
  type SchemeDecodeWorkerFactory,
} from '../utils/schemeViewerDecodeWorker';
import type { SchemeDecodeResult } from '../utils/schemeTypes';

const ASYNC_SCHEME_DECODE_THRESHOLD = 50_000;

interface SchemeDecodeWorkerState {
  source: string;
  result: SchemeDecodeResult | null;
  metadata: SchemeViewerDecodeMetadata | null;
  failed: boolean;
}

interface UseSchemeViewerDecodeOptions {
  createWorker?: SchemeDecodeWorkerFactory;
  enabled?: boolean;
}

const EMPTY_WORKER_STATE: SchemeDecodeWorkerState = {
  source: '',
  result: null,
  metadata: null,
  failed: false,
};

const decodeWithMetadata = (source: string): SchemeDecodeWorkerState => {
  try {
    const result = deepDecodeScheme(source);
    return {
      source,
      result,
      metadata: buildSchemeViewerDecodeMetadata(result, {
        includeCommandFieldRows: false,
      }),
      failed: false,
    };
  } catch (error) {
    console.warn('Scheme 同步降级解码失败:', error);
    return {
      source,
      result: createEmptySchemeDecodeResult(source),
      metadata: null,
      failed: true,
    };
  }
};

export const useSchemeViewerDecode = (
  source: string,
  {
    createWorker = createSchemeDecodeWorker,
    enabled = true,
  }: UseSchemeViewerDecodeOptions = {},
) => {
  const deferredSource = useDeferredValue(source);
  const decodeSource = source ? deferredSource : '';
  const [workerState, setWorkerState] = useState<SchemeDecodeWorkerState>(EMPTY_WORKER_STATE);
  const [cancelledSource, setCancelledSource] = useState('');
  const workerRef = useRef<SchemeDecodeWorker | null>(null);
  const requestIdRef = useRef(0);

  const shouldDecodeInWorker = decodeSource.length >= ASYNC_SCHEME_DECODE_THRESHOLD;
  const isDecodeCancelled = Boolean(
    shouldDecodeInWorker && cancelledSource === decodeSource,
  );
  const hasFreshWorkerResult = Boolean(
    shouldDecodeInWorker &&
    !isDecodeCancelled &&
    workerState.source === decodeSource &&
    workerState.result,
  );
  const workerMetadata = hasFreshWorkerResult ? workerState.metadata : null;
  const hasDecodeFailed = Boolean(
    shouldDecodeInWorker &&
    !isDecodeCancelled &&
    workerState.source === decodeSource &&
    workerState.failed,
  );
  const isDecodePending = enabled && (
    Boolean(source && deferredSource !== source) || Boolean(
      shouldDecodeInWorker && !isDecodeCancelled && !hasFreshWorkerResult,
    )
  );
  const canCancelDecode = Boolean(
    enabled &&
    shouldDecodeInWorker &&
    !isDecodeCancelled &&
    workerState.source === decodeSource &&
    !hasFreshWorkerResult,
  );

  const decodeResult = useMemo<SchemeDecodeResult>(() => {
    if (!decodeSource) return createEmptySchemeDecodeResult();
    if (!shouldDecodeInWorker) return deepDecodeScheme(decodeSource);
    if (isDecodeCancelled) return createEmptySchemeDecodeResult(decodeSource);
    return hasFreshWorkerResult && workerState.result
      ? workerState.result
      : createEmptySchemeDecodeResult(decodeSource);
  }, [
    decodeSource,
    hasFreshWorkerResult,
    isDecodeCancelled,
    shouldDecodeInWorker,
    workerState.result,
  ]);
  const decodeMetadata = useMemo(() => (
    workerMetadata ?? buildSchemeViewerDecodeMetadata(decodeResult)
  ), [decodeResult, workerMetadata]);

  useEffect(() => {
    if (cancelledSource && (!enabled || cancelledSource !== decodeSource)) {
      setCancelledSource('');
    }
  }, [cancelledSource, decodeSource, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (!decodeSource || !shouldDecodeInWorker) {
      setWorkerState(current => (
        current.source || current.result || current.metadata ? EMPTY_WORKER_STATE : current
      ));
      return;
    }

    if (isDecodeCancelled) {
      setWorkerState(current => (
        current.source === decodeSource && !current.result && !current.metadata && !current.failed
          ? current
          : { source: decodeSource, result: null, metadata: null, failed: false }
      ));
      return;
    }

    let disposed = false;
    let settled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    workerRef.current?.terminate();
    workerRef.current = null;
    setWorkerState({ source: decodeSource, result: null, metadata: null, failed: false });

    const finishWorker = (worker: SchemeDecodeWorker): boolean => {
      if (settled) return false;
      settled = true;
      if (workerRef.current === worker) {
        workerRef.current = null;
        worker.terminate();
      }
      return true;
    };

    const applyFallback = (
      worker: SchemeDecodeWorker,
      message: string,
      error: unknown,
    ) => {
      if (!finishWorker(worker)) return;
      if (disposed || requestId !== requestIdRef.current) return;
      console.warn(message, error);
      setWorkerState(decodeWithMetadata(decodeSource));
    };

    let worker: SchemeDecodeWorker;
    try {
      worker = createWorker();
      workerRef.current = worker;
    } catch (error) {
      if (!disposed && requestId === requestIdRef.current) {
        console.warn('Scheme 后台解码线程创建失败:', error);
        setWorkerState(decodeWithMetadata(decodeSource));
      }
      return;
    }

    worker.onmessage = event => {
      if (event.data.id !== requestId) {
        applyFallback(worker, 'Scheme 后台解码响应标识不匹配:', event.data.id);
        return;
      }
      if (event.data.error || !event.data.result) {
        applyFallback(worker, 'Scheme 后台解码处理失败:', event.data.error);
        return;
      }
      if (!finishWorker(worker)) return;
      if (disposed || requestId !== requestIdRef.current) return;

      setWorkerState({
        source: decodeSource,
        result: event.data.result,
        metadata: event.data.metadata || buildSchemeViewerDecodeMetadata(event.data.result, {
          includeCommandFieldRows: false,
        }),
        failed: false,
      });
    };

    worker.onerror = event => {
      applyFallback(worker, 'Scheme 后台解码运行失败:', event.message);
    };

    try {
      worker.postMessage({ id: requestId, input: decodeSource });
    } catch (error) {
      applyFallback(worker, 'Scheme 后台解码请求发送失败:', error);
    }

    return () => {
      disposed = true;
      finishWorker(worker);
    };
  }, [createWorker, decodeSource, enabled, isDecodeCancelled, shouldDecodeInWorker]);

  const cancelDecode = useCallback((): boolean => {
    if (!canCancelDecode) return false;

    const worker = workerRef.current;
    workerRef.current = null;
    worker?.terminate();
    requestIdRef.current += 1;
    setCancelledSource(decodeSource);
    setWorkerState({ source: decodeSource, result: null, metadata: null, failed: false });
    return true;
  }, [canCancelDecode, decodeSource]);

  return {
    decodeResult,
    decodeMetadata,
    isDecodePending,
    isDecodeCancelled,
    hasDecodeFailed,
    canCancelDecode,
    cancelDecode,
  };
};
