import fs from 'node:fs';
import path from 'node:path';
import { extractBacktickReferences, extractExecutableCommands, extractNodeCommandPaths } from './aiGovernanceDecisionLedgerReferences.mjs';

export const AI_GOVERNANCE_DECISION_LEDGER_FILE = 'docs/AI-GOVERNANCE-DECISIONS.md';

const DECISION_LEDGER_HEADER_CELLS = ['日期', '决策', '触发条件', '反例', '适用边界', '回写追踪', '锁定测试'];

const parseTableCells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());

const isSeparatorRow = cells => cells.every(cell => /^:?-{3,}:?$/.test(cell));
const isDecisionHeaderRow = cells => DECISION_LEDGER_HEADER_CELLS.every((cell, index) => cells[index] === cell);
const hasPathReference = text => extractBacktickReferences(text).length > 0;
const hasExecutableCommand = text => extractExecutableCommands(text).length > 0;
const hasIsoDate = text => /^\d{4}-\d{2}-\d{2}$/.test(text);

const parseDecisionRows = (content) => {
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

const collectRowFailures = (rootDir, row, index) => {
  const label = `${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 第 ${index + 1} 条决策记录`;
  const missingCells = DECISION_LEDGER_HEADER_CELLS
    .filter(cell => !row[cell])
    .map(cell => `${label} 缺少${cell}`);
  if (missingCells.length > 0) return missingCells;

  return [
    ...(!hasIsoDate(row['日期']) ? [`${label} 日期必须使用 YYYY-MM-DD`] : []),
    ...(!hasPathReference(row['回写追踪']) ? [`${label} 回写追踪必须包含反引号路径`] : []),
    ...extractBacktickReferences(row['回写追踪'])
      .filter(file => !fs.existsSync(path.join(rootDir, file)))
      .map(file => `${label} 回写追踪路径不存在 \`${file}\``),
    ...(!hasExecutableCommand(row['锁定测试']) ? [`${label} 锁定测试必须包含可执行命令`] : []),
    ...extractNodeCommandPaths(row['锁定测试'])
      .filter(file => !fs.existsSync(path.join(rootDir, file)))
      .map(file => `${label} 锁定测试命令路径不存在 \`${file}\``),
  ];
};

export const collectAiGovernanceDecisionLedgerFailures = (rootDir) => {
  const filePath = path.join(rootDir, AI_GOVERNANCE_DECISION_LEDGER_FILE);
  if (!fs.existsSync(filePath)) return [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 文件不存在，无法检查 AI 治理决策记录`];

  const { hasDecisionTable, rows } = parseDecisionRows(fs.readFileSync(filePath, 'utf8'));
  if (!hasDecisionTable) return [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 缺少决策记录表格`];
  if (rows.length === 0) return [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 决策记录表格缺少记录`];
  return rows.flatMap((row, index) => collectRowFailures(rootDir, row, index));
};
