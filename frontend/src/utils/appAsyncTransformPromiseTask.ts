import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import type { AppAsyncTransformSnapshot } from './appAsyncTransformSnapshot';
import {
  buildAppAsyncTransformFallbackResult,
  buildAppAsyncTransformResult,
  type AppAsyncTransformResult,
} from './appAsyncTransformState';
import { performTransformAsync } from './transformations';

export type AppAsyncTransformTaskCleanup = () => void;

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
  const isActiveRequest = () => !isCancelled && isCurrentRequest(requestId);

  performTransformAsync(snapshot.input, snapshot.mode)
    .then(output => {
      if (!isActiveRequest()) return;
      onSetAsyncTransformResult(buildAppAsyncTransformResult({
        snapshot,
        output,
      }));
      onSetOutputTransforming(false);
    })
    .catch(error => {
      if (!isActiveRequest()) return;
      if (dispatchChunkLoadRecoveryEvent(error)) {
        onSetOutputTransforming(false);
        return;
      }

      onWarn('异步转换处理失败:', error);
      onSetAsyncTransformResult(buildAppAsyncTransformFallbackResult(snapshot));
      onSetOutputTransforming(false);
    });

  return () => {
    isCancelled = true;
  };
};
