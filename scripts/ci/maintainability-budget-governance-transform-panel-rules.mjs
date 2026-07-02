import { governanceTransformPanelHelperMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-helper-rules.mjs';
import { governanceTransformPanelSectionMaintainabilityBudgets } from './maintainability-budget-governance-transform-panel-section-rules.mjs';

export const governanceTransformPanelMaintainabilityBudgets = [
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-rules.mjs',
    maxLines: 40,
    reason: '深度解析面板预算规则聚合入口应只负责组合子领域规则',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-component-rules.mjs',
    maxLines: 40,
    reason: '深度解析面板组件预算规则应保持短表，新增组件需先评估主面板拆分收益',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-shell-component-rules.mjs',
    maxLines: 25,
    reason: '深度解析面板壳组件预算规则应独立收口，避免组件预算总表回涨',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-record-section-rules.mjs',
    maxLines: 45,
    reason: '深度解析展开记录预算规则应独立收口，允许头部、标签、路径和预览组件在子表内集中治理',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-panel-record-path-rules.mjs',
    maxLines: 35,
    reason: '深度解析展开记录路径预算规则应独立收口，避免 record-section 规则表回涨',
  },
  ...governanceTransformPanelSectionMaintainabilityBudgets,
  ...governanceTransformPanelHelperMaintainabilityBudgets,
  {
    file: 'scripts/ci/maintainability-budget-transform-report-rules.mjs',
    maxLines: 60,
    reason: '深度解析报告 UI 预算规则过多时应继续按子领域拆分',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-report-issue-rules.mjs',
    maxLines: 30,
    reason: '深度解析报告问题样本预算规则应保持短表，新增 issue helper 先评估职责边界',
  },
  {
    file: 'scripts/ci/maintainability-budget-transform-report-issue-collector-rules.mjs',
    maxLines: 20,
    reason: '深度解析报告问题样本 collector 预算规则应保持短表，不承载其他 issue helper',
  },
];
