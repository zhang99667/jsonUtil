import fs from 'node:fs';
import path from 'node:path';
import { collectDecisionLedgerRowFailures } from './aiGovernanceDecisionLedgerRowContract.mjs';
import { parseDecisionRows } from './aiGovernanceDecisionLedgerTable.mjs';
import { isIsoCalendarDate } from './aiGovernanceIsoDate.mjs';

export const AI_GOVERNANCE_DECISION_LEDGER_FILE = 'docs/AI-GOVERNANCE-DECISIONS.md';

const collectDateOrderFailures = rows => rows.flatMap((row, index) => (
  index > 0 && isIsoCalendarDate(row['日期']) && isIsoCalendarDate(rows[index - 1]['日期']) && row['日期'] > rows[index - 1]['日期'] ? [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 第 ${index + 1} 条决策记录 日期必须不晚于上一条记录`] : []
));

export const collectAiGovernanceDecisionLedgerFailures = (rootDir) => {
  const filePath = path.join(rootDir, AI_GOVERNANCE_DECISION_LEDGER_FILE);
  if (!fs.existsSync(filePath)) return [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 文件不存在，无法检查 AI 治理决策记录`];

  const { hasDecisionTable, rows } = parseDecisionRows(fs.readFileSync(filePath, 'utf8'));
  if (!hasDecisionTable) return [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 缺少决策记录表格`];
  if (rows.length === 0) return [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 决策记录表格缺少记录`];
  return [
    ...collectDateOrderFailures(rows),
    ...rows.flatMap((row, index) => collectDecisionLedgerRowFailures(rootDir, row, index, AI_GOVERNANCE_DECISION_LEDGER_FILE)),
  ];
};
