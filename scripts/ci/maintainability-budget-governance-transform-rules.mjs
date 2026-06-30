import { governanceTransformPanelMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-rules.mjs';
import { governanceTransformSummaryMaintainabilityBudgets } from './maintainability-budget-governance-transform-summary-rules.mjs';

export const governanceTransformMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-rules.mjs',
    maxLines: 40,
    reason: '深度解析预算规则聚合入口应只负责组合子领域规则',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-core-rules.mjs',
    maxLines: 70,
    reason: '深度解析核心预算规则过多时应继续按子领域拆分',
  },
  ...governanceTransformSummaryMaintainabilityBudgets,
  {
    file: 'scripts/ci/maintainability-budget-transform-filter-rules.mjs',
    maxLines: 40,
    reason: '深度解析筛选预算规则应保持短表，新增筛选 helper 先按 matcher/view 分层',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-placeholder-rules.mjs',
    maxLines: 40,
    reason: '深度解析占位符预算规则应保持短表，新增建议 helper 先拆 builder/rules',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-quality-rules.mjs',
    maxLines: 40,
    reason: '深度解析质量预算规则应独立收口，避免核心规则表继续贴线',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-rules.mjs',
    maxLines: 60,
    reason: '深度解析面板预算规则自身由独立子表收口，避免 transform 治理表继续膨胀',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-section-rules.mjs',
    maxLines: 25,
    reason: '深度解析面板 section 预算治理规则应独立收口，避免 panel 治理表继续膨胀',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-panel-helper-rules.mjs',
    maxLines: 35,
    reason: '深度解析面板 helper 预算治理规则应独立收口，避免 panel 治理表继续膨胀',
  },
  {
    file: 'scripts/ci/maintainability-budget-governance-transform-summary-rules.mjs',
    maxLines: 40,
    reason: '深度解析 summary 预算治理规则应独立收口，避免 transform 治理表继续膨胀',
  },
  ...governanceTransformPanelMaintainabilityBudgets,
];
