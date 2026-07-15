import { governanceAiCodexTrialTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-codex-trial-test-rules.mjs';
import { governanceAiEvolutionLearningTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-evolution-learning-test-rules.mjs';

const evolutionTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEvolutionTestMaintainabilityBudgets = [
  evolutionTestBudget('scripts/ci/maintainability-budget-governance-ai-evolution-test-rules.mjs', 32, 'AI evolution 测试预算子表应只维护 corpus、receipt、trace、outcome 与 replay 测试'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionEval.test.mjs', 140, 'AI evolution eval 测试应锁定 corpus 覆盖、退休 case、敏感值、重复 ID 和 CLI 输出'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionCorpusSize.test.mjs', 60, 'AI evolution corpus 容量测试应锁定可增长上限与超限失败'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionCaseRunner.test.mjs', 225, 'AI evolution case runner 测试应锁定白名单、版本、证据范围和变更矩阵边界'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcome.test.mjs', 190, 'AI evolution outcome 测试应锁定 provenance、feedback、证据和 validation 一致性'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcomeLineage.test.mjs', 215, 'AI evolution lineage 测试应锁定 latest、stale、future、retired 与 corpus 语义'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcomeChain.test.mjs', 125, 'AI evolution chain 测试应锁定 legacy 锚、sequence/hash、降级、supersession 与反馈关闭'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.test.mjs', 350, 'AI evolution deterministic writer 测试应锁定 preview、派生字段、漂移拒绝、幂等与真实本地事务'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.test.mjs', 300, 'AI evolution deterministic transaction 测试应锁定 lock/journal 所有权、恢复状态机与 fail-closed 边界'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.test.mjs', 300, 'AI evolution unverified trace writer 测试应锁定闭字段输入、零 confirmed 污染、幂等、supersession、CI 禁写与共享事务'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcomeEvidence.test.mjs', 410, 'AI evolution outcome evidence 测试应锁定 v1/v2/v3 receipt、hash、replay、realpath 与 symlink'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionLedgerIntegrity.test.mjs', 90, 'AI evolution ledger 测试应锁定追加通过、删改重排失败和缺基线 unknown'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionWorktreeRevision.test.mjs', 70, 'AI evolution revision 测试应锁定 source-state v2、ledger-only HEAD/Git 阶段稳定性与 active 绑定'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTrialReceipts.test.mjs', 310, 'AI evolution receipt 测试应锁定 v1/v2/v3、紧凑 JSONL、trace proof、敏感值与 trial 边界'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTrace.test.mjs', 180, 'AI evolution trace 测试应锁定闭字段、事件图、隐私、完整性与 adapter 信任'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTraceOutcomes.test.mjs', 150, 'AI evolution trace outcome 测试应锁定外部 proof、执行事实、policy 与 digest 漂移'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTraceOutcomeReport.test.mjs', 190, 'AI evolution trace report 测试应锁定 v2 unverified、v3 外部 proof 与 coverage 三层状态'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTracePolicies.test.mjs', 120, 'AI evolution trace policy 测试应锁定工具、结果键、能力与 revision 负例'),
  ...governanceAiEvolutionLearningTestMaintainabilityBudgets,
  ...governanceAiCodexTrialTestMaintainabilityBudgets,
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTraceProof.test.mjs', 290, 'AI evolution trace proof 测试应锁定规范绑定、未知 signer、篡改、闭字段与非法密钥负例'),
];
