import { diffLines } from 'diff';

export type DiffType = 'add' | 'delete' | 'modify';

export interface DiffRange {
  type: DiffType;
  startLine: number;
  endLine: number;
}

export const DIRTY_DIFF_MAX_TOTAL_LENGTH = 400_000;

export const shouldSkipLineDiff = (original: string, modified: string): boolean => {
  return original.length + modified.length > DIRTY_DIFF_MAX_TOTAL_LENGTH;
};

/**
 * 计算编辑后内容中的行级差异，供未保存标记使用。
 * 行尾换行符不同不属于内容差异。
 */
export const computeLineDiff = (original: string, modified: string): DiffRange[] => {
  if (original === modified) return [];

  const changes = diffLines(original, modified, {
    ignoreNewlineAtEof: true,
    stripTrailingCr: true,
  });
  const diffs: DiffRange[] = [];
  const lastModifiedLine = modified.split('\n').length;
  let currentLine = 1;

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];

    if (!change.added && !change.removed) {
      currentLine += change.count;
      continue;
    }

    if (change.removed) {
      const next = changes[i + 1];
      if (next?.added) {
        diffs.push({
          type: 'modify',
          startLine: currentLine,
          endLine: currentLine + next.count - 1,
        });
        currentLine += next.count;
        i += 1;
        continue;
      }

      const anchorLine = Math.min(currentLine, lastModifiedLine);
      diffs.push({ type: 'delete', startLine: anchorLine, endLine: anchorLine });
      continue;
    }

    diffs.push({
      type: 'add',
      startLine: currentLine,
      endLine: currentLine + change.count - 1,
    });
    currentLine += change.count;
  }

  return diffs;
};
