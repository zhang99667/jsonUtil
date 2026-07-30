import { CODEX_EXEC_TRACE_ADAPTER } from './aiGovernanceCodexExecTraceAdapter.mjs';
import { CODEX_FIXED_MCP_TRIAL_RUNNER } from './aiGovernanceCodexFixedMcpTrialProfile.mjs';

const nodeTest = (...files) => ['--test', ...files];

export const AI_EVOLUTION_CODEX_TRIAL_BOUNDARY_CASES = Object.freeze({
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
});
