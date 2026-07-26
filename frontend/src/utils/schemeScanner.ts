import { parse as parseJsonSourceMap } from 'json-source-map';
import { getBusinessLabelForField } from './businessLabels';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { appendJsonPointerSegment } from './jsonPointer';
import { detectSchemeType, shouldExposeSchemeValue } from './schemeUtils';
import type { SchemeType } from './schemeTypes';

export interface SchemeLocation {
  path: string;           // JSON 路径，例如 $.action_cmd 或 $["a.b"]
  pointer: string;        // JSON 指针，用于特殊键场景下精确回写
  label?: string;         // 业务标签，如参数数组里的键值字段名
  line: number;           // 行号（从 1 开始）
  column: number;         // 起始列号（从 1 开始）
  endLine: number;        // 结束行号（从 1 开始）
  endColumn: number;      // 结束列号（从 1 开始，编辑器范围右开）
  value: string;          // 原始值
  schemeType: SchemeType; // 协议类型
}

export interface SchemeScanResult {
  locations: SchemeLocation[];
  isLimited: boolean;
  limit: number;
}

export const DEFAULT_SCHEME_SCAN_RESULT_LIMIT = 1000;

interface SchemeScanTask {
  label?: string;
  path: string;
  pointer: string;
  value: unknown;
}

export function scanSchemesInJson(
  jsonString: string,
  options?: { resultLimit?: number; forcedPaths?: readonly string[] }
): SchemeScanResult {
  const results: SchemeLocation[] = [];
  const limit = Math.max(1, options?.resultLimit ?? DEFAULT_SCHEME_SCAN_RESULT_LIMIT);
  const forcedPaths = new Set(options?.forcedPaths || []);
  let isLimited = false;

  try {
    const sourceMap = parseJsonSourceMap(jsonString);
    const parsed: unknown = sourceMap.data;

    const getValueRange = (pointer: string) => {
      const pointerInfo = sourceMap.pointers[pointer];
      const start = pointerInfo?.value ?? pointerInfo?.key ?? { line: 0, column: 0 };
      const end = pointerInfo?.valueEnd ?? pointerInfo?.keyEnd ?? start;

      return {
        line: start.line + 1,
        column: start.column + 1,
        endLine: end.line + 1,
        endColumn: end.column + 1,
      };
    };

    const pending: SchemeScanTask[] = [{ path: '$', pointer: '', value: parsed }];
    while (pending.length > 0) {
      const current = pending.pop();
      if (!current) continue;

      if (typeof current.value === 'string') {
        const schemeType = detectSchemeType(current.value);
        if (shouldExposeSchemeValue(current.value) || forcedPaths.has(current.path)) {
          if (results.length >= limit) {
            isLimited = true;
            break;
          }

          const range = getValueRange(current.pointer);
          results.push({
            path: current.path,
            pointer: current.pointer,
            label: current.label,
            ...range,
            value: current.value,
            schemeType,
          });
        }
        continue;
      }

      if (Array.isArray(current.value)) {
        for (let index = current.value.length - 1; index >= 0; index -= 1) {
          pending.push({
            path: appendJsonPathIndex(current.path, index),
            pointer: appendJsonPointerSegment(current.pointer, String(index)),
            value: current.value[index],
          });
        }
        continue;
      }

      if (typeof current.value === 'object' && current.value !== null) {
        const record = current.value as Record<string, unknown>;
        const keys = Object.keys(record);
        for (let index = keys.length - 1; index >= 0; index -= 1) {
          const key = keys[index];
          pending.push({
            path: appendJsonPathKey(current.path, key),
            pointer: appendJsonPointerSegment(current.pointer, key),
            label: getBusinessLabelForField(record, key),
            value: record[key],
          });
        }
      }
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }

  return {
    locations: results,
    isLimited,
    limit,
  };
}

export function findSchemesInJson(jsonString: string): SchemeLocation[] {
  try {
    return scanSchemesInJson(jsonString).locations;
  } catch {
    return [];
  }
}
