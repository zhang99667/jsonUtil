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
    // 新增行是存在于 modified 但不存在于 original 的行。
    // 修改行：这个简单的 LCS 将修改视为移除 + 新增。
    // 我们可以尝试将相邻的移除+新增合并为 'modify'。

    let currentRange: DiffRange | null = null;

    for (let k = 0; k < changes.length; k++) {
        const change = changes[k];

        // 检查 "modify" 模式：紧接着新增的移除（或顺序相反）
        // 实际上，对于边缘指示器，区分新增和移除块是可以的。
        // Sublime 用绿色表示新增，黄色/蓝色表示修改。
        // 具体检测 "Modify" 需要检查新增行是否替换了移除行。

        // 简化：
        // 如果有一块移除紧接着一块新增，则将新增视为 "Modify"。

        // 首先，我们只发出 add 和 remove。
        // 注意：'Remove' 装饰需要放置在移除发生位置的 *前* 或 *后* 一行，
        // 或者作为专门的边缘标记。标准的 Monaco 'diff' 视图可以处理这个，但在行内模式下，
        // 我们通常在删除发生的 *后* 一行用小箭头标记，
        // 或者如果我们将 "Modify" 视为 "行内容已更改"。

        if (change.type === 'add') {
            // Check if this Add was preceded by a Remove (implying modification)
            // Look back
            let isModify = false;
            let checkIdx = k - 1;
            while (checkIdx >= 0 && changes[checkIdx].type === 'remove') {
                isModify = true;
                // 如果我们在之前立即找到了一个移除分组，则可以称之为修改
                break;
            }

            const type = isModify ? 'modify' : 'add';

            if (currentRange && currentRange.type === type && currentRange.endLine === change.line - 1) {
                currentRange.endLine = change.line;
            } else {
                if (currentRange) diffs.push(currentRange);
                currentRange = { type, startLine: change.line, endLine: change.line };
            }
        } else if (change.type === 'remove') {
            // 对于删除，我们需要决定在哪里显示指示器。
            // 通常显示在删除 *之后* 的行，或者如果是文件末尾，则显示在最后一行。
            // 但是我们很难高亮显示不存在的“已删除行”。
            // Sublime 会绘制一个小箭头。
            // 对于 MVP，我们可能会跳过删除标记或将其附加到最近的现有行。

            // 让我们附加到 Modified 中的 *下一* 逻辑行。
            // 找到下一个 'keep' 或 'add' 来锚定删除标记。
            // 如果我们需要本质上处于 "Modify" 块（移除 + 新增），则新增处理视觉效果。

            // 如果是纯删除（没有新增的移除），我们需要一个红色指示器。
            // 在此迭代中，让我们推迟纯删除标记以保持健壮性。
            // 专注于新增（绿色）和修改（蓝色/黄色）。
        } else { // Keep
            if (currentRange) {
                diffs.push(currentRange);
                currentRange = null;
            }
        }
    }

    if (currentRange) diffs.push(currentRange);

    return diffs;
};
