const governanceAiCoreSupportTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCoreSupportTestMaintainabilityBudgets = [
  governanceAiCoreSupportTestBudget('scripts/ci/maintainability-budget-governance-ai-core-support-test-rules.mjs', 25, 'AI 治理核心支撑测试预算子表应独立维护 fixture、CLI、日期、可达性和 artifact 测试预算'),
  governanceAiCoreSupportTestBudget('scripts/ci/aiGovernanceTestFixtures.mjs', 70, 'AI 治理测试 fixture 应独立维护临时目录、注册表表格构造和常用失败收集脚手架'),
  governanceAiCoreSupportTestBudget('scripts/ci/aiGovernanceCliOutput.test.mjs', 55, 'AI 治理 CLI 输出测试应独立维护 JSON 成功摘要和失败分组断言'),
  governanceAiCoreSupportTestBudget('scripts/ci/aiGovernanceDateBounds.test.mjs', 70, 'AI 治理日期边界测试应独立维护未来日期、资产注册表和决策账本负例'),
  governanceAiCoreSupportTestBudget('scripts/ci/aiGovernanceIsoDate.test.mjs', 25, 'AI 治理日期 helper 测试应独立维护闰年、月日边界和格式负例'),
  governanceAiCoreSupportTestBudget('scripts/ci/aiGovernanceScriptReachability.test.mjs', 20, 'AI 治理脚本可达性测试应独立维护孤儿 helper 负例'),
  governanceAiCoreSupportTestBudget('scripts/ci/aiGovernanceScriptReachabilityImportGraph.test.mjs', 42, 'AI 治理脚本可达性 import 图测试应独立维护生产链路和测试支撑负例'),
  governanceAiCoreSupportTestBudget('scripts/ci/aiGovernanceScriptReachabilityReport.test.mjs', 25, 'AI 治理脚本可达性报告测试应独立维护完整治理报告聚合负例'),
  governanceAiCoreSupportTestBudget('scripts/ci/aiGovernanceCodexProjectContractFailures.test.mjs', 35, 'Codex 项目契约失败聚合测试应锁定 profile 到 skill source 的连续顺序'),
  governanceAiCoreSupportTestBudget('scripts/ci/writeAiGovernanceArtifactTestFixtures.mjs', 60, 'AI 治理产物测试 fixture 应独立维护临时项目和包含 behavior eval 的固定报告脚手架'),
  governanceAiCoreSupportTestBudget('scripts/ci/writeAiGovernanceArtifactSummary.test.mjs', 45, 'AI 治理产物 summary 测试应独立锁定行为评测覆盖与 Step Summary 文本契约'),
  governanceAiCoreSupportTestBudget('scripts/ci/write-ai-governance-artifacts-freshness.test.mjs', 55, 'AI 治理产物 freshness 测试应锁定 generatedAt、报告和 receipt/outcome ledger 变更负例'),
  governanceAiCoreSupportTestBudget('scripts/ci/write-ai-governance-artifacts.test.mjs', 90, 'AI 治理产物脚本测试应锁定固定报告、context、summary 与 attestation subject 字节摘要'),
  governanceAiCoreSupportTestBudget('scripts/ci/aiGovernanceChecks.test.mjs', 620, 'AI 治理集成测试应只维护规则构造、最小合格仓库 fixture 和完整报告边界'),
  governanceAiCoreSupportTestBudget('scripts/ci/aiGovernanceChecksUnit.test.mjs', 125, 'AI 治理基础单元测试应独立维护缺文件、CI 命令、发现集合、skill 缺失和 lint 负例'),
];
