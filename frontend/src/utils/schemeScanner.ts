import { parse as parseJsonSourceMap } from 'json-source-map';
import { detectSchemeType, type SchemeType } from './schemeUtils';

export interface SchemeLocation {
  path: string;           // JSON Path，如 "$.action_cmd" 或 `$["a.b"]`
  pointer: string;        // JSON Pointer，用于特殊 key 场景下精确回写
  line: number;           // 行号（1-based）
  column: number;         // 起始列号（1-based）
  endLine: number;        // 结束行号（1-based）
  endColumn: number;      // 结束列号（1-based，Monaco Range 右开）
  value: string;          // 原始值
  schemeType: SchemeType; // scheme 类型
}

export interface SchemeScanResult {
  locations: SchemeLocation[];
  isLimited: boolean;
  limit: number;
}

export const DEFAULT_SCHEME_SCAN_RESULT_LIMIT = 1000;

const appendJsonPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

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
    const parsed: unknown = JSON.parse(jsonString);
    const sourceMap = parseJsonSourceMap(jsonString);

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

    const escapePointerSegment = (segment: string): string => (
      segment.replace(/~/g, '~0').replace(/\//g, '~1')
    );

    const markLimited = (): false => {
      isLimited = true;
      return false;
    };

    const traverse = (obj: unknown, currentPath: string, currentPointer: string): boolean => {
      if (typeof obj === 'string') {
        const schemeType = detectSchemeType(obj);
        if (schemeType !== 'plain' && schemeType !== 'json') {
          if (results.length >= limit) {
            return markLimited();
          }

          const range = getValueRange(currentPointer);
          results.push({
            path: currentPath,
            pointer: currentPointer,
            ...range,
            value: obj,
            schemeType,
          });
        }
      } else if (Array.isArray(obj)) {
        for (let index = 0; index < obj.length; index++) {
          if (!traverse(obj[index], `${currentPath}[${index}]`, `${currentPointer}/${index}`)) {
            return false;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in (obj as Record<string, unknown>)) {
          if (!traverse(
            (obj as Record<string, unknown>)[key],
            appendJsonPathKey(currentPath, key),
            `${currentPointer}/${escapePointerSegment(key)}`
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
