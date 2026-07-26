const settingsModalBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appSettingsModalMaintainabilityBudgets = [
  settingsModalBudget('scripts/ci/maintainability-budget-app-settings-modal-rules.mjs', 15, '设置弹窗预算表只维护弹窗、AI 配置 Hook、快捷键模型及其直接测试预算'),
  settingsModalBudget('frontend/src/components/UnifiedSettingsModal.tsx', 640, '设置弹窗只编排设置页渲染与交互，AI 配置生命周期和快捷键规则必须留在独立边界'),
  settingsModalBudget('frontend/src/hooks/useUnifiedSettingsAIConfig.ts', 140, '设置弹窗 AI 配置 Hook 只维护草稿同步、校验、连接测试和请求失效控制'),
  settingsModalBudget('frontend/src/hooks/useUnifiedSettingsAIConfig.test.ts', 335, '设置弹窗 AI 配置 Hook 测试只锁定同步、取消、校验、异步结果和分块恢复边界'),
  settingsModalBudget('frontend/src/components/UnifiedSettingsShortcutModel.ts', 125, '设置快捷键纯模型只维护录制输入、冲突判断、有序更新和展示标签'),
  settingsModalBudget('frontend/src/components/UnifiedSettingsShortcutModel.test.ts', 205, '设置快捷键模型测试只锁定忽略、清除、绑定、批量冲突更新顺序和展示边界'),
];
