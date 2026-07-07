import { AiRepairErrorCode, createAiRepairError } from '../utils/aiRepairErrors';

export const AI_REPAIR_TIMEOUT_MS = 30_000;
export const AI_REPAIR_TIMEOUT_MESSAGE = 'AI 修复超时，请稍后重试或检查网络/模型配置';

interface AiRepairProviderRequestRuntimeOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

interface LinkedAbortController {
  signal: AbortSignal;
  abort: () => void;
  dispose: () => void;
}

export const runAiRepairProviderRequest = async <T>(
  options: AiRepairProviderRequestRuntimeOptions,
  run: (signal: AbortSignal) => Promise<T>
): Promise<T> => {
  const linkedAbortController = createLinkedAbortController(options.signal);
  try {
    return await withAiRepairTimeout(
      run(linkedAbortController.signal),
      options.timeoutMs ?? AI_REPAIR_TIMEOUT_MS,
      linkedAbortController.abort
    );
  } finally {
    linkedAbortController.dispose();
  }
};

const createLinkedAbortController = (signal?: AbortSignal): LinkedAbortController => {
  const abortController = new AbortController();
  let abortFromParent: (() => void) | null = null;

  if (signal?.aborted) {
    abortController.abort();
  } else if (signal) {
    abortFromParent = () => abortController.abort();
    signal.addEventListener('abort', abortFromParent, { once: true });
  }

  return {
    signal: abortController.signal,
    abort: () => abortController.abort(),
    dispose: () => {
      if (signal && abortFromParent) signal.removeEventListener('abort', abortFromParent);
      abortFromParent = null;
    },
  };
};

const withAiRepairTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => void
): Promise<T> => {
  if (timeoutMs <= 0) return promise;

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => {
      settled = true;
      onTimeout();
      reject(createAiRepairError(AiRepairErrorCode.Timeout, AI_REPAIR_TIMEOUT_MESSAGE));
    }, timeoutMs);

    promise.then(
      value => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      error => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        reject(error);
      }
    );
  });
};
