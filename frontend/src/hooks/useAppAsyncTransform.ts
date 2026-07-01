import { useEffect, useMemo, useRef, useState } from 'react';
import { TransformMode, type TransformContext } from '../types';
import { buildAppAsyncTransformPolicy } from '../utils/appAsyncPolicy';
import { dispatchChunkLoadRecoveryEvent } from '../utils/chunkLoadRecoveryDispatch';
import { buildAppAsyncTransformSnapshot } from '../utils/appAsyncTransformSnapshot';
import {
  buildAppAsyncTransformFallbackResult,
  buildAppAsyncTransformResult,
  getFreshAppAsyncTransformResult,
  type AppAsyncTransformResult,
} from '../utils/appAsyncTransformState';
import { performTransformAsync } from '../utils/transformations';

interface UseAppAsyncTransformOptions {
  input: string;
  mode: TransformMode;
  autoExpandScheme: boolean;
  isUpdatingFromOutput: boolean;
}

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
      let isCancelled = false;
      performTransformAsync(transformSnapshot.input, transformSnapshot.mode)
        .then(output => {
          if (isCancelled || transformRequestIdRef.current !== requestId) return;
          setAsyncTransformResult(buildAppAsyncTransformResult({
            snapshot: transformSnapshot,
            output,
          }));
          setIsOutputTransforming(false);
        })
        .catch(error => {
          if (isCancelled || transformRequestIdRef.current !== requestId) return;
          if (dispatchChunkLoadRecoveryEvent(error)) {
            setIsOutputTransforming(false);
            return;
          }

          console.warn('异步转换处理失败:', error);
          setAsyncTransformResult(buildAppAsyncTransformFallbackResult(transformSnapshot));
          setIsOutputTransforming(false);
        });

      return () => {
        isCancelled = true;
      };
    }

    const worker = new Worker(new URL('../workers/transform.worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (event: MessageEvent<{
      id: number;
      output: string;
      context?: TransformContext;
      error?: string;
    }>) => {
      if (event.data.id !== requestId || transformRequestIdRef.current !== requestId) return;
      if (event.data.error) {
        console.warn('大文件转换 Worker 处理失败:', event.data.error);
      }

      setAsyncTransformResult(buildAppAsyncTransformResult({
        snapshot: transformSnapshot,
        output: event.data.output,
        context: event.data.context,
      }));
      setIsOutputTransforming(false);
    };

    worker.onerror = (event) => {
      if (transformRequestIdRef.current !== requestId) return;
      console.warn('大文件转换 Worker 运行失败:', event.message);
      setAsyncTransformResult(buildAppAsyncTransformFallbackResult(transformSnapshot));
      setIsOutputTransforming(false);
    };

    worker.postMessage({
      id: requestId,
      input: transformSnapshot.input,
      mode: transformSnapshot.mode,
      options: { autoExpandScheme: transformSnapshot.autoExpandScheme },
    });

    return () => {
      worker.terminate();
    };
  }, [transformSnapshot, shouldUseAsyncTransform, shouldUseTransformWorker]);

  const currentAsyncTransformResult = useMemo(() => (
    getFreshAppAsyncTransformResult(asyncTransformResult, transformSnapshot)
  ), [asyncTransformResult, transformSnapshot]);

  return {
    asyncTransformPolicy,
    currentAsyncTransformResult,
    isOutputTransforming,
    shouldUseAsyncTransform,
  };
};
