import { useEffect, useRef, useState } from 'react';
import { formatUnknownError } from '../utils/errors';
import type { JsonTreeModel } from '../utils/jsonTreeModel';
import {
  createJsonTreeWorker,
  type JsonTreeWorker,
  type JsonTreeWorkerFactory,
} from '../utils/jsonTreeWorker';

export interface JsonTreeModelState {
  model: JsonTreeModel | null;
  error: string;
  isLoading: boolean;
}

interface UseJsonTreeModelOptions {
  createWorker?: JsonTreeWorkerFactory;
  enabled?: boolean;
}

const EMPTY_MODEL_STATE: JsonTreeModelState = {
  model: null,
  error: '',
  isLoading: false,
};

const getWorkerFailureMessage = (error: unknown, fallback: string): string => {
  const detail = formatUnknownError(error).trim() || fallback;
  return `JSON 结构解析失败: ${detail}`;
};

export const useJsonTreeModel = (
  jsonData: string,
  {
    createWorker = createJsonTreeWorker,
    enabled = true,
  }: UseJsonTreeModelOptions = {},
): JsonTreeModelState => {
  const workerRef = useRef<JsonTreeWorker | null>(null);
  const requestIdRef = useRef(0);
  const [modelState, setModelState] = useState<JsonTreeModelState>(EMPTY_MODEL_STATE);

  useEffect(() => {
    if (!enabled || !jsonData.trim()) {
      workerRef.current?.terminate();
      workerRef.current = null;
      requestIdRef.current += 1;
      setModelState(EMPTY_MODEL_STATE);
      return;
    }

    let disposed = false;
    let settled = false;
    const requestId = ++requestIdRef.current;
    workerRef.current?.terminate();
    workerRef.current = null;
    setModelState({ model: null, error: '', isLoading: true });

    let worker: JsonTreeWorker;
    try {
      worker = createWorker();
      workerRef.current = worker;
    } catch (error) {
      if (!disposed && requestIdRef.current === requestId) {
        setModelState({
          model: null,
          error: getWorkerFailureMessage(error, '后台线程创建失败'),
          isLoading: false,
        });
      }
      return;
    }

    const finishWorker = (): boolean => {
      if (settled) return false;
      settled = true;
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
      return true;
    };

    const failWorker = (error: unknown, fallback: string) => {
      if (!finishWorker()) return;
      if (disposed || requestIdRef.current !== requestId) return;
      setModelState({
        model: null,
        error: getWorkerFailureMessage(error, fallback),
        isLoading: false,
      });
    };

    worker.onmessage = event => {
      if (event.data.id !== requestId) {
        failWorker('后台线程响应标识不匹配', '后台线程响应标识不匹配');
        return;
      }
      if (event.data.error) {
        failWorker(event.data.error, '后台线程解析失败');
        return;
      }
      if (!event.data.model) {
        failWorker('后台线程未返回结构数据', '后台线程未返回结构数据');
        return;
      }
      if (!finishWorker()) return;
      if (disposed || requestIdRef.current !== requestId) return;
      setModelState({
        model: event.data.model,
        error: '',
        isLoading: false,
      });
    };

    worker.onerror = event => {
      failWorker(event.message, '后台线程运行失败');
    };

    try {
      worker.postMessage({ id: requestId, jsonData });
    } catch (error) {
      failWorker(error, '后台线程请求发送失败');
    }

    return () => {
      disposed = true;
      if (requestIdRef.current === requestId) {
        requestIdRef.current += 1;
      }
      finishWorker();
    };
  }, [createWorker, enabled, jsonData]);

  return modelState;
};
