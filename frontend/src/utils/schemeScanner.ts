import { parse as parseJsonSourceMap } from 'json-source-map';
import { detectSchemeType, type SchemeType } from './schemeUtils';

export interface SchemeLocation {
  path: string;           // JSON Path，如 "$.action_cmd"
  line: number;           // 行号（1-based）
  value: string;          // 原始值
  schemeType: SchemeType; // scheme 类型
}

/**
 * 扫描 JSON 字符串，找出所有包含 scheme 的字符串值及其位置
 */
export function findSchemesInJson(jsonString: string): SchemeLocation[] {
  const results: SchemeLocation[] = [];

  try {
    const parsed: unknown = JSON.parse(jsonString);
    const sourceMap = parseJsonSourceMap(jsonString);

    const getValueLine = (pointer: string): number => {
      const pointerInfo = sourceMap.pointers[pointer];
      return (pointerInfo?.value?.line ?? pointerInfo?.key?.line ?? 0) + 1;
    };

    const escapePointerSegment = (segment: string): string => (
      segment.replace(/~/g, '~0').replace(/\//g, '~1')
    );

    const traverse = (obj: unknown, currentPath: string, currentPointer: string) => {
      if (typeof obj === 'string') {
        const schemeType = detectSchemeType(obj);
        if (schemeType !== 'plain' && schemeType !== 'json') {
          results.push({
            path: currentPath,
            line: getValueLine(currentPointer),
            value: obj,
            schemeType,
          });
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          traverse(item, `${currentPath}[${index}]`, `${currentPointer}/${index}`);
        });
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in (obj as Record<string, unknown>)) {
          traverse(
            (obj as Record<string, unknown>)[key],
            `${currentPath}.${key}`,
            `${currentPointer}/${escapePointerSegment(key)}`
          );
        }
      }
    };

    traverse(parsed, '$', '');
  } catch {
    // JSON 解析失败，返回空数组
  }

  return results;
}
