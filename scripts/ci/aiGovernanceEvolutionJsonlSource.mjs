import fs from 'node:fs';
import path from 'node:path';

import { readStableEvolutionSnapshotFile } from './aiGovernanceEvolutionSnapshotPrimitives.mjs';

const strictUtf8 = new TextDecoder('utf-8', { fatal: true });
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

const failedSource = (label, message) => ({
  lines: [],
  failure: `${label}: ${message}`,
});

const isValidLimit = value => Number.isSafeInteger(value) && value >= 0;

export const readEvolutionJsonlSource = (
  filePath,
  { label, maxBytes, maxLineBytes, maxPhysicalLines, maxRecords },
) => {
  if (typeof label !== 'string' || label.length === 0
    || !isValidLimit(maxBytes) || !isValidLimit(maxLineBytes)
    || !isValidLimit(maxPhysicalLines) || !isValidLimit(maxRecords)) {
    throw new TypeError('evolution JSONL source 边界参数非法');
  }

  let bytes;
  try {
    const absolutePath = path.resolve(filePath);
    const canonicalParent = fs.realpathSync(path.dirname(absolutePath));
    ({ bytes } = readStableEvolutionSnapshotFile(
      canonicalParent,
      path.basename(absolutePath),
      maxBytes,
    ));
  } catch {
    return failedSource(label, '无法读取稳定的有界普通文件');
  }
  if (bytes.subarray(0, UTF8_BOM.length).equals(UTF8_BOM)) {
    return failedSource(label, '禁止 UTF-8 BOM');
  }

  let source;
  try { source = strictUtf8.decode(bytes); }
  catch { return failedSource(label, '必须是合法 UTF-8'); }

  const lines = [];
  let lineNumber = 1;
  let ordinal = 0;
  let offset = 0;
  while (true) {
    if (lineNumber > maxPhysicalLines) {
      return failedSource(label, `物理行数不能超过 ${maxPhysicalLines}`);
    }
    const newline = source.indexOf('\n', offset);
    const end = newline === -1 ? source.length : newline;
    const rawLine = source.slice(offset, end);
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (Buffer.byteLength(line, 'utf8') > maxLineBytes) {
      return failedSource(label, `第 ${lineNumber} 行超过 ${maxLineBytes / 1024} KiB`);
    }
    if (line.trim()) {
      ordinal += 1;
      if (ordinal > maxRecords) {
        return failedSource(label, `非空记录数不能超过 ${maxRecords}`);
      }
      lines.push({ line, lineNumber, ordinal });
    }
    if (newline === -1) break;
    offset = newline + 1;
    lineNumber += 1;
  }
  return { lines };
};
