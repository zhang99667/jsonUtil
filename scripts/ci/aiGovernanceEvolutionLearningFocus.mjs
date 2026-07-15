import { CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT } from './aiGovernanceCodexExternalControllerAttestedPreflight.mjs';
import { CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL } from './aiGovernanceCodexExternalControllerSeatbeltSentinel.mjs';

const REGISTRATION_SIGNAL_ID = 'mcp-project-registration-unavailable-20260711';
const REGISTRATION_EXPERIMENT_ID = 'mcp-project-registration-canary';

export const buildProtectedRuntimeBlockedFocus = ({ openSignalIds, experiments }) => {
  const hasRegistrationBlocker = openSignalIds.includes(REGISTRATION_SIGNAL_ID) && experiments.some(item => item.id === REGISTRATION_EXPERIMENT_ID && item.execution?.status === 'blocked');
  return hasRegistrationBlocker ? {
    id: 'provision-protected-attested-verifier-launcher',
    status: 'blocked',
    blockingScope: 'external-provisioning',
    prerequisites: ['external-linux-admin-plane', 'root-owned-digest-pinned-runtime', 'non-caller-runtime-bindings', 'external-signer-witness-state-authority', 'zero-model-adversarial-preflight'],
    nextAction: '等待 checkout 外受保护控制面完成 Linux 管理平面、固定 runtime/bindings 与外部 signer/witness；仓内继续推进不依赖该前置的 behavior coverage',
    caseIds: [...new Set([CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.caseId, CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.caseId, ...experiments.filter(item => item.id === REGISTRATION_EXPERIMENT_ID).map(item => item.caseRef?.id).filter(Boolean)])],
    blockedCaseIds: ['mcp-project-registration-discovery', 'mcp-fixed-tool-selection'],
  } : null;
};

export const buildActionableLearningFocus = ({ cases, blockedFocus, actionableCaseIds, tracePolicyCaseIds, trialReadyCaseIds, externalExecutionCaseIds }) => {
  const blockedCaseIds = new Set(blockedFocus?.blockedCaseIds ?? []);
  const policyCaseIds = new Set(tracePolicyCaseIds ?? []); const readyCaseIds = new Set(trialReadyCaseIds ?? []); const externalCaseIds = new Set(externalExecutionCaseIds ?? []);
  const behaviorCases = cases.filter(item => item.coverageClass === 'behavior');
  const casesById = new Map(behaviorCases.map(item => [item.id, item]));
  const candidates = actionableCaseIds ?? behaviorCases.map(item => item.id);
  const caseChannels = [...new Set(candidates)].filter(caseId => casesById.has(caseId)).map(caseId => ({
    caseId,
    status: blockedCaseIds.has(caseId) ? 'externally-blocked'
      : policyCaseIds.has(caseId) && readyCaseIds.has(caseId)
        ? 'fresh-task-observation-ready' : 'preparation-required',
  }));
  const ready = caseChannels.filter(item => item.status === 'fresh-task-observation-ready').slice(0, 3);
  if (ready.length > 0) return {
    id: 'continue-repository-behavior-coverage',
    status: 'actionable',
    nextAction: '执行已有完整 trace policy、ready paired experiment 与 ready ingestion 的 fresh-task behavior case；deterministic/component 证据不冒充行为通过',
    caseIds: ready.map(item => item.caseId),
    caseChannels: ready,
  };
  const target = caseChannels.find(item => item.status === 'preparation-required' && externalCaseIds.has(item.caseId))
    ?? caseChannels.find(item => item.status === 'preparation-required' && casesById.get(item.caseId)?.tags?.includes('ai-infra'))
    ?? caseChannels.find(item => item.status === 'preparation-required'); const externalExecutionRequired = externalCaseIds.has(target?.caseId);
  return {
    id: 'prepare-behavior-evidence-channel',
    status: 'preparation-required',
    ...(externalExecutionRequired ? { reasonCode: 'external-execution-required', executionStatus: 'prepared', ingestionStatus: 'unavailable', ingestionReasonCode: 'protected-assignment-trust-unavailable' } : { reasonCode: 'evidence-channel-components-missing' }),
    nextAction: externalExecutionRequired ? '在仓外受保护环境执行已准备的 paired trial，并通过受保护 assignment/environment/receipt ingestion 回收；不得用更多 component scaffold 代替真实 behavior 观测'
      : '先为目标 case 建立 fresh-context paired trial、可复核 grade 与 receipt ingestion，再执行真实 behavior 评测',
    caseIds: target ? [target.caseId] : [],
    caseChannels: target ? [target] : [],
  };
};
