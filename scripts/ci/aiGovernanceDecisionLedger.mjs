import fs from 'node:fs';
import path from 'node:path';
import { DECISION_LEDGER_HEADER_CELLS, parseDecisionRows } from './aiGovernanceDecisionLedgerTable.mjs';
import * as decisionLedgerReferences from './aiGovernanceDecisionLedgerReferences.mjs';

export const AI_GOVERNANCE_DECISION_LEDGER_FILE = 'docs/AI-GOVERNANCE-DECISIONS.md';

const hasIsoDate = text => /^\d{4}-\d{2}-\d{2}$/.test(text);
const AUDITED_NARRATIVE_CELLS = ['触发条件', '反例', '适用边界'];
const WEAK_PLACEHOLDER_VALUES = new Set(['TODO', 'TBD', 'N/A', '无', '待补充', '人工看过']);

const collectWeakNarrativeFailures = (row, label) => AUDITED_NARRATIVE_CELLS
  .filter(cell => WEAK_PLACEHOLDER_VALUES.has(row[cell]))
  .map(cell => `${label} ${cell}不能使用弱占位内容 \`${row[cell]}\``);

const collectRowFailures = (rootDir, row, index) => {
  const label = `${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 第 ${index + 1} 条决策记录`;
  const missingCells = DECISION_LEDGER_HEADER_CELLS.filter(cell => !row[cell]).map(cell => `${label} 缺少${cell}`);
  if (missingCells.length > 0) return missingCells;

  const executableCommands = decisionLedgerReferences.extractExecutableCommands(row['锁定测试']);
  const regressionTestCommands = decisionLedgerReferences.extractNodeRegressionTestCommandPaths(row['锁定测试']);
  const backfillReferences = decisionLedgerReferences.extractBacktickReferences(row['回写追踪']);

  return [
    ...(!hasIsoDate(row['日期']) ? [`${label} 日期必须使用 YYYY-MM-DD`] : []),
    ...collectWeakNarrativeFailures(row, label),
    ...(backfillReferences.length === 0 ? [`${label} 回写追踪必须包含反引号路径`] : []),
    ...(!backfillReferences.includes('CHANGELOG.md') ? [`${label} 回写追踪必须包含 \`CHANGELOG.md\``] : []),
    ...backfillReferences
      .filter(file => !fs.existsSync(path.join(rootDir, file)))
      .map(file => `${label} 回写追踪路径不存在 \`${file}\``),
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
  ];
};

const collectDateOrderFailures = rows => rows.flatMap((row, index) => (
  index > 0 && hasIsoDate(row['日期']) && hasIsoDate(rows[index - 1]['日期']) && row['日期'] > rows[index - 1]['日期'] ? [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 第 ${index + 1} 条决策记录 日期必须不晚于上一条记录`] : []
));

export const collectAiGovernanceDecisionLedgerFailures = (rootDir) => {
  const filePath = path.join(rootDir, AI_GOVERNANCE_DECISION_LEDGER_FILE);
  if (!fs.existsSync(filePath)) return [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 文件不存在，无法检查 AI 治理决策记录`];

  const { hasDecisionTable, rows } = parseDecisionRows(fs.readFileSync(filePath, 'utf8'));
  if (!hasDecisionTable) return [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 缺少决策记录表格`];
  if (rows.length === 0) return [`${AI_GOVERNANCE_DECISION_LEDGER_FILE}: 决策记录表格缺少记录`];
  return [...collectDateOrderFailures(rows), ...rows.flatMap((row, index) => collectRowFailures(rootDir, row, index))];
};
