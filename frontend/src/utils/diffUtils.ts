export type DiffType = 'add' | 'delete' | 'modify';

export interface DiffRange {
    type: DiffType;
    startLine: number;
    endLine: number;
}

/**
 * 使用 Myers Diff 算法计算行级差异。
 * 时间复杂度 O(ND)，比标准 LCS 的 O(NM) 更适合大文件。
 */
export const computeLineDiff = (original: string, modified: string): DiffRange[] => {
    // 预处理：统一换行符并分割
    const originalLines = original.split(/\r\n|\r|\n/);
    const modifiedLines = modified.split(/\r\n|\r|\n/);
    const N = originalLines.length;
    const M = modifiedLines.length;
    
    // 如果没有变更，直接返回
    if (original === modified) return [];

    const MAX = N + M;
    const v = new Int32Array(2 * MAX + 1);
    v[MAX + 1] = 0;
    
    // 存储每一步的状态以便回溯
    const trace: Int32Array[] = [];

    // Myers Diff 主循环
    let d: number;
    for (d = 0; d <= MAX; d++) {
        // 每一轮都需要保存 v 的快照用于回溯
        // 为了性能，我们只在确实需要路径时才完整保存，
        // 但 Myers 算法需要完整的 trace 来重建路径。
        // 对于大文件，这可能消耗内存，但在前端 JS 环境下，文本编辑通常在可控范围内。
        const vCopy = new Int32Array(v);
        trace.push(vCopy);

        let found = false;
        for (let k = -d; k <= d; k += 2) {
            let x: number;
            // 决定向下还是向右
            if (k === -d || (k !== d && v[MAX + k - 1] < v[MAX + k + 1])) {
                x = v[MAX + k + 1]; // 向下 (Insertion in Myers graph -> Add in diff)
            } else {
                x = v[MAX + k - 1] + 1; // 向右 (Deletion in Myers graph -> Remove in diff)
            }
            
            let y = x - k;
            
            // 沿对角线移动 (Matching lines)
            while (x < N && y < M && originalLines[x] === modifiedLines[y]) {
                x++;
                y++;
            }
            
            v[MAX + k] = x;
            
            if (x >= N && y >= M) {
                found = true;
                break;
            }
        }
        
        if (found) break;
    }

    // 回溯生成 Diff
    const changes: { type: 'add' | 'remove' | 'keep', line: number, oldLine: number }[] = [];
    let x = N;
    let y = M;
    
    for (let k = d; k > 0; k--) {
        const vPrev = trace[k];
        const vCurr = trace[k+1]; // Current state is actually not needed if we look back correctly, 
                                  // but Myers standard backtrack uses current k/x/y to determine step.
        
        // Inverse logic of forward pass
        // k_diag = x - y
        const diag = x - y;
        
        // Find previous step that led to (x, y)
        // Possibilities: from k-1 (down/add) or k+1 (right/remove) in the V array indices
        // Wait, standard backtrack logic:
        
        // Look at V array from step k-1
        const kLow = - (k - 1);
        const kHigh = (k - 1);
        
        // We are at diagonal 'diag'. We could have come from 'diag - 1' (x came from x, y came from y-1 -> Add)
        // or 'diag + 1' (x came from x-1, y came from y -> Remove)
        
        // Boundary checks are implicit in V array values
        // Correct logic:
        // if (diag == -k || (diag != k && V[MAX + diag - 1] < V[MAX + diag + 1])) -> This was the decision logic.
        // But here we work backwards.
        
        let prevK: number;
        if (diag === -k || (diag !== k && vPrev[MAX + diag - 1] < vPrev[MAX + diag + 1])) {
             prevK = diag + 1; // It came from k+1 in the loop logic (down/add was favored if V[k+1] was greater)
             // Wait, let's re-align with the forward loop:
             // if k==-d or (k!=d and v[k-1] < v[k+1]): x = v[k+1] -> This is Move Down (y increases, x same before diagonal). 
             // Move Down in grid (x, y) -> (x, y+1). Wait, Myers paper: x is horizontal (original), y is vertical (modified).
             // Let's stick to the variables used: x (original index), y (modified index).
             // Forward: 
             // if ... x = v[k+1] -> we picked x from k+1. k+1 means diagonal (x) - (y-1) = x-y+1 = k+1. 
             // We moved from y-1 to y. x stayed same. This is y++ -> Modified++ -> ADD.
             // else x = v[k-1] + 1 -> we picked x from k-1. k-1 means diagonal (x-1) - y = x-y-1 = k-1.
             // We moved from x-1 to x. y stayed same. This is x++ -> Original++ -> REMOVE.
             
             // So, back to backtrack:
             // We need to decide if we came from (diag+1) [Add] or (diag-1) [Remove].
             // The condition `v[MAX + k - 1] < v[MAX + k + 1]` decided which one was "better" (reached further).
             // We simply check which one yields the current x (before snake).
             
        }
        
        // Actually simpler: just re-evaluate the decision at step (k-1) to know which direction we TOOK.
        // We need the V array at step (k-1).
        const vLast = trace[k-1]; // V at step d-1
        
        let prevX: number;
        let prevY: number;
        let direction: 'add' | 'remove'; // relative to output
        
        // Re-check the decision logic used in forward pass for the current diagonal 'diag'
        // CAREFUL: The 'k' loop variable in forward pass is the diagonal index.
        // Here 'k' is the step count (depth). The diagonal is fixed as 'diag'.
        // We need to know which 'prev_diag' led to 'diag'.
        // prev_diag is either diag-1 (from Remove/Right) or diag+1 (from Add/Down).
        
        // Rule: 
        // if (diag == -k || (diag != k && vLast[MAX + diag - 1] < vLast[MAX + diag + 1]))
        // This checks if we came from diag+1.
        
        const k_step = k; // current depth
        // The effective range of diagonals at step (k-1) is [-(k-1), k-1].
        // The current diagonal 'diag' must be reachable from one of them.
        
        // Note: The condition `diag === -k` is impossible if we are strictly following valid paths, 
        // but `diag === -k` corresponds to the lower boundary in forward loop `k = -d`.
        
        // Check if we could have come from diag+1 (Add)
        // Validity: diag+1 must be within bounds of step k-1? 
        // Actually, Myers logic is:
        // if (k == -d || (k != d && V[k-1] < V[k+1])) -> x = V[k+1]
        // Here k is 'diag'. d is 'k_step'.
        
        const isFromDiagPlus1 = (diag === -k_step) || (diag !== k_step && vLast[MAX + diag - 1] < vLast[MAX + diag + 1]);
        
        if (isFromDiagPlus1) {
            // Came from diag+1 (Add in modified)
            // x unchanged (before snake), y decremented
            // Forward: x = v[k+1], y = x - k = x - (diag)
            // Previous: diag_prev = diag + 1
            // prevX = vLast[MAX + diag + 1]
            prevX = vLast[MAX + diag + 1];
            // prevY = prevX - (diag + 1)
            direction = 'add';
        } else {
            // Came from diag-1 (Remove in original)
            // x decremented, y unchanged
            // Forward: x = v[k-1] + 1
            // Previous: diag_prev = diag - 1
            // prevX = vLast[MAX + diag - 1]
            prevX = vLast[MAX + diag - 1];
            direction = 'remove';
        }
        
        prevY = prevX - (diag + (direction === 'add' ? 1 : -1));
        
        // Snake (diagonal moves)
        while (x > prevX && y > prevY) {
            changes.push({ type: 'keep', line: y, oldLine: x });
            x--;
            y--;
        }
        
        // The single step
        if (direction === 'add') {
            // y decreased from y to prevY (y-1)
            // This was an insertion in Modified at line y
            changes.push({ type: 'add', line: y, oldLine: -1 });
            y--;
        } else {
            // x decreased from x to prevX (x-1)
            // This was a deletion from Original at line x
            changes.push({ type: 'remove', line: -1, oldLine: x });
            x--;
        }
    }

    // Flush remaining snakes (if d=0 or start)
    while (x > 0 && y > 0) {
        changes.push({ type: 'keep', line: y, oldLine: x });
        x--;
        y--;
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
