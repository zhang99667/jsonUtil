import { CODEX_SESSION_START_HOOK_CONTRACT } from './aiGovernanceCodexHooks.mjs';

export const AI_EVOLUTION_CODEX_HOOK_CASES = Object.freeze({
  [CODEX_SESSION_START_HOOK_CONTRACT.caseId]: {
    caseVersion: 2,
    subjectVersion: CODEX_SESSION_START_HOOK_CONTRACT.version,
    evidenceScope: 'component-only',
    evidence: ['单一 SessionStart 四来源闭字段配置、有界只读 runtime、确定 advisory、路径/注入/隐私正反例'],
    argsList: [['--test', 'scripts/ci/aiGovernanceCodexHooks.test.mjs']],
  },
});
