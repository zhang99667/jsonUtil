import { useEffect, useMemo, useRef, useState } from 'react';
import {
  TransformMode,
  type TransformContext,
} from '../types';
import {
  buildAppAsyncTransformPolicy,
} from '../utils/appAsyncPolicy';
import { dispatchChunkLoadRecoveryEvent } from '../utils/chunkLoadRecoveryDispatch';
import {
  getFreshAppAsyncTransformResult,
  type AppAsyncTransformResult,
} from '../utils/appAsyncTransformState';
import {
  performTransformAsync,
} from '../utils/transformations';

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
      performTransformAsync(input, mode)
        .then(output => {
          if (isCancelled || transformRequestIdRef.current !== requestId) return;
          setAsyncTransformResult({
            input,
            mode,
            autoExpandScheme,
            output,
          });
          setIsOutputTransforming(false);
        })
        .catch(error => {
          if (isCancelled || transformRequestIdRef.current !== requestId) return;
          if (dispatchChunkLoadRecoveryEvent(error)) {
            setIsOutputTransforming(false);
            return;
          }

          console.warn('异步转换处理失败:', error);
          setAsyncTransformResult({
            input,
            mode,
            autoExpandScheme,
            output: input,
          });
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

      setAsyncTransformResult({
        input,
        mode,
        autoExpandScheme,
        output: event.data.output,
        context: event.data.context,
      });
      setIsOutputTransforming(false);
    };

    worker.onerror = (event) => {
      if (transformRequestIdRef.current !== requestId) return;
      console.warn('大文件转换 Worker 运行失败:', event.message);
      setAsyncTransformResult({
        input,
        mode,
        autoExpandScheme,
        output: input,
      });
      setIsOutputTransforming(false);
    };

    worker.postMessage({
      id: requestId,
      input,
      mode,
      options: { autoExpandScheme },
    });

    return () => {
      worker.terminate();
    };
  }, [input, mode, autoExpandScheme, shouldUseAsyncTransform, shouldUseTransformWorker]);

  const currentAsyncTransformResult = useMemo(() => (
    getFreshAppAsyncTransformResult(asyncTransformResult, input, mode, autoExpandScheme)
  ), [asyncTransformResult, input, mode, autoExpandScheme]);

  return {
    asyncTransformPolicy,
    currentAsyncTransformResult,
    isOutputTransforming,
    shouldUseAsyncTransform,
  };
};
