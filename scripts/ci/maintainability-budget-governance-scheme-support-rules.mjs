import { governanceSchemeStructuredQueryMaintainabilityBudgets } from './maintainability-budget-governance-scheme-structured-query-rules.mjs';

export const governanceSchemeSupportMaintainabilityBudgets = [
  ...governanceSchemeStructuredQueryMaintainabilityBudgets,
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-rules.mjs',
    maxLines: 60,
    reason: 'Scheme 支撑 helper 预算规则聚合入口应只负责组合 payload、query、base64 等子表',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-base64-rules.mjs',
    maxLines: 40,
    reason: 'Scheme Base64 helper 预算规则应保持短表，新增 Base64 规则先评估 codec/json/meta 分层',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-base64-suffix-rules.mjs',
    maxLines: 30,
    reason: 'Scheme Base64 后缀预算规则应独立成短表，避免 Base64 主规则继续贴边',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-log-rules.mjs',
    maxLines: 30,
    reason: 'Scheme 日志字段预算规则应保持短表，新增日志语法规则先按 syntax/types 分层',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-payload-rules.mjs',
    maxLines: 40,
    reason: 'Scheme payload helper 预算规则应保持短表，新增载荷规则先评估主流程拆分',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-query-rules.mjs',
    maxLines: 50,
    reason: 'Scheme query helper 预算规则应保持短表，新增 query 规则先按来源域拆分',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-query-syntax-rules.mjs',
    maxLines: 40,
    reason: 'Scheme query 语法预算规则应保持短表，新增语法 helper 先评估 normalization/pairs 分层',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-structured-decode-rules.mjs',
    maxLines: 40,
    reason: 'Scheme 结构化展开预算规则应独立成短表，避免 payload 规则继续膨胀',
  },
  {
    file: 'scripts/ci/maintainability-budget-scheme-support-token-rules.mjs',
    maxLines: 30,
    reason: 'Scheme token 预算规则应保持短表，新增 JWT/JWS/JWE 规则先独立评估',
  },
];
