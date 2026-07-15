interface JsonErrorLocation {
  line: number;
  column: number;
}

const JSON_LINES_ERROR_RE = /JSON Lines 第\s*(\d+)\s*行解析错误/;
const JSON_ERROR_LINE_COLUMN_RE = /line\s+(\d+)\s+column\s+(\d+)/i;
const JSON_ERROR_POSITION_RE = /position\s+(\d+)/i;

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

/**
 * 从浏览器或 Node 的 JSON.parse 错误文案中提取编辑器定位信息。
 * 不同运行时错误格式不同，因此同时兼容行列、字符位置与 JSON Lines 行号。
 */
export const getJsonValidationErrorLocation = (
  value: string,
  error?: string
): JsonErrorLocation | null => {
  if (!error) return null;

  const jsonLinesMatch = error.match(JSON_LINES_ERROR_RE);
  if (jsonLinesMatch) {
    const line = Number(jsonLinesMatch[1]);
    if (!Number.isFinite(line) || line < 1) return null;

    const sourceLine = value.split(/\r?\n/)[line - 1] || '';
    const columnOffset = getJsonLineColumnOffset(sourceLine);
    const nestedLineColumnMatch = error.match(JSON_ERROR_LINE_COLUMN_RE);
    if (nestedLineColumnMatch) {
      return {
        line,
        column: columnOffset + Number(nestedLineColumnMatch[2]),
      };
    }

    const nestedPositionMatch = error.match(JSON_ERROR_POSITION_RE);
    if (nestedPositionMatch) {
      const trimmedLine = sourceLine.trim();
      const location = positionToLocation(trimmedLine, Number(nestedPositionMatch[1]));
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
    return {
      line: Number(lineColumnMatch[1]),
      column: Number(lineColumnMatch[2]),
    };
  }

  const positionMatch = error.match(JSON_ERROR_POSITION_RE);
  if (positionMatch) return positionToLocation(value, Number(positionMatch[1]));
  return null;
};
