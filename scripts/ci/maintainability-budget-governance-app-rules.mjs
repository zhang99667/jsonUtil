import { governanceAppEditorMaintainabilityBudgets } from './maintainability-budget-governance-app-editor-rules.mjs';

export const governanceAppMaintainabilityBudgets = [
  ...governanceAppEditorMaintainabilityBudgets,
  {
    file: 'scripts/ci/maintainability-budget-app-action-panel-rules.mjs',
    maxLines: 65,
    reason: 'App 工具栏预算规则应保持短表，新增工具栏子模块先拆配置或图标预算',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-rules.mjs',
    maxLines: 40,
    reason: 'App 预算规则聚合入口应只负责组合子领域规则',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-core-rules.mjs',
    maxLines: 40,
    reason: 'App 主入口和交互边界预算规则应保持短表',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-component-rules.mjs',
    maxLines: 40,
    reason: 'App 展示组件预算规则应保持短表，避免混入主入口和工作流预算',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-recovery-rules.mjs',
    maxLines: 25,
    reason: 'App 发布恢复预算入口应只组合运行时恢复和版本检测子表',
  },
  { file: 'scripts/ci/maintainability-budget-app-recovery-runtime-rules.mjs', maxLines: 40, reason: 'App 发布恢复运行时预算规则应保持短表，继续增长时按事件监听和 UI 兜底拆分' },
  { file: 'scripts/ci/maintainability-budget-app-recovery-update-rules.mjs', maxLines: 20, reason: 'App 发布恢复版本检测预算入口应只组合 core 和 schedule 子表' },
  { file: 'scripts/ci/maintainability-budget-app-recovery-update-core-rules.mjs', maxLines: 35, reason: 'App 发布恢复版本检测核心预算规则应维护 hook、策略、决策和执行器预算' },
  { file: 'scripts/ci/maintainability-budget-app-recovery-update-schedule-rules.mjs', maxLines: 20, reason: 'App 发布恢复版本检测调度预算规则应只维护调度 helper 预算' },
  {
    file: 'scripts/ci/maintainability-budget-app-shell-rules.mjs',
    maxLines: 25,
    reason: 'App shell 预算规则应只维护工作台外壳组件预算，继续增长时按侧栏/编辑区拆分',
  },
  {
    file: 'scripts/ci/maintainability-budget-app-status-rules.mjs',
    maxLines: 30,
    reason: 'App 状态栏预算规则应保持短表，状态栏继续增长时按状态域拆分',
  },
  { file: 'scripts/ci/maintainability-budget-app-workflow-rules.mjs', maxLines: 25, reason: 'App 工作流预算聚合入口应只组合动作域、状态和支撑子表' },
  { file: 'scripts/ci/maintainability-budget-app-workflow-ai-rules.mjs', maxLines: 30, reason: 'App AI 修复预算规则应保持短表，新增 AI 工作流 helper 先按 hook/helper 分层' },
  { file: 'scripts/ci/maintainability-budget-app-workflow-command-rules.mjs', maxLines: 30, reason: 'App 命令工作流预算规则应保持短表，新增命令继续按动作域拆分' },
  { file: 'scripts/ci/maintainability-budget-app-workflow-save-rules.mjs', maxLines: 30, reason: 'App 保存工作流预算规则应保持短表，保存命令继续增长时按计划/执行拆分' },
  { file: 'scripts/ci/maintainability-budget-app-workflow-source-rules.mjs', maxLines: 30, reason: 'App SOURCE 替换预算规则应保持短表，新增替换 helper 先按入口/core 分层' },
  { file: 'scripts/ci/maintainability-budget-app-workflow-state-rules.mjs', maxLines: 30, reason: 'App 状态派生预算规则应保持短表，新增状态 helper 先按异步/编辑区分层' },
  { file: 'scripts/ci/maintainability-budget-app-workflow-state-helper-rules.mjs', maxLines: 25, reason: 'App 状态 helper 预算规则应承接 PREVIEW 同步和懒加载 loaded 等专用 hook/helper' },
  { file: 'scripts/ci/maintainability-budget-app-workflow-support-rules.mjs', maxLines: 35, reason: 'App 工作流支撑 helper 预算规则应保持短表，新增建议或文案 helper 先按领域分层' },
  {
    file: 'scripts/ci/maintainability-budget-governance-app-rules.mjs',
    maxLines: 65,
    reason: 'App 预算治理规则应只列子表自身预算，继续增长时按 App 子域拆分',
  },
];
