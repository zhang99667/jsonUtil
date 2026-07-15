import { governanceAiCodexTrialMaintainabilityBudgets } from './maintainability-budget-governance-ai-codex-trial-rules.mjs';
import { governanceAiEvolutionLearningMaintainabilityBudgets } from './maintainability-budget-governance-ai-evolution-learning-rules.mjs';
import { governanceAiEvolutionPairedMaintainabilityBudgets } from './maintainability-budget-governance-ai-evolution-paired-rules.mjs';
import { governanceAiEvolutionRunnerMaintainabilityBudgets } from './maintainability-budget-governance-ai-evolution-runner-rules.mjs';
import { governanceAiValidationMaintainabilityBudgets } from './maintainability-budget-governance-ai-validation-rules.mjs';
const evolutionBudget = (file, maxLines, reason) => ({ file, maxLines, reason });
export const governanceAiEvolutionMaintainabilityBudgets = [
  evolutionBudget('scripts/ci/maintainability-budget-governance-ai-evolution-rules.mjs', 45, 'AI evolution 预算子表应只维护 corpus、receipt、trace、outcome 与 replay 数据面'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionCodexCaseDescriptors.mjs', 25, 'Coding-agent evolution case descriptors 应只按固定顺序组合已分组 case，并经唯一 ID registry fail closed'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeHistory.mjs', 45, 'AI evolution outcome 历史 helper 应只区分 latest、superseded、stale 和 invalid 记录'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeContract.mjs', 220, 'AI evolution outcome contract 应只维护闭字段、provenance、feedback、evidence、writeback 与 validation 契约'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeLedger.mjs', 180, 'AI evolution outcome ledger 应只编排稳定有界 JSONL source、物理顺序、chain、日期单调性与 ID 唯一性'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeChain.mjs', 140, 'AI evolution outcome chain 应只维护 legacy 锚、sequence/hash、supersession 与反馈处置'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeEvidence.mjs', 120, 'AI evolution outcome evidence 应只维护 receipt 绑定、固定/trace 路由与安全路径契约'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionSensitiveData.mjs', 70, 'AI evolution 隐私扫描叶子应只维护有界迭代扫描与固定无值敏感字段/值诊断'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeReplay.mjs', 95, 'AI evolution fixed replay 应保留单一顺序状态机，只重放 receipt v1 deterministic-case 并精确比较结果'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionDeterministicOutcomeWriter.mjs', 510, 'AI evolution deterministic writer 应只编排固定 runner、安全 ledger snapshot、候选重放与事务提交'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionDeterministicOutcomeTransaction.mjs', 470, 'AI evolution deterministic transaction 应只维护协作锁、journal、持久追加与崩溃恢复'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionOutcomeRecoveryResult.mjs', 55, 'AI evolution recovery result helper 应只维护闭字段 mutation 投影与跨 writer 语义校验'),
  evolutionBudget('scripts/ci/record-ai-evolution-deterministic-outcomes.mjs', 120, 'AI evolution deterministic outcome CLI 应只维护 preview-first 参数与稳定输出契约'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionUnverifiedTraceObservationContract.mjs', 110, 'AI evolution unverified trace observation contract 应只维护有界紧凑输入、闭字段、隐私与标准化'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionUnverifiedTraceOutcomeWriter.mjs', 470, 'AI evolution unverified trace writer 应只维护派生 receipt/outcome、preview 稳定性、零 confirmed 污染与共享事务提交'),
  evolutionBudget('scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs', 120, 'AI evolution unverified trace CLI 应只维护 bounded strict UTF-8 stdin、preview-first 参数与稳定输出'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionLedgerIntegrity.mjs', 100, 'AI evolution 账本完整性 helper 应只比较 Git 基线与当前 JSONL 严格前缀'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionWorktreeRevision.mjs', 85, 'AI evolution revision helper 应生成排除 evidence ledger 的完整工作树摘要'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionTrialReceipts.mjs', 280, 'AI evolution receipt helper 应兼容 v1-v3，并把 v4 路由到 paired verifier 且拒绝 nonce/proof 重放'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionTrace.mjs', 310, 'AI evolution trace 契约应维护闭字段事件、隐私、完整性与 adapter 信任分层'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionTraceOutcomes.mjs', 110, 'AI evolution trace outcome helper 应只绑定 case/policy/proof、paired v4 与执行完整性'),
  evolutionBudget('scripts/ci/aiGovernanceEvolutionTracePolicies.mjs', 225, 'AI evolution trace policy 应整体维护 MCP/Skill typed contract、canonical source 绑定、能力断言与 digest registry'),
  ...governanceAiEvolutionRunnerMaintainabilityBudgets, ...governanceAiEvolutionLearningMaintainabilityBudgets,
  ...governanceAiEvolutionPairedMaintainabilityBudgets,
  ...governanceAiCodexTrialMaintainabilityBudgets,
  ...governanceAiValidationMaintainabilityBudgets,
  ...[
    ['scripts/ci/aiGovernanceRequiredEvolutionFiles.mjs', 60, 'AI evolution 必需资产清单应只组合 runner、writer、trace/framing、proof、runtime probe 与对应测试'],
    ['scripts/ci/aiGovernanceEvolutionTraceProof.mjs', 330, 'AI evolution trace proof 应只维护 DSSE/in-toto 绑定、Ed25519 签名与外部信任校验'],
  ].map(args => evolutionBudget(...args)),
];
