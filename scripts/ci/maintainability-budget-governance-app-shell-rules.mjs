import { governanceAppJsonPathMaintainabilityBudgets } from './maintainability-budget-governance-app-jsonpath-rules.mjs';

const governanceAppShellBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAppShellMaintainabilityBudgets = [
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-action-panel-rules.mjs', 65, 'App 工具栏预算规则应保持短表，新增工具栏子模块先拆配置或图标预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-rules.mjs', 40, 'App 预算规则聚合入口应只负责组合子领域规则'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-core-rules.mjs', 35, 'App 主入口和交互边界预算规则应保持短表'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-file-system-rules.mjs', 20, 'App 文件系统预算规则应只维护文件系统 hook 和 SOURCE 状态 helper 预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-source-validation-rules.mjs', 15, 'App SOURCE 校验预算规则应只维护 hook、请求 helper 和对应测试预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-interaction-hook-rules.mjs', 20, 'App 交互基础 hook 预算规则应只组合 PREVIEW setter、RAF、telemetry 和 scrollbar 子表'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-interaction-scrollbar-rules.mjs', 15, 'App scrollbar 预算规则应独立维护滚动条 hook、纯 helper、DOM helper 和对应测试预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-telemetry-hook-rules.mjs', 20, 'App telemetry hook 预算规则应只维护打点类 hook 和测试预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-layout-rules.mjs', 45, 'App 布局预算规则应独立维护 controller、底层 hook、resize helper 和共享拖拽监听预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-file-close-rules.mjs', 25, 'App 文件关闭保护预算规则应维护 hook 和关闭决策 helper 预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-component-rules.mjs', 40, 'App 展示组件预算规则应保持短表，避免混入主入口和工作流预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-governance-app-jsonpath-rules.mjs', 20, 'JSONPath 治理预算规则应集中维护 JSONPath 预算文件的治理条目'),
  ...governanceAppJsonPathMaintainabilityBudgets,
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-recovery-rules.mjs', 25, 'App 发布恢复预算入口应只组合运行时恢复和版本检测子表'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-recovery-runtime-rules.mjs', 40, 'App 发布恢复运行时预算规则应保持短表，继续增长时按事件监听和 UI 兜底拆分'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-recovery-update-rules.mjs', 20, 'App 发布恢复版本检测预算入口应只组合 core 和 schedule 子表'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-recovery-update-core-rules.mjs', 35, 'App 发布恢复版本检测核心预算规则应维护 hook、策略、决策和执行器预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-recovery-update-schedule-rules.mjs', 20, 'App 发布恢复版本检测调度规则应只维护调度 helper 预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-shell-rules.mjs', 25, 'App shell 预算规则应只维护工作台外壳组件预算，继续增长时按侧栏/编辑区拆分'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-status-rules.mjs', 15, 'App 状态栏预算入口应只组合组件和 helper 子表'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-status-component-rules.mjs', 25, 'App 状态栏组件预算规则应独立维护展示组件预算'),
  governanceAppShellBudget('scripts/ci/maintainability-budget-app-status-helper-rules.mjs', 25, 'App 状态栏 helper 预算规则应独立维护状态派生和类型契约预算'),
];
