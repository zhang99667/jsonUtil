import { parseNamedMarkdownTableRows } from './aiGovernanceMarkdownTableRows.mjs';

export const DECISION_LEDGER_HEADER_CELLS = ['日期', '决策', '触发条件', '反例', '适用边界', '回写追踪', '锁定测试'];

export const parseDecisionRows = (content) => {
  const { hasTable, rows } = parseNamedMarkdownTableRows(content, DECISION_LEDGER_HEADER_CELLS);
  return { hasDecisionTable: hasTable, rows };
};
