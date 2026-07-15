import { parse as parseJsonSourceMap } from 'json-source-map';
import { getBusinessLabelForField } from './businessLabels';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { appendJsonPointerSegment } from './jsonPointer';
import { detectSchemeType, shouldExposeSchemeValue } from './schemeUtils';
import type { SchemeType } from './schemeTypes';

export interface SchemeLocation {
  path: string;           // JSON Path，如 "$.action_cmd" 或 `$["a.b"]`
  pointer: string;        // JSON Pointer，用于特殊 key 场景下精确回写
  label?: string;         // 业务标签，如 extra 数组里的 k/v 字段名
  line: number;           // 行号（从 1 开始）
  column: number;         // 起始列号（从 1 开始）
  endLine: number;        // 结束行号（从 1 开始）
  endColumn: number;      // 结束列号（从 1 开始，Monaco Range 右开）
  value: string;          // 原始值
  schemeType: SchemeType; // 协议类型
}

export interface SchemeScanResult {
  locations: SchemeLocation[];
  isLimited: boolean;
  limit: number;
}

export const DEFAULT_SCHEME_SCAN_RESULT_LIMIT = 1000;

/**
 * 扫描 JSON 字符串，找出所有包含 scheme 的字符串值及其位置
 */
export function scanSchemesInJson(
  jsonString: string,
  options?: { resultLimit?: number }
): SchemeScanResult {
  const results: SchemeLocation[] = [];
  const limit = Math.max(1, options?.resultLimit ?? DEFAULT_SCHEME_SCAN_RESULT_LIMIT);
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

    const markLimited = (): false => {
      isLimited = true;
      return false;
    };

    const traverse = (
      obj: unknown,
      currentPath: string,
      currentPointer: string,
      label?: string
    ): boolean => {
      if (typeof obj === 'string') {
        const schemeType = detectSchemeType(obj);
        if (shouldExposeSchemeValue(obj)) {
          if (results.length >= limit) {
            return markLimited();
          }

          const range = getValueRange(currentPointer);
          results.push({
            path: currentPath,
            pointer: currentPointer,
            label,
            ...range,
            value: obj,
            schemeType,
          });
        }
      } else if (Array.isArray(obj)) {
        for (let index = 0; index < obj.length; index++) {
          if (!traverse(
            obj[index],
            appendJsonPathIndex(currentPath, index),
            appendJsonPointerSegment(currentPointer, String(index))
          )) {
            return false;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        const record = obj as Record<string, unknown>;
        for (const key in record) {
          if (!traverse(
            record[key],
            appendJsonPathKey(currentPath, key),
            appendJsonPointerSegment(currentPointer, key),
            getBusinessLabelForField(record, key)
          )) {
            return false;
          }
        }
      }

      return true;
    };

    traverse(parsed, '$', '');
  } catch {
    // JSON 解析失败，返回空数组
  }

  return {
    locations: results,
    isLimited,
    limit,
  };
}

export function findSchemesInJson(jsonString: string): SchemeLocation[] {
  return scanSchemesInJson(jsonString).locations;
}
