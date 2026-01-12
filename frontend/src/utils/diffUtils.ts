import * as Diff from 'diff';

export type DiffType = 'add' | 'delete' | 'modify';

export interface DiffRange {
    type: DiffType;
    startLine: number;
    endLine: number;
}

/**
 * 使用 diff 库计算行级差异。
 * 成熟可靠的实现，正确处理各种边界情况。
 */
export const computeLineDiff = (original: string, modified: string): DiffRange[] => {
    // 如果完全相同，无需计算
    if (original === modified) return [];
    
    // 使用 diff 库进行行级比较
    const changes = Diff.diffLines(original, modified);
    
    const diffs: DiffRange[] = [];
    let currentLine = 1; // modified 文件中的当前行号 (1-based)
    
    // 处理变更块，检测 modify 模式（相邻的 remove + add）
    for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        
        // 计算这个变更块的行数
        const lines = change.value.split('\n');
        // 如果以换行结尾，最后一个空元素不算
        const actualLineCount = change.value.endsWith('\n') ? lines.length - 1 : lines.length;
        
        if (!change.added && !change.removed) {
            // 未变更的行，只更新行号
            currentLine += actualLineCount;
        } else if (change.removed) {
            // 检查下一个变更是否是 added（构成 modify）
            const next = changes[i + 1];
            if (next && next.added) {
                // 这是一个修改（remove + add）
                const addedLines = next.value.split('\n');
                const addedLineCount = next.value.endsWith('\n') ? addedLines.length - 1 : addedLines.length;
                
                if (addedLineCount > 0) {
                    diffs.push({
                        type: 'modify',
                        startLine: currentLine,
                        endLine: currentLine + addedLineCount - 1
                    });
                    currentLine += addedLineCount;
                }
                i++; // 跳过下一个 added 变更
            } else {
                // 纯删除，锚定到当前行
                const anchorLine = Math.max(currentLine, 1);
                diffs.push({
                    type: 'delete',
                    startLine: anchorLine,
                    endLine: anchorLine
                });
                // 删除不改变 modified 中的行号
            }
        } else if (change.added) {
            // 纯新增
            if (actualLineCount > 0) {
                diffs.push({
                    type: 'add',
                    startLine: currentLine,
                    endLine: currentLine + actualLineCount - 1
                });
                currentLine += actualLineCount;
            }
        }
    }
    
    return diffs;
};