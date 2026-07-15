const governanceAiAutomationContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiAutomationContractMaintainabilityBudgets = [
  governanceAiAutomationContractBudget('scripts/ci/maintainability-budget-governance-ai-automation-contract-rules.mjs', 15, 'AI 治理自动化契约预算子表应独立维护 CI、定时 workflow 和显式豁免契约预算'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceCiContract.mjs', 35, 'AI 治理 CI 契约检查应只维护必需治理命令和自动化入口比对'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceCiCommandCollectors.mjs', 25, 'AI 治理 CI 命令收集器应独立维护 GitHub Actions run 块和本地 CI run_in_root 抽取'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceCiCommandDescriptors.mjs', 45, 'AI 治理 CI 命令描述符应单源维护必跑命令和自动化入口测试夹具标签'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceAutomationCommandContract.mjs', 80, 'AI 治理自动化命令契约应单源维护 workflow 结构、required command 可达性、artifact fail-fast 与 outcome 自动写账禁令'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceScheduledWorkflowContract.mjs', 215, 'AI 治理定时 workflow 契约应编排 schedule、固定命令、capture/signer 隔离和 component-only attestation policy'),
  governanceAiAutomationContractBudget('scripts/ci/aiGovernanceExemptAssetContract.mjs', 100, 'AI 治理显式豁免契约应锁定公开豁免内容、私有正文不读取与 Git index/HEAD fail-closed 边界'),
];
