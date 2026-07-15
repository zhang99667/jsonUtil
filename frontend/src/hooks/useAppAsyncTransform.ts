import { useEffect, useMemo, useRef, useState } from 'react';
import { TransformMode } from '../types';
import { buildAppAsyncTransformPolicy } from '../utils/appAsyncPolicy';
import { buildAppAsyncTransformSnapshot } from '../utils/appAsyncTransformSnapshot';
import { startAppAsyncTransformPromiseTask } from '../utils/appAsyncTransformPromiseTask';
import {
  buildAppAsyncTransformWorkerRequest,
  isAppAsyncTransformWorkerResponse,
} from '../utils/appAsyncTransformWorkerMessages';
import {
  buildAppAsyncTransformFallbackResult,
  buildAppAsyncTransformResult,
  getFreshAppAsyncTransformResult,
  type AppAsyncTransformResult,
} from '../utils/appAsyncTransformState';

interface UseAppAsyncTransformOptions {
  input: string;
  mode: TransformMode;
  autoExpandScheme: boolean;
  isUpdatingFromOutput: boolean;
}

const APP_ASYNC_TRANSFORM_TIMEOUT_MS = 10_000;

export const useAppAsyncTransform = ({
  input,
  mode,
  autoExpandScheme,
  isUpdatingFromOutput,
}: UseAppAsyncTransformOptions) => {
  const [asyncTransformResult, setAsyncTransformResult] = useState<AppAsyncTransformResult | null>(null);
  const [isOutputTransforming, setIsOutputTransforming] = useState(false);
  const transformRequestIdRef = useRef(0);
  const asyncTransformPolicy = buildAppAsyncTransformPolicy({
    input,
    mode,
    isUpdatingFromOutput,
  });
  const shouldUseTransformWorker = asyncTransformPolicy.shouldUseTransformWorker;
  const shouldUseAsyncTransform = asyncTransformPolicy.shouldUseAsyncTransform;
  const transformSnapshot = useMemo(
    () => buildAppAsyncTransformSnapshot(input, mode, autoExpandScheme),
    [input, mode, autoExpandScheme],
  );

  useEffect(() => {
    if (!shouldUseAsyncTransform) {
      setIsOutputTransforming(false);
      setAsyncTransformResult(null);
      return;
    }

    const requestId = ++transformRequestIdRef.current;
    setIsOutputTransforming(true);
    setAsyncTransformResult(null);

    if (!shouldUseTransformWorker) {
      return startAppAsyncTransformPromiseTask({
        requestId,
        snapshot: transformSnapshot,
        isCurrentRequest: currentRequestId => transformRequestIdRef.current === currentRequestId,
        onSetAsyncTransformResult: setAsyncTransformResult,
        onSetOutputTransforming: setIsOutputTransforming,
      });
    }

    let disposed = false;
    let settled = false;
    let workerTimeout: ReturnType<typeof setTimeout> | undefined;
    const finishWorker = (worker: Worker): boolean => {
      if (settled) return false;
      settled = true;
      if (workerTimeout !== undefined) clearTimeout(workerTimeout);
      workerTimeout = undefined;
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
      return true;
    };
    const applyFallback = (worker: Worker | null, message: string, error: unknown) => {
      if (worker && !finishWorker(worker)) return;
      if (disposed || transformRequestIdRef.current !== requestId) return;

      console.warn(message, error);
      setAsyncTransformResult(buildAppAsyncTransformFallbackResult(transformSnapshot));
      setIsOutputTransforming(false);
    };

    let worker: Worker;
    try {
      worker = new Worker(new URL('../workers/transform.worker.ts', import.meta.url), { type: 'module' });
    } catch (error) {
      applyFallback(null, '大文件转换 Worker 创建失败:', error);
      return;
    }

    worker.onmessage = (event: MessageEvent<unknown>) => {
      const response = event.data;
      if (!isAppAsyncTransformWorkerResponse(response, transformSnapshot.mode)) {
        applyFallback(worker, '大文件转换 Worker 响应格式无效:', '响应格式无效');
        return;
      }
      if (response.id !== requestId) {
        applyFallback(worker, '大文件转换 Worker 响应标识不匹配:', '响应标识不匹配');
        return;
      }
      if (response.error !== undefined) {
        applyFallback(worker, '大文件转换 Worker 处理失败:', response.error);
        return;
      }
      if (!finishWorker(worker)) return;
      if (disposed || transformRequestIdRef.current !== requestId) return;

      setAsyncTransformResult(buildAppAsyncTransformResult({
        snapshot: transformSnapshot,
        output: response.output,
        context: response.context,
      }));
      setIsOutputTransforming(false);
    };

    worker.onerror = (event) => {
      applyFallback(worker, '大文件转换 Worker 运行失败:', event.message);
    };

    try {
      worker.postMessage(buildAppAsyncTransformWorkerRequest(requestId, transformSnapshot));
      if (!settled) {
        workerTimeout = setTimeout(() => {
          applyFallback(worker, '大文件转换 Worker 响应超时:', '十秒内未响应');
        }, APP_ASYNC_TRANSFORM_TIMEOUT_MS);
      }
    } catch (error) {
      applyFallback(worker, '大文件转换 Worker 请求发送失败:', error);
    }

    return () => {
      disposed = true;
      finishWorker(worker);
    };
  }, [transformSnapshot, shouldUseAsyncTransform, shouldUseTransformWorker]);

  const currentAsyncTransformResult = useMemo(() => (
    getFreshAppAsyncTransformResult(asyncTransformResult, transformSnapshot)
  ), [asyncTransformResult, transformSnapshot]);
  const isCurrentOutputTransforming = shouldUseAsyncTransform
    && (isOutputTransforming || currentAsyncTransformResult === null);

  return {
    asyncTransformPolicy,
    currentAsyncTransformResult,
    isOutputTransforming: isCurrentOutputTransforming,
    shouldUseAsyncTransform,
  };
};
