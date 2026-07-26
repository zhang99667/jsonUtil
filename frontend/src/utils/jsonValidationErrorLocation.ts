interface JsonErrorLocation {
  line: number;
  column: number;
}

const JSON_LINES_ERROR_RE = /JSON Lines 第\s*(\d+)\s*行解析错误/;
const JSON_ERROR_LINE_COLUMN_RE = /line\s+(\d+)\s+column\s+(\d+)/i;
const JSON_ERROR_POSITION_RE = /position\s+(\d+)/i;

const parseSafeInteger = (value: string, minimum: number): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum ? parsed : null;
};

const positionToLocation = (value: string, position: number): JsonErrorLocation => {
  const safePosition = Math.max(0, Math.min(position, value.length));
  let line = 1;
  let column = 1;

  for (let index = 0; index < safePosition; index++) {
    const char = value[index];
    if (char === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
};

const getJsonLineColumnOffset = (line: string): number => {
  const offset = line.search(/\S/);
  return offset >= 0 ? offset : 0;
};

// 同时兼容运行时提供的行列、字符位置与逐行格式错误信息。
export const getJsonValidationErrorLocation = (
  value: string,
  error?: string
): JsonErrorLocation | null => {
  if (!error) return null;

  const jsonLinesMatch = error.match(JSON_LINES_ERROR_RE);
  if (jsonLinesMatch) {
    const line = parseSafeInteger(jsonLinesMatch[1], 1);
    if (line === null) return null;

    const sourceLine = value.split(/\r?\n/)[line - 1] || '';
    const columnOffset = getJsonLineColumnOffset(sourceLine);
    const nestedLineColumnMatch = error.match(JSON_ERROR_LINE_COLUMN_RE);
    if (nestedLineColumnMatch) {
      const nestedLine = parseSafeInteger(nestedLineColumnMatch[1], 1);
      const column = parseSafeInteger(nestedLineColumnMatch[2], 1);
      if (nestedLine === null || column === null) return null;
      return {
        line,
        column: columnOffset + column,
      };
    }

    const nestedPositionMatch = error.match(JSON_ERROR_POSITION_RE);
    if (nestedPositionMatch) {
      const position = parseSafeInteger(nestedPositionMatch[1], 0);
      if (position === null) return null;
      const trimmedLine = sourceLine.trim();
      const location = positionToLocation(trimmedLine, position);
      return {
        line,
        column: columnOffset + location.column,
      };
    }

    return {
      line,
      column: columnOffset + 1,
    };
  }

  const lineColumnMatch = error.match(JSON_ERROR_LINE_COLUMN_RE);
  if (lineColumnMatch) {
    const line = parseSafeInteger(lineColumnMatch[1], 1);
    const column = parseSafeInteger(lineColumnMatch[2], 1);
    if (line === null || column === null) return null;
    return {
      line,
      column,
    };
  }

  const positionMatch = error.match(JSON_ERROR_POSITION_RE);
  if (positionMatch) {
    const position = parseSafeInteger(positionMatch[1], 0);
    return position === null ? null : positionToLocation(value, position);
  }
  return null;
};
