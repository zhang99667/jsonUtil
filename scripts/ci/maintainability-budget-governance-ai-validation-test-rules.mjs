const validationTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiValidationTestMaintainabilityBudgets = [
  validationTestBudget('scripts/ci/maintainability-budget-governance-ai-validation-test-rules.mjs', 22, 'Validation 测试预算子表应只维护 changed-set、registry、runtime、executor、whitespace 与 plan 测试'),
  validationTestBudget('scripts/ci/aiGovernanceValidationChangedSet.test.mjs', 260, 'Validation changed-set 测试应锁定 Git flag、mode、symlink、filter、ignore、原始摘要与精确根负例'),
  validationTestBudget('scripts/ci/aiGovernanceValidationCommandRegistry.test.mjs', 250, 'Validation registry 测试应锁定固定命令、descriptor digest 与测试文件 ignore/symlink/hardlink 边界'),
  validationTestBudget('scripts/ci/aiGovernanceValidationRuntime.test.mjs', 290, 'Validation runtime 测试应锁定平台 fail-closed、根、环境、可执行摘要、0700 runtime、漂移与非递归清理'),
  validationTestBudget('scripts/ci/aiGovernanceValidationExecution.test.mjs', 430, 'Validation executor 测试应锁定零执行 blocker、逐启动漂移、尝试计数、integrity、CLI 状态机与 component 声明'),
  validationTestBudget('scripts/ci/aiGovernanceValidationWhitespace.test.mjs', 300, 'Validation whitespace 测试应锁定三视图、filter/attribute 隔离、ambient 劫持、大文件与嵌套闭 CLI'),
  validationTestBudget('scripts/mcp/jsonutils-governance-validation-plan.test.mjs', 175, 'Validation plan 测试应锁定领域分类、全量边界、只读命令、人工复核与 hygiene 非分类语义'),
];
