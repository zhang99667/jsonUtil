import { governanceSchemeSupportPayloadMaintainabilityBudgets } from './maintainability-budget-governance-scheme-support-payload-rules.mjs';
import { governanceSchemeStructuredQueryMaintainabilityBudgets } from './maintainability-budget-governance-scheme-structured-query-rules.mjs';

const governanceSchemeSupportBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceSchemeSupportMaintainabilityBudgets = [
  ...governanceSchemeSupportPayloadMaintainabilityBudgets,
  ...governanceSchemeStructuredQueryMaintainabilityBudgets,
  governanceSchemeSupportBudget('scripts/ci/maintainability-budget-scheme-support-rules.mjs', 60, 'Scheme 支撑 helper 预算规则聚合入口应只负责组合 payload、query、base64 等子表'),
  governanceSchemeSupportBudget('scripts/ci/maintainability-budget-scheme-support-base64-rules.mjs', 40, 'Scheme Base64 helper 预算规则应保持短表，新增 Base64 规则先评估 codec/json/meta 分层'),
  governanceSchemeSupportBudget('scripts/ci/maintainability-budget-scheme-support-base64-suffix-rules.mjs', 30, 'Scheme Base64 后缀预算规则应独立成短表，避免 Base64 主规则继续贴边'),
  governanceSchemeSupportBudget('scripts/ci/maintainability-budget-scheme-support-log-rules.mjs', 30, 'Scheme 日志字段预算规则应保持短表，新增日志语法规则先按 syntax/types 分层'),
  governanceSchemeSupportBudget('scripts/ci/maintainability-budget-governance-scheme-support-payload-rules.mjs', 25, 'Scheme support payload 治理预算规则应独立成短表，避免 support 治理入口继续贴边'),
  governanceSchemeSupportBudget('scripts/ci/maintainability-budget-scheme-support-query-rules.mjs', 50, 'Scheme query helper 预算规则应保持短表，新增 query 规则先按来源域拆分'),
  governanceSchemeSupportBudget('scripts/ci/maintainability-budget-scheme-support-query-syntax-rules.mjs', 40, 'Scheme query 语法预算规则应保持短表，新增语法 helper 先评估 normalization/pairs 分层'),
  governanceSchemeSupportBudget('scripts/ci/maintainability-budget-scheme-support-structured-decode-rules.mjs', 40, 'Scheme 结构化展开预算规则应独立成短表，避免 payload 规则继续膨胀'),
  governanceSchemeSupportBudget('scripts/ci/maintainability-budget-scheme-support-token-rules.mjs', 30, 'Scheme token 预算规则应保持短表，新增 JWT/JWS/JWE 规则先独立评估'),
];
