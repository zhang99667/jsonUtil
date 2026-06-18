import { parse as parseJsonSourceMap } from 'json-source-map';
import type { HighlightRange } from '../types';
import type { JsonSchemaIssue, JsonSchemaValidationResult } from './jsonSchemaValidation';

export interface JsonSchemaIssueHighlight {
  range: HighlightRange;
  issue: JsonSchemaIssue;
}

const toHighlightRange = (
  pointer: string,
  pointers: ReturnType<typeof parseJsonSourceMap>['pointers']
): HighlightRange | null => {
  const pointerInfo = pointers[pointer];
  if (!pointerInfo) return null;

  const loc = pointerInfo.value || pointerInfo.key;
  if (!loc) return null;

  const endLoc = pointerInfo.valueEnd || pointerInfo.keyEnd || loc;
  return {
    startLine: loc.line + 1,
    startColumn: loc.column + 1,
    endLine: endLoc.line + 1,
    endColumn: endLoc.column + 1,
  };
};

export const getJsonSchemaIssueHighlights = (
  jsonText: string,
  result: JsonSchemaValidationResult | null
): JsonSchemaIssueHighlight[] => {
  if (!result || result.status !== 'invalid' || result.issues.length === 0) return [];

  try {
    const { pointers } = parseJsonSourceMap(jsonText);
    return result.issues
      .map(issue => {
        const range = toHighlightRange(issue.pointer, pointers);
        return range ? { range, issue } : null;
      })
      .filter((item): item is JsonSchemaIssueHighlight => item !== null);
  } catch {
    return [];
  }
};
