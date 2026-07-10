import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDecisionRows } from '../ci/aiGovernanceDecisionLedgerTable.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const decisionFile = 'docs/AI-GOVERNANCE-DECISIONS.md';
const markdownLinks = text => [...text.matchAll(/`([^`]+)`/g)].map(match => match[1]);

const decisionFromRow = row => ({
  date: row['日期'],
  decision: row['决策'],
  trigger: row['触发条件'],
  counterexample: row['反例'],
  boundary: row['适用边界'],
  writebackFiles: markdownLinks(row['回写追踪']),
  validationCommands: markdownLinks(row['锁定测试']).filter(item => item.startsWith('node ')),
});

export const buildJsonutilsDecisionSummary = ({ limit = 5, cwd = rootDir } = {}) => {
  const content = fs.readFileSync(path.join(cwd, decisionFile), 'utf8');
  const { hasDecisionTable, rows } = parseDecisionRows(content);
  const decisions = rows.slice(0, limit).map(decisionFromRow);
  return {
    schemaVersion: 1,
    reportType: 'jsonutils-decision-summary',
    ok: hasDecisionTable,
    source: decisionFile,
    totalDecisions: rows.length,
    decisions,
  };
};
