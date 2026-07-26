const appTourBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appTourMaintainabilityBudgets = [
  appTourBudget('scripts/ci/maintainability-budget-app-tour-rules.mjs', 15, '引导预算表只维护共享生命周期、业务 Hook 及其直接测试'),
  appTourBudget('frontend/src/utils/driverTourRuntime.ts', 175, '引导运行时只维护全局代次、Driver 所有权、延迟启动和安全清理'),
  appTourBudget('frontend/src/utils/driverTourRuntime.test.ts', 160, '引导运行时测试锁定后发优先、清理、幂等完成、异常与刷新边界'),
  appTourBudget('frontend/src/hooks/useFeatureTour.ts', 315, '功能引导 Hook 只维护功能配置、存储策略、加载和公开命令'),
  appTourBudget('frontend/src/hooks/useFeatureTour.test.ts', 285, '功能引导测试锁定跨实例竞争、卸载隔离、异常和完成状态'),
  appTourBudget('frontend/src/hooks/useFeatureTourPublicApi.test.ts', 105, '功能引导公开接口测试锁定存储、强制启动和刷新语义'),
  appTourBudget('frontend/src/hooks/useOnboardingTour.ts', 180, '首次引导 Hook 只维护完成状态、延迟加载、目标筛选和配置'),
  appTourBudget('frontend/src/hooks/useOnboardingTour.test.ts', 235, '首次引导测试锁定存储、卸载、异常、目标筛选和完成状态'),
];
