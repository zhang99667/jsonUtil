const updateCoreBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appRecoveryUpdateCoreMaintainabilityBudgets = [
  updateCoreBudget('frontend/src/utils/appUpdatePolicy.ts', 30, '新版本检测策略应保持少量常量，便于单测锁定发布恢复窗口'),
  updateCoreBudget('frontend/src/hooks/useAppUpdateCheck.tsx', 85, '新版本检测 hook 应只负责 Toast、manifest 拉取和检查器装配，触发调度拆到独立 helper'),
  updateCoreBudget('frontend/src/hooks/useAdminReleaseRecovery.ts', 25, '后台发布恢复 hook 应只组合主动版本检测和动态 chunk 失效恢复'),
  updateCoreBudget('frontend/src/utils/appVersion.ts', 75, '应用版本工具只维护清单边界、成熟 SemVer 校验比较和静态版本元数据'),
  updateCoreBudget('frontend/src/utils/appVersion.test.ts', 75, '应用版本测试只锁定规范化、SemVer 优先级、非法清单与缓存边界'),
  updateCoreBudget('frontend/src/utils/appUpdateCheckDecision.ts', 45, '新版本检测决策应保持纯活跃态、版本和去重判断，不夹带 Hook 副作用'),
  updateCoreBudget('frontend/src/utils/appUpdateCheckEffects.tsx', 45, '新版本检测浏览器副作用应只维护 Toast 展示和 manifest 拉取'),
  updateCoreBudget('frontend/src/utils/appUpdateCheckEffects.test.tsx', 80, '新版本检测副作用测试只锁定 Toast 装配和 manifest 请求'),
  updateCoreBudget('frontend/src/utils/appUpdateCheckRunner.ts', 55, '新版本单次检查执行器应保持请求、解析、二次活跃态检查和通知分发的薄编排'),
  updateCoreBudget('frontend/src/utils/appUpdateCheckRunnerTypes.ts', 25, '新版本单次检查输入契约应独立维护，避免执行器被类型声明撑大'),
];
