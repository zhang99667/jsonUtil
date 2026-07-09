import fs from 'node:fs';
import path from 'node:path';
import { collectDecisionLedgerBackfillFailures } from './aiGovernanceDecisionLedgerBackfillContract.mjs';
import { collectDecisionLedgerActiveTestFailures } from './aiGovernanceDecisionLedgerTestEvidence.mjs';
import { collectFutureIsoDateFailures } from './aiGovernanceDateBounds.mjs';
import { DECISION_LEDGER_HEADER_CELLS } from './aiGovernanceDecisionLedgerTable.mjs';
import * as decisionLedgerReferences from './aiGovernanceDecisionLedgerReferences.mjs';
import { isIsoCalendarDate } from './aiGovernanceIsoDate.mjs';

const AUDITED_NARRATIVE_CELLS = ['触发条件', '反例', '适用边界'];
const WEAK_PLACEHOLDER_VALUES = new Set(['TODO', 'TBD', 'N/A', '无', '待补充', '人工看过']);

const collectWeakNarrativeFailures = (row, label) => AUDITED_NARRATIVE_CELLS
  .filter(cell => WEAK_PLACEHOLDER_VALUES.has(row[cell]))
  .map(cell => `${label} ${cell}不能使用弱占位内容 \`${row[cell]}\``);

export const collectDecisionLedgerRowFailures = (rootDir, row, index, ledgerFile) => {
  const label = `${ledgerFile}: 第 ${index + 1} 条决策记录`;
  const missingCells = DECISION_LEDGER_HEADER_CELLS.filter(cell => !row[cell]).map(cell => `${label} 缺少${cell}`);
  if (missingCells.length > 0) return missingCells;

  const executableCommands = decisionLedgerReferences.extractExecutableCommands(row['锁定测试']);
  const regressionTestCommands = decisionLedgerReferences.extractNodeRegressionTestCommandPaths(row['锁定测试']);
  const ciCoveredRegressionTestCommands = regressionTestCommands.filter(decisionLedgerReferences.isCiCoveredNodeRegressionTestPath);

  return [
    ...(!isIsoCalendarDate(row['日期']) ? [`${label} 日期必须使用有效 YYYY-MM-DD`] : []),
    ...collectFutureIsoDateFailures(label, '日期', row['日期']),
    ...collectWeakNarrativeFailures(row, label),
    ...collectDecisionLedgerBackfillFailures(rootDir, row, label, ledgerFile),
    ...(executableCommands.length === 0 ? [`${label} 锁定测试必须包含可执行命令`] : []),
    ...(!executableCommands.includes('node scripts/ci/check-ai-governance.mjs') ? [`${label} 锁定测试必须包含 \`node scripts/ci/check-ai-governance.mjs\``] : []),
    ...(executableCommands.length > 0 && regressionTestCommands.length === 0
      ? [`${label} 锁定测试必须包含 \`node --test ...test.mjs\` 回归或负向测试命令`]
      : []),
    ...decisionLedgerReferences.extractNodeCommandPaths(row['锁定测试'])
      .filter(file => !fs.existsSync(path.join(rootDir, file)))
      .map(file => `${label} 锁定测试命令路径不存在 \`${file}\``),
    ...regressionTestCommands.filter(file => !decisionLedgerReferences.isCiCoveredNodeRegressionTestPath(file))
      .map(file => `${label} 锁定测试命令未纳入 CI 脚本单测集合 \`${file}\``),
    ...collectDecisionLedgerActiveTestFailures(rootDir, label, ciCoveredRegressionTestCommands),
  ];
};
