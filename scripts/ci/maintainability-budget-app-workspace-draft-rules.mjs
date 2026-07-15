const workspaceDraftBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appWorkspaceDraftMaintainabilityBudgets = [
  workspaceDraftBudget('frontend/src/utils/workspaceDraft.ts', 175, '工作区草稿 helper 只维护快照规范化、容量预算和不破坏最后成功快照的存储边界'),
  workspaceDraftBudget('frontend/src/utils/workspaceDraft.test.ts', 175, '工作区草稿测试只锁定构建、解析、容量边界和最后成功快照保留'),
];
