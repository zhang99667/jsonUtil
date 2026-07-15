import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { scanSchemesInJson, type SchemeLocation } from '../utils/schemeScanner';
import {
  createSchemeScanWorker,
  isSchemeScanWorkerResponse,
  type SchemeScanWorker,
  type SchemeScanWorkerFactory,
} from '../utils/schemeScanWorker';

const ASYNC_SCHEME_SCAN_THRESHOLD = 200_000;
const SCHEME_SCAN_DELAY_MS = 500;
const SCHEME_SCAN_TIMEOUT_MS = 10_000;

interface UseEditorSchemeScanOptions {
  createWorker?: SchemeScanWorkerFactory;
  enabled?: boolean;
}

interface EditorSchemeScanState {
  source: string;
  locations: SchemeLocation[];
  warning: string;
}

const EMPTY_SCHEME_SCAN_STATE: EditorSchemeScanState = {
  source: '',
  locations: [],
  warning: '',
};
const EMPTY_SCHEME_LOCATIONS: SchemeLocation[] = [];
const SCHEME_SCAN_FAILURE_WARNING = 'Scheme 扫描失败，已跳过本次结果';

const buildScanState = (
  source: string,
  locations: SchemeLocation[],
  isLimited = false,
  limit = 0,
): EditorSchemeScanState => ({
  source,
  locations,
  warning: isLimited ? `Scheme 图标已显示前 ${limit} 个，后续结果已跳过` : '',
});

const buildFailureState = (source: string): EditorSchemeScanState => ({
  source,
  locations: [],
  warning: SCHEME_SCAN_FAILURE_WARNING,
});

export const useEditorSchemeScan = (
  value: string,
  {
    createWorker = createSchemeScanWorker,
    enabled = true,
  }: UseEditorSchemeScanOptions = {},
) => {
  const [scanState, setScanState] = useState<EditorSchemeScanState>(EMPTY_SCHEME_SCAN_STATE);
  const requestIdRef = useRef(0);
  const schemeLocationsRef = useRef<SchemeLocation[]>([]);
  const schemeLocationsSourceRef = useRef('');
  const hasFreshResult = Boolean(enabled && value && scanState.source === value);
  const schemeLocations = hasFreshResult ? scanState.locations : EMPTY_SCHEME_LOCATIONS;
  const schemeScanWarning = hasFreshResult ? scanState.warning : '';

  useLayoutEffect(() => {
    schemeLocationsRef.current = schemeLocations;
    schemeLocationsSourceRef.current = hasFreshResult ? value : '';
  }, [hasFreshResult, schemeLocations, value]);

  useEffect(() => {
    if (!enabled || !value) {
      requestIdRef.current += 1;
      setScanState(EMPTY_SCHEME_SCAN_STATE);
      return;
    }

    let disposed = false;
    let settled = false;
    let worker: SchemeScanWorker | null = null;
    let workerTimeout: ReturnType<typeof setTimeout> | undefined;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const finishWorker = (): boolean => {
      if (settled) return false;
      settled = true;
      if (workerTimeout !== undefined) clearTimeout(workerTimeout);
      workerTimeout = undefined;
      if (worker) {
        worker.onmessage = null;
        worker.onerror = null;
        worker.terminate();
        worker = null;
      }
      return true;
    };

    const commitState = (nextState: EditorSchemeScanState) => {
      if (!finishWorker()) return;
      if (disposed || requestIdRef.current !== requestId) return;
      setScanState(nextState);
    };

    const failScan = (message: string, detail: unknown) => {
      if (!finishWorker()) return;
      if (disposed || requestIdRef.current !== requestId) return;
      console.warn(message, detail);
      setScanState(buildFailureState(value));
    };

    const timer = setTimeout(() => {
      if (value.length < ASYNC_SCHEME_SCAN_THRESHOLD) {
        try {
          const result = scanSchemesInJson(value);
          commitState(buildScanState(value, result.locations, result.isLimited, result.limit));
        } catch (error) {
          failScan('Scheme 同步扫描失败:', error);
        }
        return;
      }

      try {
        worker = createWorker();
      } catch (error) {
        failScan('Scheme 扫描 Worker 创建失败:', error);
        return;
      }

      worker.onmessage = event => {
        const response = event.data;
        if (!isSchemeScanWorkerResponse(response)) {
          failScan('Scheme 扫描 Worker 响应格式无效:', '响应格式无效');
          return;
        }
        if (response.id !== requestId) {
          failScan('Scheme 扫描 Worker 响应标识不匹配:', '响应标识不匹配');
          return;
        }
        if (response.error !== undefined) {
          failScan('Scheme 扫描 Worker 处理失败:', response.error);
          return;
        }
        commitState(buildScanState(
          value,
          response.locations,
          response.isLimited,
          response.limit,
        ));
      };
      worker.onerror = event => {
        failScan('Scheme 扫描 Worker 运行失败:', event.message);
      };

      try {
        worker.postMessage({ id: requestId, jsonString: value });
        if (!settled) {
          workerTimeout = setTimeout(() => {
            failScan('Scheme 扫描 Worker 响应超时:', '十秒内未响应');
          }, SCHEME_SCAN_TIMEOUT_MS);
        }
      } catch (error) {
        failScan('Scheme 扫描 Worker 请求发送失败:', error);
      }
    }, SCHEME_SCAN_DELAY_MS);

    return () => {
      disposed = true;
      clearTimeout(timer);
      if (requestIdRef.current === requestId) {
        requestIdRef.current += 1;
      }
      finishWorker();
    };
  }, [createWorker, enabled, value]);

  return {
    schemeLocations,
    schemeScanWarning,
    schemeLocationsRef,
    schemeLocationsSourceRef,
  };
};
