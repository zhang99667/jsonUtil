import { CODEX_AGENT_PROFILE_CONTRACT } from './aiGovernanceCodexAgentProfiles.mjs';

export const AI_EVOLUTION_CODEX_AGENT_CASES = Object.freeze({
  [CODEX_AGENT_PROFILE_CONTRACT.caseId]: {
    caseVersion: 1,
    subjectVersion: CODEX_AGENT_PROFILE_CONTRACT.version,
    evidenceScope: 'component-only',
    evidence: ['固定 explorer/worker/verifier、canonical TOML、sandbox、职责、隐私与回传模板正反例'],
    argsList: [['--test', 'scripts/ci/aiGovernanceCodexAgentProfiles.test.mjs']],
  },
});
