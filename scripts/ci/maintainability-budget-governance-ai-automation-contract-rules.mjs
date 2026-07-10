const governanceAiAutomationContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiAutomationContractMaintainabilityBudgets = [
  governanceAiAutomationContractBudget('scripts/ci/maintainability-budget-governance-ai-automation-contract-rules.mjs', 15, 'AI 治理自动化契约预算子表应独立维护 CI、定时 workflow 和显式豁免契约预算'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceCiContract.mjs', 25, 'AI 治理 CI 契约检查应只维护必需治理命令和自动化入口比对'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceCiCommandCollectors.mjs', 25, 'AI 治理 CI 命令收集器应独立维护 GitHub Actions run 块和本地 CI run_in_root 抽取'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceCiCommandDescriptors.mjs', 45, 'AI 治理 CI 命令描述符应单源维护必跑命令和自动化入口测试夹具标签'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceScheduledWorkflowContract.mjs', 50, 'AI 治理定时 workflow 契约应只维护 schedule、固定命令和 artifact 上传边界'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceExemptAssetContract.mjs', 35, 'AI 治理显式豁免契约应只维护本机配置不得承载共享规则的边界'),
];
