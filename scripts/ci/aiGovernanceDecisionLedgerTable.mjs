export const DECISION_LEDGER_HEADER_CELLS = ['日期', '决策', '触发条件', '反例', '适用边界', '回写追踪', '锁定测试'];

const parseTableCells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());

const isSeparatorRow = cells => cells.every(cell => /^:?-{3,}:?$/.test(cell));
const isDecisionHeaderRow = cells => DECISION_LEDGER_HEADER_CELLS.every((cell, index) => cells[index] === cell);

export const parseDecisionRows = (content) => {
  const rows = [];
  let isDecisionTable = false;
  let hasDecisionTable = false;

  content.split(/\r?\n/).forEach((line) => {
    if (!line.trim().startsWith('|')) {
      isDecisionTable = false;
      return;
    }

    const cells = parseTableCells(line);
    if (isDecisionHeaderRow(cells)) {
      isDecisionTable = true;
      hasDecisionTable = true;
      return;
    }
    if (!isDecisionTable || isSeparatorRow(cells)) return;
    rows.push(Object.fromEntries(DECISION_LEDGER_HEADER_CELLS.map((cell, index) => [cell, cells[index] ?? ''])));
  });

  return { hasDecisionTable, rows };
};
