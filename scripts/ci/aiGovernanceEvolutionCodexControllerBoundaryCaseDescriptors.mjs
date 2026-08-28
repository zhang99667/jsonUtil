import { CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE } from './aiGovernanceCodexExternalControllerRuntimeProbe.mjs';
import { CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL } from './aiGovernanceCodexExternalControllerSeatbeltSentinel.mjs';
import { CODEX_EXTERNAL_CONTROLLER_TOPOLOGY } from './aiGovernanceCodexExternalControllerTopology.mjs';

const nodeTest = (...files) => ['--test', ...files];

export const AI_EVOLUTION_CODEX_CONTROLLER_BOUNDARY_CASES = Object.freeze({
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
    caseVersion: 5,
    subjectVersion: CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL.version,
    evidenceScope: 'component-only',
    evidence: ['source-state v2 snapshot 互操作、精确外层 sandbox 能力门控、OpenAI Codex code identity/Seatbelt、source 零变更、disposable mirror 控制组、postflight 与固定负声明'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceCodexExternalControllerSeatbeltSentinel.test.mjs',
      'scripts/ci/aiGovernanceRegistrationCanarySealedSnapshot.test.mjs',
      'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/seatbelt-sentinel-test-host.test.mjs',
      'plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/seatbelt-sentinel.test.mjs',
    )],
  },
});
