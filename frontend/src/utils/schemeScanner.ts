import { walkJsonForSchemeScan } from './schemeScanTraversal';
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

export interface ArrayLocation {
  path: string;      // JSON 路径，例如 $.items
  pointer: string;   // JSON 指针，用于特殊键场景下精确定位
  line: number;      // 数组左中括号行号（从 1 开始）
  column: number;    // 数组左中括号列号（从 1 开始）
  itemCount: number; // 数组项数
}

export interface SchemeScanResult {
  locations: SchemeLocation[];
  arrayLocations: ArrayLocation[];
  isLimited: boolean;
  limit: number;
  isArrayLimited: boolean;
  arrayLimit: number;
}

export const DEFAULT_SCHEME_SCAN_RESULT_LIMIT = 1000;
export const DEFAULT_ARRAY_SCAN_RESULT_LIMIT = 1000;

export function scanSchemesInJson(
  jsonString: string,
  options?: {
    resultLimit?: number;
    arrayResultLimit?: number;
    forcedPaths?: readonly string[];
  }
): SchemeScanResult {
  const results: SchemeLocation[] = [];
  const arrayResults: ArrayLocation[] = [];
  const limit = Math.max(1, options?.resultLimit ?? DEFAULT_SCHEME_SCAN_RESULT_LIMIT);
  const arrayLimit = Math.max(1, options?.arrayResultLimit ?? DEFAULT_ARRAY_SCAN_RESULT_LIMIT);
  const forcedPaths = new Set(options?.forcedPaths || []);
  let isLimited = false;
  let isArrayLimited = false;

  try {
    walkJsonForSchemeScan(jsonString, (current, getValueRange) => {
      const isForcedObject = forcedPaths.has(current.path)
        && typeof current.value === 'object'
        && current.value !== null;
      const stringValue = typeof current.value === 'string' ? current.value : undefined;
      const isStringLocation = stringValue !== undefined
        && (shouldExposeSchemeValue(stringValue) || forcedPaths.has(current.path));

      if (Array.isArray(current.value) && current.value.length >= 2) {
        if (arrayResults.length >= arrayLimit) {
          isArrayLimited = true;
        } else {
          const range = getValueRange(current.pointer);
          arrayResults.push({
            path: current.path,
            pointer: current.pointer,
            line: range.line,
            column: range.column,
            itemCount: current.value.length,
          });
        }
      }

      if (isForcedObject || isStringLocation) {
        if (results.length >= limit) {
          isLimited = true;
        } else {
          const range = getValueRange(current.pointer);
          results.push({
            path: current.path,
            pointer: current.pointer,
            ...(isStringLocation ? { label: current.label } : {}),
            ...range,
            endLine: isStringLocation ? range.endLine : range.line,
            endColumn: isStringLocation ? range.endColumn : range.column + 1,
            value: stringValue ?? '',
            schemeType: isStringLocation ? detectSchemeType(stringValue) : 'plain',
          });
        }
      }
      return !(isLimited && isArrayLimited);
    });
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }

  return {
    locations: results,
    arrayLocations: arrayResults,
    isLimited,
    limit,
    isArrayLimited,
    arrayLimit,
  };
}

export function findSchemesInJson(jsonString: string): SchemeLocation[] {
  try {
    return scanSchemesInJson(jsonString).locations;
  } catch {
    return [];
  }
}
