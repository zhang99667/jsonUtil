import { governanceAiCodexTrialTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-codex-trial-test-rules.mjs';
import { governanceAiEvolutionLearningTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-evolution-learning-test-rules.mjs';
import { governanceAiEvolutionPairedTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-evolution-paired-test-rules.mjs';
import { governanceAiValidationTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-validation-test-rules.mjs';

const evolutionTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiEvolutionTestMaintainabilityBudgets = [
  evolutionTestBudget('scripts/ci/maintainability-budget-governance-ai-evolution-test-rules.mjs', 45, 'AI evolution 测试预算子表应只编排 corpus、learning、receipt、trace、outcome 与 replay 测试预算'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionEval.test.mjs', 90, 'AI evolution 基础 eval 集成测试应锁定报告 schema、覆盖计数与 component-boundary 黄金顺序'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionEvalContract.test.mjs', 150, 'AI evolution corpus 契约测试应锁定稳定有界读取、六层闭字段、无值诊断、版本和隐私边界'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionSuiteCli.test.mjs', 40, 'AI evolution suite CLI 测试应只锁定人读/JSON 退出码、账本链与 focus 投影'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionEvalProjection.test.mjs', 210, 'AI evolution eval 投影测试应锁定机器 schema、引用身份、插入顺序与 failure/freshness 分层'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionCorpusSize.test.mjs', 60, 'AI evolution corpus 容量测试应锁定可增长上限与超限失败'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcome.test.mjs', 190, 'AI evolution outcome 测试应锁定 provenance、feedback、证据和 validation 一致性'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcomeLedgerSource.test.mjs', 190, 'AI evolution outcome source 测试应锁定稳定普通文件、严格 UTF-8、资源上限、紧凑 JSON、物理 ordinal 与无值诊断'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcomeLineage.test.mjs', 215, 'AI evolution lineage 测试应锁定 latest、stale、future、retired 与 corpus 语义'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcomeChain.test.mjs', 125, 'AI evolution chain 测试应锁定 legacy 锚、sequence/hash、降级、supersession 与反馈关闭'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.test.mjs', 350, 'AI evolution deterministic writer 测试应锁定 preview、派生字段、漂移拒绝、幂等与真实本地事务'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.test.mjs', 300, 'AI evolution deterministic transaction 测试应锁定 lock/journal 所有权、恢复状态机与 fail-closed 边界'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcomeRecoveryResult.test.mjs', 65, 'AI evolution recovery result 测试应锁闭字段、逐 ledger mutation、合法组合与不可能状态拒绝'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionUnverifiedTraceObservationContract.test.mjs', 100, 'AI evolution unverified trace observation 测试应锁定闭字段、隐私、event 稠密连续、紧凑 JSON 与双层字节上限'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.test.mjs', 250, 'AI evolution unverified trace writer 测试应锁定零 confirmed 污染、幂等、preview 稳定性、supersession、CI 禁写与共享事务'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriterTestFixtures.mjs', 60, 'AI evolution unverified writer fixture 应只构造固定脱敏 observation 与版本常量'),
  evolutionTestBudget('scripts/ci/record-ai-evolution-unverified-trace-outcome.test.mjs', 90, 'AI evolution unverified writer CLI 测试应锁定参数、stdin、输出与 raw-byte UTF-8 失败'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcomeEvidence.test.mjs', 410, 'AI evolution outcome evidence 测试应锁定 v1/v2/v3 receipt、hash、replay、realpath 与 symlink'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionSensitiveData.test.mjs', 60, 'AI evolution 隐私扫描测试应锁定无值诊断、深度/节点上限与循环引用终止'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionLedgerIntegrity.test.mjs', 90, 'AI evolution ledger 测试应锁定追加通过、删改重排失败和缺基线 unknown'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionWorktreeRevision.test.mjs', 70, 'AI evolution revision 测试应锁定 source-state v2、ledger-only HEAD/Git 阶段稳定性与 active 绑定'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionOutcomeReplay.test.mjs', 210, 'AI evolution replay 测试应锁定筛选、时效分层、runner 四类闭字段异常、binding 与精确 mismatch taxonomy'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTrialReceipts.test.mjs', 310, 'AI evolution receipt 测试应锁定 v1/v2/v3、紧凑 JSONL、trace proof、敏感值与 trial 边界'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTrace.test.mjs', 180, 'AI evolution trace 测试应锁定闭字段、事件图、隐私、完整性与 adapter 信任'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTraceOutcomes.test.mjs', 150, 'AI evolution trace outcome 测试应锁定外部 proof、执行事实、policy 与 digest 漂移'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTraceOutcomeReport.test.mjs', 200, 'AI evolution trace report 测试应锁定 v2 unverified、v3 外部 proof 与 coverage 三层状态'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTracePolicies.test.mjs', 120, 'AI evolution trace policy fixed 测试应锁定 digest、精确工具/结果键/能力/revision 原因与 Skill 选择/必读边界'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTracePolicyContract.test.mjs', 320, 'AI evolution trace policy direct contract 测试应锁 schema/source、Map/descriptor 顺序、MCP/Skill grader 与 wrapper 全分支'),
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTracePolicyTestFixtures.mjs', 45, 'AI evolution trace policy 测试夹具应只构造固定 MCP 与 Skill 事件流'),
  ...governanceAiEvolutionLearningTestMaintainabilityBudgets,
  ...governanceAiEvolutionPairedTestMaintainabilityBudgets,
  ...governanceAiCodexTrialTestMaintainabilityBudgets,
  ...governanceAiValidationTestMaintainabilityBudgets,
  evolutionTestBudget('scripts/ci/aiGovernanceEvolutionTraceProof.test.mjs', 290, 'AI evolution trace proof 测试应锁定规范绑定、未知 signer、篡改、闭字段与非法密钥负例'),
];
