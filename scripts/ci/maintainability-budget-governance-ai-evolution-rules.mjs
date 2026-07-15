import { governanceAiCodexTrialMaintainabilityBudgets } from './maintainability-budget-governance-ai-codex-trial-rules.mjs';
import { governanceAiEvolutionLearningMaintainabilityBudgets } from './maintainability-budget-governance-ai-evolution-learning-rules.mjs';
const evolutionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiEvolutionMaintainabilityBudgets = [
  evolutionBudget('scripts/ci/maintainability-budget-governance-ai-evolution-rules.mjs', 32, 'AI evolution 预算子表应只维护 corpus、receipt、trace、outcome 与 replay 数据面'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionCaseRunner.mjs', 245, 'AI evolution case runner 应只维护固定白名单、版本绑定、安全目录展开和有界执行报告'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionCodexCaseDescriptors.mjs', 70, 'Codex evolution case descriptors 应只维护 component case 的版本、证据与包含项目插件互操作的固定测试映射'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeHistory.mjs', 45, 'AI evolution outcome 历史 helper 应只区分 latest、superseded、stale 和 invalid 记录'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeLedger.mjs', 180, 'AI evolution outcome ledger 应维护 provenance、feedback、evidence scope 和 validation 契约'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeChain.mjs', 140, 'AI evolution outcome chain 应只维护 legacy 锚、sequence/hash、supersession 与反馈处置'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeEvidence.mjs', 120, 'AI evolution outcome evidence 应只维护 receipt 绑定、固定/trace 路由与安全路径契约'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeReplay.mjs', 75, 'AI evolution fixed replay 应只重放 receipt v1 deterministic-case 并精确比较结果'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.mjs', 510, 'AI evolution deterministic writer 应只编排固定 runner、安全 ledger snapshot、候选重放与事务提交'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs', 470, 'AI evolution deterministic transaction 应只维护协作锁、journal、持久追加与崩溃恢复'),
  evolutionBudget('scripts/ci/record-ai-evolution-deterministic-outcomes.mjs', 120, 'AI evolution deterministic outcome CLI 应只维护 preview-first 参数与稳定输出契约'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.mjs', 470, 'AI evolution unverified trace writer 应只维护闭字段 observation、派生 receipt/outcome、零 confirmed 污染与共享事务提交'),
  evolutionBudget('scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs', 120, 'AI evolution unverified trace CLI 应只维护 bounded stdin、preview-first 参数与稳定输出'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionLedgerIntegrity.mjs', 100, 'AI evolution 账本完整性 helper 应只比较 Git 基线与当前 JSONL 严格前缀'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionWorktreeRevision.mjs', 85, 'AI evolution revision helper 应生成排除 evidence ledger 的完整工作树摘要'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionTrialReceipts.mjs', 230, 'AI evolution receipt helper 应维护 compact JSONL、v1/v2/v3、trace proof 与固定 runner 契约'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionTrace.mjs', 310, 'AI evolution trace 契约应维护闭字段事件、隐私、完整性与 adapter 信任分层'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionTraceOutcomes.mjs', 80, 'AI evolution trace outcome helper 应只绑定 case/policy/proof 与执行完整性'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionTracePolicies.mjs', 150, 'AI evolution trace policy 应只维护固定 case/adapter/能力断言与 digest registry'),
  ...governanceAiEvolutionLearningMaintainabilityBudgets,
  ...governanceAiCodexTrialMaintainabilityBudgets,
  ...[
    ['scripts/ci/aiGovernanceRequiredEvolutionFiles.mjs', 48, 'AI evolution 必需资产清单应只组合 runner、writer、trace、proof、runtime probe 与对应测试'],
    ['scripts/ci/aiGovernanceEvolutionTraceProof.mjs', 330, 'AI evolution trace proof 应只维护 DSSE/in-toto 绑定、Ed25519 签名与外部信任校验'],
  ].map(args => evolutionBudget(...args)),
];
