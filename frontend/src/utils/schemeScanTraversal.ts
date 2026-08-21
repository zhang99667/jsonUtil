import { parse as parseJsonSourceMap } from 'json-source-map';
import { getBusinessLabelForField } from './businessLabels';
import { appendJsonPathIndex, appendJsonPathKey } from './jsonPathSegments';
import { appendJsonPointerSegment } from './jsonPointer';

export interface SchemeScanNode {
  label?: string;
  path: string;
  pointer: string;
  value: unknown;
}

export interface SchemeScanNodeRange {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}

type SchemeScanRangeResolver = (pointer: string) => SchemeScanNodeRange;
type SchemeScanNodeVisitor = (
  node: SchemeScanNode,
  getValueRange: SchemeScanRangeResolver,
) => boolean | void;

export const walkJsonForSchemeScan = (
  jsonString: string,
  visitNode: SchemeScanNodeVisitor,
): void => {
  const sourceMap = parseJsonSourceMap(jsonString);
  const getValueRange: SchemeScanRangeResolver = pointer => {
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

  const pending: SchemeScanNode[] = [{ path: '$', pointer: '', value: sourceMap.data }];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;
    if (visitNode(current, getValueRange) === false) return;
    if (typeof current.value === 'string') continue;

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

    if (typeof current.value !== 'object' || current.value === null) continue;
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
};
