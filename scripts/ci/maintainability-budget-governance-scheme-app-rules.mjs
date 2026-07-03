import { governanceSchemeSupportMaintainabilityBudgets } from './maintainability-budget-governance-scheme-support-rules.mjs';

const schemeAppGovernanceBudget = (file, maxLines, reason) => ({
  file: `scripts/ci/${file}`,
  maxLines,
  reason,
});

export const governanceSchemeAppMaintainabilityBudgets = [
  schemeAppGovernanceBudget('maintainability-budget-scheme-app-rules.mjs', 40, 'Scheme 与主应用预算规则聚合入口应只负责组合子领域规则'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-rules.mjs', 40, 'Scheme 预算规则聚合入口应只负责组合子领域规则'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-viewer-rules.mjs', 70, 'Scheme 弹窗预算规则入口应只聚合组件与支撑子表'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-viewer-component-rules.mjs', 30, 'Scheme 弹窗组件预算规则入口应只聚合 shell/command/detail 子表'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-viewer-shell-component-rules.mjs', 65, 'Scheme 弹窗 shell 组件预算规则应保持短表，新增主容器或一级展示区优先归组'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-viewer-shell-test-rules.mjs', 20, 'Scheme 弹窗 shell 测试预算入口只负责聚合 footer 与支撑测试子表'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-viewer-shell-footer-test-rules.mjs', 40, 'Scheme 弹窗 shell Footer 测试预算规则应只治理底部外壳、动作列表测试和共享 fixture'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-viewer-shell-support-test-rules.mjs', 35, 'Scheme 弹窗 shell 支撑测试预算规则应只治理测试 helper 与独立面板测试'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-viewer-command-component-rules.mjs', 35, 'Scheme 弹窗 CMD 组件预算规则应保持短表，schema、参数和内部线索 badge 分开治理'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-viewer-detail-component-rules.mjs', 45, 'Scheme 弹窗详情组件预算规则应保持短表，新增诊断细节面板优先归组'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-viewer-diagnostics-component-rules.mjs', 25, 'Scheme 诊断组件预算规则应独立成短表，避免详情规则表继续贴线'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-viewer-support-rules.mjs', 60, 'Scheme 弹窗支撑预算规则应保持短表，worker、helper 和 helper 测试规则继续和组件规则分开治理'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-core-rules.mjs', 40, 'Scheme 核心预算规则应保持短表，新增核心债务需优先拆解'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-core-param-rules.mjs', 25, 'Scheme 参数分层预算规则应保持短表，允许 builder/pair/source 三个核心入口并列治理'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-core-helper-rules.mjs', 35, 'Scheme 核心 helper 预算规则应独立成短表，避免核心规则表继续贴边'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-support-viewer-rules.mjs', 55, 'Scheme Viewer 支撑预算规则应只治理弹窗诊断门面、摘要和展示 helper'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-cmd-rules.mjs', 15, 'CMD 结构预算规则入口应只聚合 diff/value 与 candidate/raw 子表'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-cmd-candidate-rules.mjs', 25, 'CMD candidate/raw 预算规则应保持短表，新增 raw 解码 helper 优先归组'),
  schemeAppGovernanceBudget('maintainability-budget-scheme-cmd-diff-rules.mjs', 30, 'CMD diff/value 预算规则应保持短表，格式化、路径和值 diff 继续并列治理'),
  ...governanceSchemeSupportMaintainabilityBudgets,
];
