import { governanceAppEditorMaintainabilityBudgets } from './maintainability-budget-governance-app-editor-rules.mjs';
import { governanceAppWorkflowMaintainabilityBudgets } from './maintainability-budget-governance-app-workflow-rules.mjs';

export const governanceAppMaintainabilityBudgets = [
  ...governanceAppEditorMaintainabilityBudgets,
  ...governanceAppWorkflowMaintainabilityBudgets,
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
  { file: 'scripts/ci/maintainability-budget-app-file-close-rules.mjs', maxLines: 25, reason: 'App 文件关闭保护预算规则应维护 hook 和关闭决策 helper 预算' },
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
    maxLines: 15,
    reason: 'App 状态栏预算入口应只组合组件和 helper 子表',
  },
  { file: 'scripts/ci/maintainability-budget-app-status-component-rules.mjs', maxLines: 25, reason: 'App 状态栏组件预算规则应独立维护展示组件预算' },
  { file: 'scripts/ci/maintainability-budget-app-status-helper-rules.mjs', maxLines: 25, reason: 'App 状态栏 helper 预算规则应独立维护状态派生和类型契约预算' },
  { file: 'scripts/ci/maintainability-budget-governance-app-workflow-rules.mjs', maxLines: 55, reason: 'App 工作流预算治理规则应独立维护工作流子表预算' },
  {
    file: 'scripts/ci/maintainability-budget-governance-app-rules.mjs',
    maxLines: 65,
    reason: 'App 预算治理规则应只列子表自身预算，继续增长时按 App 子域拆分',
  },
];
