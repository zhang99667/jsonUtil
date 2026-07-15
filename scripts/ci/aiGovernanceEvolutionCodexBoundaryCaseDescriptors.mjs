import { CODEX_EXEC_TRACE_ADAPTER } from './aiGovernanceCodexExecTraceAdapter.mjs';
import { CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE } from './aiGovernanceCodexExternalControllerRuntimeProbe.mjs';
import { CODEX_EXTERNAL_CONTROLLER_SEATBELT_SENTINEL } from './aiGovernanceCodexExternalControllerSeatbeltSentinel.mjs';
import { CODEX_EXTERNAL_CONTROLLER_TOPOLOGY } from './aiGovernanceCodexExternalControllerTopology.mjs';
import { CODEX_FIXED_MCP_TRIAL_RUNNER } from './aiGovernanceCodexFixedMcpTrialProfile.mjs';
import { PROJECT_PLUGIN_SKILL_CONTRACT } from './aiGovernanceProjectPluginSkillContract.mjs';

const nodeTest = (...files) => ['--test', ...files];

export const AI_EVOLUTION_CODEX_BOUNDARY_CASES = Object.freeze({
  'codex-exec-jsonl-adapter-boundary': {
    caseVersion: 3,
    subjectVersion: CODEX_EXEC_TRACE_ADAPTER.version,
    evidenceScope: 'component-only',
    evidence: ['Codex JSONL 版本锁定、流完整性、能力标记与敏感正文脱敏正反例'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceCodexExecJsonlFraming.test.mjs',
      'scripts/ci/aiGovernanceCodexExecTraceProjection.test.mjs',
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
  [PROJECT_PLUGIN_SKILL_CONTRACT.caseId]: {
    caseVersion: 8,
    subjectVersion: PROJECT_PLUGIN_SKILL_CONTRACT.version,
    evidenceScope: 'component-only',
    evidence: ['canonical/plugin Skill 稳定有界 source、共享官方 optional 字段值语义、项目 JSON 唯一 authority、严格 SemVer、文件+目录聚合快照与 write-lock 写后回滚'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceJsonAuthority.test.mjs',
      'scripts/ci/aiGovernanceSemver.test.mjs',
      'scripts/ci/aiGovernanceSkillOptionalFieldsContract.test.mjs', 'scripts/ci/aiGovernanceSkillYamlAmbiguity.test.mjs',
      'scripts/ci/aiGovernanceSkillUiYamlAmbiguity.test.mjs',
      'scripts/ci/aiGovernanceSkillSourceTextContract.test.mjs',
      'scripts/ci/aiGovernanceSkillUiContract.test.mjs',
      'scripts/ci/aiGovernanceSkillEvalContract.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginManifestContract.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginJsonAuthority.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginSkillOptionalFields.test.mjs', 'scripts/ci/aiGovernanceProjectPluginSkillSourceContract.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginSkillContract.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginSourceIdentity.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginLock.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginLockWriteRace.test.mjs',
    )],
  },
});
