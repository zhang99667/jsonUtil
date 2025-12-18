export type DiffType = 'add' | 'delete' | 'modify';

export interface DiffRange {
    type: DiffType;
    startLine: number;
    endLine: number;
}

/**
 * 计算原始文本和修改后文本之间基于行的简单差异。
 * 这是一个适用于实时编辑器装饰的轻量级实现。
 * 它主要检测新增和修改的块。由于没有幽灵文本，删除块很难在边缘（gutter）中可视化，
 * 所以我们目前专注于新增和修改，或者将删除表示为前一行的标记。
 */
export const computeLineDiff = (original: string, modified: string): DiffRange[] => {
    const originalLines = original.split(/\r\n|\r|\n/);
    const modifiedLines = modified.split(/\r\n|\r|\n/);

    const diffs: DiffRange[] = [];

    // 最小化的 Myers Diff 或类似的 LCS (最长公共子序列) 实现最为理想。
    // 为了简单起见并避免引入沉重的外部依赖，我们可以使用基本的启发式算法
    // 或简单的 LCS 实现。
    // 鉴于“像 Sublime”这样的要求，我们需要知道 *modified* 中的哪些行
    // 与 *original* 相比是新增或不同的。

    // Let's use a simple LCS-based diff for lines.
    const matrix: number[][] = [];
    const N = originalLines.length;
    const M = modifiedLines.length;

    // Initialize matrix
    for (let i = 0; i <= N; i++) {
        matrix[i] = new Int32Array(M + 1) as any;
    }

    // Compute LCS
    for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= M; j++) {
            if (originalLines[i - 1] === modifiedLines[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1] + 1;
            } else {
                matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
            }
        }
    }

    // Backtrack to find diff
    let i = N;
    let j = M;
    const changes: { type: 'add' | 'remove' | 'keep', line: number, oldLine: number }[] = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
            changes.push({ type: 'keep', line: j, oldLine: i });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
            changes.push({ type: 'add', line: j, oldLine: -1 }); // 在 modified 的第 j 行新增
            j--;
        } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
            changes.push({ type: 'remove', line: -1, oldLine: i }); // 从 original 的第 i 行移除
            i--;
        }
    }

    changes.reverse();

    // 将变更处理为 DiffRanges (连续块)
    // 我们只关心装饰 *modified* (当前) 编辑器。

    // 辅助函数：获取变更索引对应的 modified 行号
    // 用于将删除操作锚定到后续的行
    const getModifiedLine = (index: number): number => {
        for (let k = index; k < changes.length; k++) {
            if (changes[k].type !== 'remove') {
                return changes[k].line;
            }
        }
        // 如果剩余全是删除（文件末尾删除），锚定到最后一行
        return M > 0 ? M : 1;
    };

    let k = 0;
    while (k < changes.length) {
        const change = changes[k];

        if (change.type === 'keep') {
            k++;
            continue;
        }

        // 检查 Modify 模式 (Remove block + Add block)
        // 我们的 LCS 回溯通常会产生 Remove 然后 Add 的顺序
        if (change.type === 'remove') {
            // 向前查看是否有紧邻的 Add
            let next = k + 1;
            while (next < changes.length && changes[next].type === 'remove') next++;

            if (next < changes.length && changes[next].type === 'add') {
                // 这是一个 Modify (修改)
                // 消费掉所有的 Add，将其合并为一个 Modify 块
                const startLine = changes[next].line;
                let endAdd = next;
                while (endAdd < changes.length && changes[endAdd].type === 'add') endAdd++;
                const endLine = changes[endAdd - 1].line;

                diffs.push({ type: 'modify', startLine, endLine });
                k = endAdd; // 跳过处理过的 remove 和 add
            } else {
                // 这是一个纯 Delete (删除)
                // 锚定到下一个可见行
                const anchorLine = getModifiedLine(k);
                
                // 避免对同一行重复添加删除标记
                // (如果有多个不连续的删除块锚定到同一行，可能会重叠，这里简化处理)
                const lastDiff = diffs.length > 0 ? diffs[diffs.length - 1] : null;
                if (!lastDiff || lastDiff.type !== 'delete' || lastDiff.startLine !== anchorLine) {
                    diffs.push({ type: 'delete', startLine: anchorLine, endLine: anchorLine });
                }

                // 跳过这些 remove
                k = next;
            }
        } else if (change.type === 'add') {
            // 这是一个纯 Add (新增)
            const startLine = change.line;
            let next = k + 1;
            while (next < changes.length && changes[next].type === 'add') next++;
            const endLine = changes[next - 1].line;

            diffs.push({ type: 'add', startLine, endLine });
            k = next;
        }
    }

    return diffs;
};
