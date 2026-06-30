export const appWorkflowAiMaintainabilityBudgets = [
  {
    file: 'frontend/src/hooks/useAppAiRepairCommand.ts',
    maxLines: 110,
    reason: 'AI 修复命令 hook 只编排引导、懒加载、处理中状态、写回和打点，继续增长时拆出状态机',
  },
  {
    file: 'frontend/src/utils/appAiRepairCommand.ts',
    maxLines: 80,
    reason: 'AI 修复命令 helper 只维护空输入、错误提示和摘要结果组装的纯逻辑',
  },
];
