import { buildEvolutionCurrentRunFocus } from './aiGovernanceEvolutionCaseFailure.mjs';
const uniqueCaseIds = outcomes => [...new Set(outcomes.map(item => item.caseId).filter(Boolean))];
const prioritizeUncoveredCases = (caseIds, tracePolicyCaseIds) => {
  const policyCaseIds = new Set(tracePolicyCaseIds);
  return [
    ...caseIds.filter(id => policyCaseIds.has(id)),
    ...caseIds.filter(id => !policyCaseIds.has(id)),
  ];
};

export const countEvolutionVerdicts = (outcomes, verdict) => (
  outcomes.filter(item => item.verdict === verdict).length
);

export const buildEvolutionNextFocus = ({
  failures = [], contractFailures = failures, currentRunFailures = [], currentRunIssues = [], evidenceFreshness,
  currentRunVerifiedCaseIds = [], outcomes, unverifiedOutcomes, traceBoundUnverifiedOutcomes = [],
  uncoveredCaseIds, tracePolicyCaseIds = [], ledgerChain,
}) => {
  const prioritizedUncoveredCaseIds = prioritizeUncoveredCases(uncoveredCaseIds, tracePolicyCaseIds);
  if (contractFailures.length > 0) return { id: 'repair-eval-contract', nextAction: contractFailures[0], caseIds: [] };
  const currentRunFocus = buildEvolutionCurrentRunFocus(currentRunIssues);
  if (currentRunFocus) return currentRunFocus;
  if (currentRunFailures.length > 0) return { id: 'repair-current-deterministic-run', nextAction: currentRunFailures[0], caseIds: [] };
  if (evidenceFreshness?.status === 'stale') return { id: 'refresh-stale-deterministic-evidence',
    nextAction: '当前 fixed runner 已通过，但 confirmed outcome 仍绑定旧 source；冻结 source 后先 preview，再由维护者显式刷新账本',
    caseIds: currentRunVerifiedCaseIds.slice(0, 3) };
  const weakOutcomes = outcomes.filter(item => ['fail', 'partial'].includes(item.verdict));
  if (weakOutcomes.length > 0) return {
    id: 'address-outcome-feedback',
    nextAction: '先处理 fail/partial 的 feedback，再决定是否回写规则或 skill',
    caseIds: uniqueCaseIds(weakOutcomes).slice(0, 3),
  };
  if (traceBoundUnverifiedOutcomes.length > 0) return {
    id: 'verify-agent-trace',
    nextAction: '为 trace-bound outcome 接入固定 policy 与可信 host adapter；验证前不计入行为分数',
    caseIds: uniqueCaseIds(traceBoundUnverifiedOutcomes).slice(0, 3),
  };
  if (unverifiedOutcomes.length > 0) return {
    id: 'verify-nondeterministic-outcome',
    nextAction: '复核 model/human/hybrid 的 fail/partial feedback；验证前不计入行为分数',
    caseIds: uniqueCaseIds(unverifiedOutcomes).slice(0, 3),
  };
  if (outcomes.length === 0) return {
    id: 'record-first-outcomes',
    nextAction: '按真实执行结果记录首批 outcome，不补造历史成绩',
    caseIds: prioritizedUncoveredCaseIds.slice(0, 3),
  };
  if (ledgerChain?.status !== 'pass') return {
    id: 'establish-outcome-chain',
    nextAction: '追加首个 v3 outcome，锚定 legacy 前缀并显式声明同 lineage 前驱',
    caseIds: uniqueCaseIds(outcomes).slice(0, 3),
  };
  if (uncoveredCaseIds.length > 0) return {
    id: 'increase-outcome-coverage',
    nextAction: '优先执行尚无 outcome 的代表性 case',
    caseIds: prioritizedUncoveredCaseIds.slice(0, 3),
  };
  return { id: 'maintain-eval-signal', nextAction: '保持真实 outcome 记录，并定期复核 corpus 代表性', caseIds: [] };
};
