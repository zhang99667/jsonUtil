import { CODEX_EXEC_TRACE_ADAPTER } from './aiGovernanceCodexExecTraceAdapter.mjs';
import { AI_EVOLUTION_CODEX_AGENT_CASES } from './aiGovernanceCodexAgentCaseDescriptors.mjs';
import { AI_EVOLUTION_CODEX_HOOK_CASES } from './aiGovernanceCodexHookCaseDescriptors.mjs';
import { AI_EVOLUTION_CODEX_ATTESTED_CONTROLLER_CASES } from './aiGovernanceCodexExternalControllerAttestedCaseDescriptors.mjs';
import { CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE } from './aiGovernanceCodexExternalControllerRuntimeProbe.mjs';
import { CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL } from './aiGovernanceCodexExternalControllerSeatbeltSentinel.mjs';
import { CODEX_EXTERNAL_CONTROLLER_TOPOLOGY } from './aiGovernanceCodexExternalControllerTopology.mjs';
import { CODEX_FIXED_MCP_TRIAL_RUNNER } from './aiGovernanceCodexFixedMcpTrialProfile.mjs';
import { AI_EVOLUTION_REGISTRATION_CANARY_CASES } from './aiGovernanceRegistrationCanaryCaseDescriptors.mjs';

const nodeTest = (...files) => ['--test', ...files];

export const AI_EVOLUTION_CODEX_CASES = Object.freeze({
  ...AI_EVOLUTION_CODEX_AGENT_CASES,
  ...AI_EVOLUTION_CODEX_HOOK_CASES,
  ...AI_EVOLUTION_CODEX_ATTESTED_CONTROLLER_CASES,
  ...AI_EVOLUTION_REGISTRATION_CANARY_CASES,
  'codex-exec-jsonl-adapter-boundary': {
    caseVersion: 2,
    subjectVersion: CODEX_EXEC_TRACE_ADAPTER.version,
    evidenceScope: 'component-only',
    evidence: ['Codex JSONL 版本锁定、流完整性、能力标记与敏感正文脱敏正反例'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceCodexExecTraceAdapter.test.mjs',
      'scripts/ci/aiGovernanceEvolutionTracePolicies.test.mjs',
    )],
  },
  'codex-fixed-mcp-trial-proof-boundary': {
    caseVersion: 4,
    subjectVersion: CODEX_FIXED_MCP_TRIAL_RUNNER.version,
    evidenceScope: 'component-only',
    evidence: ['pure projector、不可执行 descriptor、闭字段 artifact、preflight 凭据守卫、空认证根与 ledger 终点负例'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceCodexFixedMcpTrial.test.mjs',
      'scripts/ci/aiGovernanceCodexFixedMcpTrialCapture.test.mjs',
      'scripts/ci/aiGovernanceCodexFixedMcpTrialLedger.test.mjs',
      'scripts/ci/run-ai-codex-fixed-mcp-trial.test.mjs',
      'scripts/ci/aiGovernanceEvolutionTraceProof.test.mjs',
    )],
  },
  [CODEX_EXTERNAL_CONTROLLER_TOPOLOGY.caseId]: {
    caseVersion: 1,
    subjectVersion: CODEX_EXTERNAL_CONTROLLER_TOPOLOGY.version,
    evidenceScope: 'component-only',
    evidence: ['闭字段 dry-run plan、host binding、独立 trust/UID/namespace、keyless MCP 与外部 sanitizer/signer 负例'],
    argsList: [nodeTest('scripts/ci/aiGovernanceCodexExternalControllerTopology.test.mjs')],
  },
  [CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.caseId]: {
    caseVersion: 2,
    subjectVersion: CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.version,
    evidenceScope: 'component-only',
    evidence: ['闭字段三 workload credential/snapshot subset 报告、host binding、runtime capability、清理与过度声明负例'],
    argsList: [nodeTest('scripts/ci/aiGovernanceCodexExternalControllerRuntimeProbe.test.mjs')],
  },
  [CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.caseId]: {
    caseVersion: 4,
    subjectVersion: CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.version,
    evidenceScope: 'component-only',
    evidence: ['source-state v2 snapshot 互操作、OpenAI Codex code identity/Seatbelt、source 零变更、disposable mirror 控制组、postflight 与固定负声明'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceCodexExternalControllerSeatbeltSentinel.test.mjs',
      'scripts/ci/aiGovernanceRegistrationCanarySealedSnapshot.test.mjs',
      'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/seatbelt-sentinel.test.mjs',
    )],
  },
});
