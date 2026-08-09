const validationBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiValidationMaintainabilityBudgets = [
  validationBudget('scripts/ci/maintainability-budget-governance-ai-validation-rules.mjs', 28, 'Validation 预算子表应只维护权威变更集、固定命令、runtime 与 component executor'),
  validationBudget('scripts/ci/aiGovernanceRequiredValidationFiles.mjs', 25, 'Validation 必需资产子表应只登记 changed-set、registry、runtime、executor、whitespace 与对应测试和 CLI'),
  validationBudget('scripts/ci/aiGovernanceValidationChangedSet.mjs', 460, 'Validation changed-set 应只维护 HEAD、index、worktree 原始字节、Git mode/flag 与稳定 state digest'),
  validationBudget('scripts/ci/aiGovernanceValidationCommandRegistry.mjs', 210, 'Validation command registry 应只维护只读固定 descriptor、测试展开与 descriptor digest'),
  validationBudget('scripts/ci/aiGovernanceValidationRuntimePrimitives.mjs', 45, 'Validation runtime primitives 应只维护平台、路径、身份与摘要单源原语'),
  validationBudget('scripts/ci/aiGovernanceValidationWorkspaceRuntime.mjs', 210, 'Validation workspace runtime 应只维护精确根、仓外 0700 私有目录与安全空目录清理'),
  validationBudget('scripts/ci/aiGovernanceValidationExecutables.mjs', 185, 'Validation executables 应只维护固定发现、路径保护、稳定字节摘要与漂移复核'),
  validationBudget('scripts/ci/aiGovernanceValidationRuntime.mjs', 75, 'Validation command runtime 应只维护闭环境与固定无 shell 启动边界'),
  validationBudget('scripts/ci/aiGovernanceValidationExecution.mjs', 575, 'Validation executor 应只维护零执行 blocker、逐命令前后状态复核、启动尝试计数与 component receipt'),
  validationBudget('scripts/ci/aiGovernanceValidationWhitespace.mjs', 405, 'Validation whitespace helper 应只比较三视图原始字节并隔离 Git 配置、filter、attribute driver 与临时根'),
  validationBudget('scripts/ci/check-ai-validation-whitespace.mjs', 125, 'Validation whitespace CLI 应只维护严格参数、嵌套闭报告和 component exit code'),
  validationBudget('scripts/ci/run-ai-validation-execution.mjs', 210, 'Validation execution CLI 应默认 preview，只有显式 run 才执行固定命令，并闭合状态机和所有输出字段'),
  validationBudget('scripts/mcp/jsonutils-governance-validation-plan.mjs', 90, 'Validation plan 应只将权威 changed-set 映射为完整命令、人工复核与未分类摘要'),
  validationBudget('scripts/mcp/jsonutils-governance-validation-rules.mjs', 90, 'Validation rules 应单源维护领域分类、只读固定命令与人工复核项'),
];
