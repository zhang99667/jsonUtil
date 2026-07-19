import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import type { AppAsyncTransformSnapshot } from './appAsyncTransformSnapshot';
import {
  buildAppAsyncTransformFallbackResult,
  buildAppAsyncTransformResult,
  type AppAsyncTransformResult,
} from './appAsyncTransformState';
import { performTransformAsync } from './transformations';

export type AppAsyncTransformTaskCleanup = () => void;

const APP_ASYNC_TRANSFORM_TIMEOUT_MS = 10_000;

export interface AppAsyncTransformPromiseTaskOptions {
  requestId: number;
  snapshot: AppAsyncTransformSnapshot;
  isCurrentRequest: (requestId: number) => boolean;
  onSetAsyncTransformResult: (result: AppAsyncTransformResult) => void;
  onSetOutputTransforming: (isTransforming: boolean) => void;
  onWarn?: (message: string, error: unknown) => void;
}

export const startAppAsyncTransformPromiseTask = ({
  requestId,
  snapshot,
  isCurrentRequest,
  onSetAsyncTransformResult,
  onSetOutputTransforming,
  onWarn = console.warn,
}: AppAsyncTransformPromiseTaskOptions): AppAsyncTransformTaskCleanup => {
  let isCancelled = false;
  let transformTimeout: ReturnType<typeof setTimeout> | undefined;
  const isActiveRequest = () => !isCancelled && isCurrentRequest(requestId);
  const clearTransformTimeout = () => {
    if (transformTimeout !== undefined) clearTimeout(transformTimeout);
    transformTimeout = undefined;
  };
  const timeoutPromise = new Promise<never>((_, reject) => {
    transformTimeout = setTimeout(() => {
      transformTimeout = undefined;
      reject(new Error('十秒内未完成'));
    }, APP_ASYNC_TRANSFORM_TIMEOUT_MS);
  });

  Promise.race([performTransformAsync(snapshot.input, snapshot.mode), timeoutPromise])
    .then(output => {
      clearTransformTimeout();
      if (!isActiveRequest()) return;
      onSetAsyncTransformResult(buildAppAsyncTransformResult({
        snapshot,
        output,
      }));
      onSetOutputTransforming(false);
    })
    .catch(error => {
      clearTransformTimeout();
      if (!isActiveRequest()) return;
      const isRecoveryDispatched = dispatchChunkLoadRecoveryEvent(error);
      if (!isRecoveryDispatched) {
        onWarn('异步转换处理失败:', error);
      }

      onSetAsyncTransformResult(buildAppAsyncTransformFallbackResult(snapshot));
      onSetOutputTransforming(false);
    });

  return () => {
    isCancelled = true;
    clearTransformTimeout();
  };
};
