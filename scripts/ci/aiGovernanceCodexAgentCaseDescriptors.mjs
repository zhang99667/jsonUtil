import { CODEX_AGENT_PROFILE_CONTRACT } from './aiGovernanceCodexAgentProfiles.mjs';

export const AI_EVOLUTION_CODEX_AGENT_CASES = Object.freeze({
  [CODEX_AGENT_PROFILE_CONTRACT.caseId]: {
    caseVersion: 3,
    subjectVersion: CODEX_AGENT_PROFILE_CONTRACT.version,
    evidenceScope: 'component-only',
    evidence: ['三个通用角色与跨 Codex/Claude/Copilot 只读 ai-infra-auditor、canonical adapter、工具白名单、触发边界、sandbox/父权限覆盖、完整 workspace manifest 和 component-only 正反例'],
    argsList: [['--test', 'scripts/ci/aiGovernanceCodexAgentProfiles.test.mjs', 'scripts/ci/aiGovernanceProjectAiInfraAuditor.test.mjs']],
  },
});
